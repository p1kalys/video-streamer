import { Request, Response } from 'express';
import { Video } from '../models/Video.js';
import { UploadVideoInput, VideoListQuery } from '@video-streamer/shared';
import { processVideo } from '../services/processing.service.js';
import config from '../config/index.js';

export const uploadVideo = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No video file uploaded',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Accept any video file regardless of field name
    const file = files[0];

    const { title, description, tags } = req.body as UploadVideoInput;

    // Handle Cloudinary file info
    const fileInfo: any = {
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      cloudinaryUrl: (file as any).cloudinaryUrl || file.path,
      cloudinaryPublicId: (file as any).cloudinaryPublicId || file.filename,
    };

    const video = await Video.create({
      title,
      description,
      tags: tags || [],
      fileInfo,
      uploadedBy: req.user?.userId,
      processing: {
        status: 'pending',
      },
    });

    // Trigger async processing with delay to allow socket reconnection
    // This is necessary because browsers may close WebSocket during large HTTP uploads
    // and need time to reconnect before processing events are emitted
    setTimeout(() => {
      processVideo(video._id.toString(), req.user!.userId).catch((error) => {
        console.error('Failed to start processing:', error);
      });
    }, 2000); // 2 second delay - increased for better reliability

    res.status(201).json({
      success: true,
      data: {
        videoId: video._id,
        title: video.title,
        status: video.processing.status,
        message: 'Video uploaded successfully. Processing will begin shortly.',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Failed to upload video',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const listVideos = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      sortBy = 'uploadDate',
      order = 'desc',
      search,
      sensitivity,
      userOnly = 'false'
    } = req.query as any;

    const userId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    const query: any = {
      deletedAt: null,
    };

    // Admin can see all videos unless userOnly is specified
    if (userRole === 'admin') {
      if (userOnly === 'true') {
        query.uploadedBy = userId;
      }
      // Admin can see all videos by default
    } else if (userRole === 'editor') {
      // Editors see all videos (not restricted to their own)
      // No query restriction for editors
    } else if (userRole === 'viewer') {
      // Viewers see only completed videos
      query['processing.status'] = 'completed';
    }

    // Apply status filter (but not for viewers unless they're filtering completed)
    if (status && userRole !== 'viewer') {
      query['processing.status'] = status;
    }

    // Apply sensitivity filter
    if (sensitivity && sensitivity !== 'all') {
      query['processing.result.sensitivity'] = sensitivity;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortField = sortBy === 'uploadDate' ? 'createdAt' : sortBy;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [videos, total] = await Promise.all([
      Video.find(query)
        .sort({ [sortField]: sortOrder })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('-fileInfo.path')
        .populate('uploadedBy', 'firstName lastName email'),
      Video.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        videos,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch videos',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const getVideoById = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findOne({
      _id: videoId,
      deletedAt: null,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      data: { video },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: 'Failed to fetch video',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const reprocessVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findOne({
      _id: videoId,
      deletedAt: null,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Reset and reprocess
    await Video.findByIdAndUpdate(videoId, {
      'processing.status': 'pending',
      'processing.result': null,
      'processing.error': null,
    });

    processVideo(videoId, req.user!.userId).catch(console.error);

    res.json({
      success: true,
      message: 'Reprocessing started',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'REPROCESS_FAILED',
        message: 'Failed to reprocess video',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const streamVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const video = await Video.findOne({
      _id: videoId,
      deletedAt: null,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Only allow streaming for completed videos
    if (video.processing.status !== 'completed') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VIDEO_NOT_READY',
          message: 'Video is still processing',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Redirect to Cloudinary URL
    if (video.fileInfo.cloudinaryUrl) {
      // Increment view count before redirecting
      video.viewCount += 1;
      await video.save();
      return res.redirect(video.fileInfo.cloudinaryUrl);
    }

    // Fallback to path if it's a URL
    if (video.fileInfo.path && video.fileInfo.path.startsWith('http')) {
      video.viewCount += 1;
      await video.save();
      return res.redirect(video.fileInfo.path);
    }

    // If no URL is available, return an error
    return res.status(404).json({
      success: false,
      error: {
        code: 'VIDEO_URL_NOT_FOUND',
        message: 'Video URL not available',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'STREAM_FAILED',
        message: 'Failed to stream video',
        timestamp: new Date().toISOString(),
      },
    });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    const video = await Video.findOne({
      _id: videoId,
      deletedAt: null,
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Only owner or admin can delete
    if (video.uploadedBy.toString() !== userId && userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own videos',
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Soft delete
    await Video.findByIdAndUpdate(videoId, {
      deletedAt: new Date(),
    });

    res.json({
      success: true,
      data: {
        message: 'Video deleted successfully',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: 'Failed to delete video',
        timestamp: new Date().toISOString(),
      },
    });
  }
};
