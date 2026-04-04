import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import FileUpload from './FileUpload';
import { api } from '../services/api';
import type { VideoUploadResponse } from '../services/api';
import { videoUploadSchema } from '@video-streamer/shared';
import type { z } from 'zod';

type UploadFormData = z.infer<typeof videoUploadSchema>;

export default function VideoUpload() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UploadFormData>({
    resolver: zodResolver(videoUploadSchema),
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError('');
  };

  const onSubmit = async (data: UploadFormData) => {
    if (!selectedFile) {
      setError('Please select a video file');
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('video', selectedFile);
      formData.append('title', data.title);
      if (data.description) {
        formData.append('description', data.description);
      }

      const response = await api.upload<VideoUploadResponse>(
        '/videos/upload',
        formData,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      if (response.success) {
        // Reset form
        reset();
        setSelectedFile(null);
        setUploadProgress(0);

        // Navigate to dashboard
        navigate('/dashboard', {
          state: {
            message: 'Video uploaded successfully! Processing will start shortly.',
            videoId: response.data.videoId
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    reset();
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 gap-6">
        {/* Upload Form */}
        <div>
          <div className="p-6">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {!selectedFile ? (
                <FileUpload onFileSelect={handleFileSelect} />
              ) : (
                <div className="border border-emerald-200 bg-emerald-50 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">🎬</div>
                      <div>
                        <p className="font-medium text-stone-900">{selectedFile.name}</p>
                        <p className="text-sm text-stone-600">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Title Input */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-2">
                  Video Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('title')}
                  type="text"
                  id="title"
                  disabled={isUploading}
                  className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter video title"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description Input */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-stone-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={4}
                  disabled={isUploading}
                  className="w-full px-4 py-3 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                  placeholder="Enter video description (optional)"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-stone-600">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-md h-3 overflow-hidden">
                    <div
                      className="bg-stone-600 h-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="w-full bg-stone-700 text-white py-3 rounded-md font-semibold hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? `Uploading ${uploadProgress}%...` : 'Upload Video'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
