import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../services/api';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import Header from '../components/Header';

interface Video {
  _id: string;
  title: string;
  description?: string;
  processing: {
    status: string;
    result?: {
      sensitivity: string;
      confidence: number
    }
  };
  fileInfo: { size: number };
  createdAt: string;
  uploadedBy?: string | { _id: string; firstName: string; lastName: string; email: string };
}

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const { on } = useSocket();
  const hasShownToast = useRef(false);

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sensitivityFilter, setSensitivityFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    const message = (location.state as any)?.message;
    if (message && !hasShownToast.current) {
      toast.success(message);
      hasShownToast.current = true;
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchVideos = useCallback(async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (filter) params.append('status', filter);
      if (searchTerm) params.append('search', searchTerm);
      if (sensitivityFilter !== 'all') params.append('sensitivity', sensitivityFilter);

      if (user?.role === 'viewer') {
        params.append('userOnly', 'true');
      }

      const response = await api.get<{
        success: true;
        data: { videos: Video[]; pagination: { page: number; limit: number; total: number; pages: number } };
      }>(`/videos/list?${params}`);

      if (response.success && response.data) {
        setVideos(response.data.videos);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, sensitivityFilter, user?.role]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Listen for real-time updates
  useEffect(() => {
    const unsubComplete = on('processing_completed', (data) => {
      console.log('📹 Processing completed event:', data);
      setVideos((prev) =>
        prev.map((v) =>
          v._id === data.videoId
            ? { ...v, processing: { status: 'completed', result: data.result } }
            : v
        )
      );
    });

    const unsubStarted = on('processing_started', (data) => {
      console.log('📹 Processing started event:', data);
      setVideos((prev) =>
        prev.map((v) =>
          v._id === data.videoId
            ? { ...v, processing: { ...v.processing, status: 'processing' } }
            : v
        )
      );
    });

    return () => {
      unsubComplete?.();
      unsubStarted?.();
    };
  }, [on]);

  const handleDelete = (videoId: string) => {
    setVideos((prev) => prev.filter((v) => v._id !== videoId));
  };

  const canUpload = user?.role === 'editor' || user?.role === 'admin';

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1">
            {/* Search Bar */}
            <div className="flex gap-4 mb-4 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-stone-600 mb-1">Search</label>
                <input
                  type="text"
                  placeholder="Search videos by title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Status</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>

              {/* Sensitivity Filter */}
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Sensitivity</label>
                <select
                  value={sensitivityFilter}
                  onChange={(e) => setSensitivityFilter(e.target.value)}
                  className="px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                >
                  <option value="all">All</option>
                  <option value="safe">Safe</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              {/* Items Per Page */}
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Per Page</label>
                <select
                  value={pagination.limit}
                  onChange={(e) => {
                    const newLimit = parseInt(e.target.value);
                    setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
                    fetchVideos(1, newLimit);
                  }}
                  className="px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 text-stone-500 bg-white rounded-md shadow p-8">
            <p className="text-lg mb-2">No videos found.</p>
            {canUpload && <p>Upload videos to classify.</p>}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video._id}
                  video={video}
                  onDelete={handleDelete}
                  userRole={user?.role}
                  currentUserId={user?.id}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex justify-center items-center space-x-2">
                <button
                  onClick={() => fetchVideos(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => fetchVideos(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md transition ${pageNum === pagination.page
                        ? 'bg-stone-700 text-white'
                        : 'text-stone-700 bg-white border border-stone-300 hover:bg-stone-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => fetchVideos(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-2 text-sm font-medium text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            )}

            {/* Results Summary */}
            <div className="mt-4 text-center text-sm text-stone-600">
              Showing {videos.length} of {pagination.total} videos
              {pagination.pages > 1 && ` (Page ${pagination.page} of ${pagination.pages})`}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
