import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoUpload from '../components/VideoUpload';
import Header from '../components/Header';

export default function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const message = (location.state as any)?.message;

  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Centered Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-stone-900 mb-2">Upload Video</h1>
        </div>

        {message && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-md">
            {message}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <VideoUpload />
        </div>
      </div>
    </div>
  );
}
