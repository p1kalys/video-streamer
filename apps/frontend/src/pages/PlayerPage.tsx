import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { env } from '../config/env';
import Header from '../components/Header';

interface VideoDetails {
  _id: string;
  title: string;
  description?: string;
  processing: {
    status: string;
    result?: {
      sensitivity: string;
      confidence: number;
    };
  };
  fileInfo: {
    size: number;
    mimeType: string;
  };
  metadata?: {
    duration?: number;
  };
  viewCount: number;
  createdAt: string;
}

const PlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const response = await api.get<{ success: true; data: { video: VideoDetails } }>(
          `/videos/${videoId}`
        );

        if (response.success && response.data) {
          setVideo(response.data.video);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load video');
      } finally {
        setLoading(false);
      }
    };

    if (videoId) fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-stone-900 text-xl font-medium">Loading...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50">
        <p className="text-red-600 text-xl font-semibold mb-4">{error || 'Video not found'}</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-stone-700 text-white px-6 py-2 rounded-md hover:bg-stone-800 transition font-medium"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const streamUrl = `${env.VITE_API_URL}/api/videos/${videoId}/stream`;
  const token = localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-6xl mx-auto py-6 px-4">
        {/* Video Player */}
        <div className="bg-white rounded-md shadow-lg overflow-hidden">
          <div className="aspect-video bg-black">
            {video.processing.status === 'completed' ? (
              <video
                controls
                className="w-full h-full"
                src={`${streamUrl}?token=${token}`}
                controlsList="nodownload"
              >
                <source
                  src={`${streamUrl}?token=${token}`}
                  type={video.fileInfo.mimeType}
                />
                Your browser does not support video playback.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-xl">Video is still processing...</p>
                  <p className="text-gray-400 mt-2">Status: {video.processing.status}</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <div className="bg-white p-6">
            <h1 className="text-2xl font-bold text-gray-900">{video.title}</h1>
            {video.description && (
              <p className="text-gray-600 mt-2 leading-relaxed">{video.description}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {video.processing.result && (
                <>
                  <span
                    className={`px-3 py-1 rounded-md font-medium text-xs border-2 ${video.processing.result.sensitivity === 'safe'
                      ? 'border-green-500 text-green-700 bg-green-50'
                      : video.processing.result.sensitivity === 'flagged'
                        ? 'border-red-500 text-red-700 bg-red-50'
                        : 'border-yellow-500 text-yellow-700 bg-yellow-50'
                      }`}
                  >
                    {video.processing.result.sensitivity.toUpperCase()} • {video.processing.result.confidence}% confidence
                  </span>
                </>
              )}
              <div className="flex items-center gap-1.5 text-gray-600">
                <span><strong>Date Uploaded:</strong> {new Date(video.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerPage;
