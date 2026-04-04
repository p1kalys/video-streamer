import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Video {
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
  };
  createdAt: string;
  uploadedBy?: string | { _id: string; firstName: string; lastName: string; email: string };
}

interface Props {
  video: Video;
  onDelete?: (videoId: string) => void;
  userRole?: string;
  currentUserId?: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-stone-100 text-stone-800',
  processing: 'bg-stone-100 text-stone-800',
  completed: 'bg-stone-100 text-stone-800',
  failed: 'bg-stone-100 text-stone-800',
};

const sensitivityColors: Record<string, string> = {
  safe: 'bg-emerald-500',
  flagged: 'bg-red-500',
  review: 'bg-amber-500',
};

const VideoCard: React.FC<Props> = ({ video, onDelete, userRole, currentUserId }) => {
  const [confirming, setConfirming] = useState(false);
  const status = video.processing.status;
  const sensitivity = video.processing.result?.sensitivity;

  // Check if user can delete this video
  const getVideoUploaderId = () => {
    if (typeof video.uploadedBy === 'string') {
      return video.uploadedBy;
    } else if (video.uploadedBy && typeof video.uploadedBy === 'object') {
      return video.uploadedBy._id;
    }
    return null;
  };

  const videoUploaderId = getVideoUploaderId();
  const canDelete =
    userRole === 'admin' || // Admin can delete any video
    (userRole === 'editor' && videoUploaderId === currentUserId); // Editor can delete only their own videos

  // Debug logging
  console.log('VideoCard Debug:', {
    videoId: video._id,
    userRole,
    currentUserId,
    videoUploadedBy: video.uploadedBy,
    videoUploaderId,
    canDelete
  });

  const handleDelete = async () => {
    try {
      const response = await api.delete<{ success: true; data: { message: string } }>(
        `/videos/${video._id}`
      );
      if (response.success) {
        onDelete?.(video._id);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-105 group relative">
      {/* Flagged Status Bar - Prominent top border with tooltip */}
      {sensitivity && (
        <>
          <div
            className={`h-1 ${sensitivityColors[sensitivity]}`}
          />
          {/* Tooltip */}
          <div className="absolute top-2 right-2 transition-opacity duration-300 z-10">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-md shadow-lg ${sensitivity === 'safe'
              ? 'bg-emerald-600 text-white'
              : sensitivity === 'flagged'
                ? 'bg-red-600 text-white'
                : 'bg-stone-600 text-white'
              }`}>
              {sensitivity.toUpperCase()}
            </span>
          </div>
        </>
      )}

      <div className="aspect-video bg-gradient-to-br from-stone-100 to-stone-200 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-16 h-16 text-stone-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v.764a1 1 0 01-1.447.894L15 10m0 0v4m0 0l-4.553 2.276A1 1 0 018 15.382v-.764a1 1 0 011.447-.894L15 10z"
            />
          </svg>
        </div>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-stone-900 text-lg truncate pr-2">
              {video.title}
            </h3>
            {video.description && (
              <p className="text-sm text-stone-600 mt-1 line-clamp-2">
                {video.description}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 ml-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md shadow-sm ${statusColors[status]}`}>
              {status}
            </span>
            <span className="text-xs text-stone-400">
              {(video.fileInfo.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
        </div>

        {status === 'completed' && (
          <Link
            to={`/video/${video._id}`}
            className="mt-4 block w-full bg-stone-700 text-white py-3 rounded-md font-medium hover:bg-stone-800 transition-all duration-200 text-center transform hover:scale-105"
          >
            Watch Video
          </Link>
        )}

        <div className="mt-3 pt-3 border-t border-stone-200">
          {canDelete ? (
            confirming ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 bg-red-600 text-white py-2 rounded-md font-medium hover:bg-red-700 transition-all duration-200"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 bg-stone-200 py-2 rounded-md font-medium hover:bg-stone-300 transition-all duration-200 text-stone-700"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirming(true)}
                className="w-full text-red-600 hover:text-red-700 font-medium transition-colors duration-200 py-2 rounded-md hover:bg-red-50"
              >
                Delete Video
              </button>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
