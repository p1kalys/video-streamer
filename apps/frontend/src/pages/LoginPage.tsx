import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { loginSchema } from '@video-streamer/shared';
import type { LoginInput } from '@video-streamer/shared';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginInput) => {
    const result = loginSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof LoginInput;
        setError(fieldName, {
          type: 'manual',
          message: issue.message,
        });
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await login(data.email, data.password);
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="p-8 space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Sign In</h1>
          </div>

          {apiError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-stone-700 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                placeholder="********"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-stone-700 text-white py-2 rounded-md font-semibold hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-stone-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-stone-700 hover:text-stone-600">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
