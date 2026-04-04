import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { registerSchema } from '@video-streamer/shared';
import type { RegisterInput } from '@video-streamer/shared';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    mode: 'onChange',
  });


  const onSubmit = async (data: RegisterInput) => {
    const result = registerSchema.safeParse(data);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof RegisterInput;
        setError(fieldName, {
          type: 'manual',
          message: issue.message,
        });
      });
      return;
    }

    setIsLoading(true);

    try {
      await registerUser(data.email, data.password, data.firstName, data.lastName, data.role);
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center py-6 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="p-8 space-y-4">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Create Account</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-1">
                First Name
              </label>
              <input
                {...register('firstName')}
                type="text"
                id="firstName"
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                placeholder="Enter your first name"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-1">
                Last Name
              </label>
              <input
                {...register('lastName')}
                type="text"
                id="lastName"
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                placeholder="Enter your last name"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                Email Address
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
                placeholder="Create a strong password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-stone-700 mb-1">
                Account Type
              </label>
              <select
                {...register('role')}
                id="role"
                className="w-full px-4 py-2 border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-500 focus:border-transparent outline-none transition"
                defaultValue=""
              >
                <option value="" disabled>Select your role</option>
                <option value="admin">Administrator</option>
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-stone-700 text-white py-2 rounded-md font-semibold hover:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-stone-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-stone-700 hover:text-stone-600">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
