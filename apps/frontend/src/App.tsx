import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import PlayerPage from './pages/PlayerPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path=""
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video/:videoId"
          element={
            <ProtectedRoute>
              <PlayerPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#374151',
            color: '#fff',
          },
        }}
      />
    </BrowserRouter>
  );
}

export default App;
