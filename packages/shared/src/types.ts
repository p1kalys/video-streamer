// Shared TypeScript types

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  userId: string;
  url: string;
  thumbnailUrl?: string;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
