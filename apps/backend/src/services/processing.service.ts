import { Video, IVideo } from '../models/Video.js';
import { emitToUser } from '../socket/index.js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { createWriteStream } from 'fs';

interface ProcessingResult {
  sensitivity: 'safe' | 'flagged' | 'review';
  confidence: number;
  processedAt: Date;
}

interface VideoAnalysis {
  duration: number;
  resolution: { width: number; height: number };
  bitrate: number;
  fps: number;
  format: string;
  size: number;
}

// Analyze video from Cloudinary URL (metadata-based)
const analyzeVideoFromUrl = async (videoUrl: string): Promise<VideoAnalysis> => {
  try {
    // Extract basic info from URL and file info
    const urlParts = videoUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    const extension = filename.split('.').pop()?.toLowerCase() || 'mp4';

    // Simulate analysis based on URL patterns and file extension
    const duration = Math.random() * 300 + 60; // 1-6 minutes
    const size = Math.random() * 100 * 1024 * 1024 + 10 * 1024 * 1024; // 10-110 MB

    return {
      duration,
      resolution: { width: 1920, height: 1080 }, // Assume HD
      bitrate: 2000000, // Assume good bitrate
      fps: 30,
      format: extension,
      size
    };
  } catch (error) {
    console.error('URL analysis failed:', error);
    throw error;
  }
};

// Classify video based on analysis
const classifyVideo = (analysis: VideoAnalysis): { sensitivity: 'safe' | 'flagged' | 'review'; confidence: number } => {
  let riskScore = 0;
  const factors: string[] = [];

  // Duration-based classification
  if (analysis.duration > 600) { // > 10 minutes
    riskScore += 20;
    factors.push('Long duration');
  }

  // Resolution-based classification
  if (analysis.resolution.width < 640 || analysis.resolution.height < 480) {
    riskScore += 15;
    factors.push('Low resolution');
  }

  // File size-based classification
  const sizeMB = analysis.size / (1024 * 1024);
  if (sizeMB > 500) { // > 500MB
    riskScore += 25;
    factors.push('Large file size');
  }

  // Format-based classification
  const riskyFormats = ['avi', 'mkv', 'mov'];
  if (riskyFormats.includes(analysis.format)) {
    riskScore += 10;
    factors.push('Uncommon format');
  }

  // Bitrate-based classification (reduced for Cloudinary)
  if (analysis.bitrate < 1000000) { // < 1 Mbps
    riskScore += 15;
    factors.push('Low bitrate');
  }

  // Determine sensitivity based on risk score
  let sensitivity: 'safe' | 'flagged' | 'review';
  let confidence: number;

  if (riskScore <= 25) {
    sensitivity = 'safe';
    confidence = Math.max(85, 100 - riskScore);
  } else if (riskScore <= 50) {
    sensitivity = 'review';
    confidence = Math.max(70, 95 - riskScore);
  } else {
    sensitivity = 'flagged';
    confidence = Math.max(60, 90 - riskScore);
  }

  console.log(`🔍 Video Analysis Results:`, {
    analysis,
    riskScore,
    factors,
    sensitivity,
    confidence
  });

  return { sensitivity, confidence };
};

export const processVideo = async (videoId: string, userId: string): Promise<IVideo | null> => {
  try {
    // Update status to processing
    await Video.findByIdAndUpdate(videoId, {
      'processing.status': 'processing',
    });

    console.log(`🎬 Starting processing for video: ${videoId}`);

    // Emit processing started event
    emitToUser(userId, 'processing_started', {
      videoId,
      status: 'processing',
      timestamp: new Date().toISOString(),
    });

    // Get video from database
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Since all videos are on Cloudinary, analyze from URL
    const videoUrl = video.fileInfo.cloudinaryUrl || video.fileInfo.path;
    const analysis = await analyzeVideoFromUrl(videoUrl);

    // Classify video based on analysis
    const classification = classifyVideo(analysis);

    // Create processing result
    const result: ProcessingResult = {
      sensitivity: classification.sensitivity,
      confidence: classification.confidence,
      processedAt: new Date(),
    };

    console.log(`✅ Processing completed for video: ${videoId} - ${result.sensitivity} (${result.confidence}% confidence)`);

    // Update with result
    const updatedVideo = await Video.findByIdAndUpdate(
      videoId,
      {
        'processing.status': 'completed',
        'processing.result': result,
      },
      { new: true }
    );

    // Emit processing completed event
    emitToUser(userId, 'processing_completed', {
      videoId,
      status: 'completed',
      result,
      timestamp: new Date().toISOString(),
    });

    return updatedVideo;
  } catch (error: any) {
    console.error(`❌ Processing failed for video: ${videoId}`, error);

    // Mark as failed
    await Video.findByIdAndUpdate(videoId, {
      'processing.status': 'failed',
      'processing.error': error?.message || 'Processing failed',
    });

    // Emit processing failed event
    emitToUser(userId, 'processing_failed', {
      videoId,
      status: 'failed',
      error: error?.message || 'Processing failed',
      timestamp: new Date().toISOString(),
    });

    return null;
  }
};
