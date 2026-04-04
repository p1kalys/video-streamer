import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../services/api';
import type { LoginResponse, RegisterResponse } from '../services/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          // First decode JWT to get basic info
          const payload = JSON.parse(atob(token.split('.')[1]));

          // Then fetch full user data from API
          const response = await api.get<{
            success: true;
            data: { user: User };
          }>('/auth/me');

          if (response.success) {
            setUser(response.data.user);
          } else {
            // Fallback to basic JWT data if API fails
            setUser({
              id: payload.userId,
              email: payload.email,
              firstName: '',
              lastName: '',
              role: payload.role,
            });
          }
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          api.clearToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        email,
        password,
      });

      if (response.success) {
        api.setToken(response.data.token);
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          role: response.data.user.role,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string, role: string) => {
    try {
      const response = await api.post<RegisterResponse>('/auth/register', {
        email,
        password,
        firstName,
        lastName,
        role,
      });

      if (response.success) {
        api.setToken(response.data.token);
        setUser({
          id: response.data.user.id,
          email: response.data.user.email,
          firstName: response.data.user.firstName,
          lastName: response.data.user.lastName,
          role: response.data.user.role,
        });
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
