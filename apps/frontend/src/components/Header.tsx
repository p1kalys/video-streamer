import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const canUpload = user?.role === 'editor' || user?.role === 'admin';

  return (
    <nav className="bg-white shadow-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="text-xl font-bold text-stone-900 hover:text-stone-800 transition-colors duration-200 flex items-center gap-2">
              <span className="hidden sm:inline">Video Streamer</span>
            </Link>

            <div className="hidden md:flex gap-6">
              <Link
                to="/dashboard"
                className="text-stone-700 hover:text-stone-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-stone-100"
              >
                Dashboard
              </Link>
              {canUpload && (
                <Link
                  to="/upload"
                  className="text-stone-700 hover:text-stone-600 font-medium transition-colors duration-200 px-3 py-2 rounded-md hover:bg-stone-100"
                >
                  Upload
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 px-4 py-2 rounded-md">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-stone-500 to-stone-600 text-white font-semibold text-sm shadow-md">
                {user?.firstName?.charAt(0)}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-semibold text-stone-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-stone-700 capitalize flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-md bg-stone-400"></span>
                  {user?.role}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-stone-600 text-white px-4 py-2 rounded-md hover:bg-stone-700 transition-all duration-200 font-medium text-sm shadow-sm hover:shadow-md transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
