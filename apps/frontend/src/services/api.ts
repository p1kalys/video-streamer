import { env } from '../config/env';

const API_BASE_URL = env.VITE_API_URL;

interface ApiError {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_BASE_URL}/api`;
  }

  // Token management
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  clearToken(): void {
    localStorage.removeItem('token');
  }

  // Build headers with auth token
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...customHeaders,
    };

    const token = this.getToken();
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  // Handle fetch response
  private async handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      // Unauthorized - clear token and redirect to login
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new Error(error.error?.message || 'An error occurred');
    }

    return data;
  }

  // Generic HTTP methods
  async get<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'GET',
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'POST',
      headers: this.getHeaders(options?.headers),
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async put<T>(url: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: JSON.stringify(data),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  // File upload with progress (using XMLHttpRequest for progress tracking)
  async upload<T>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentCompleted = Math.round((event.loaded * 100) / event.total);
            onProgress(percentCompleted);
          }
        });
      }

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 401) {
          this.clearToken();
          window.location.href = '/login';
          reject(new Error('Unauthorized'));
          return;
        }

        try {
          const data = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            const error = data as ApiError;
            reject(new Error(error.error?.message || 'Upload failed'));
          }
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        reject(new Error('Network error occurred'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload cancelled'));
      });

      // Open and send request
      xhr.open('POST', `${this.baseURL}${url}`);
      
      const token = this.getToken();
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.send(formData);
    });
  }
}

// Export singleton instance
export const api = new ApiService();

// Export types for responses
export interface LoginResponse {
  success: true;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  };
}

export interface RegisterResponse {
  success: true;
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: string;
    };
  };
}

export interface Video {
  _id: string;
  title: string;
  description?: string;
  filename: string;
  filepath: string;
  mimetype: string;
  size: number;
  processing: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    result?: {
      sensitivity: 'safe' | 'flagged' | 'review';
      confidence: number;
      processedAt: string;
    };
    error?: string;
  };
  uploadedBy: string;
  uploadedAt: string;
  isDeleted: boolean;
}

export interface VideoListResponse {
  success: true;
  data: {
    videos: Video[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface VideoUploadResponse {
  success: true;
  data: {
    videoId: string;
    message: string;
  };
}
