import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number'),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.enum(['admin', 'editor', 'viewer'], {
    message: 'Please select a valid role',
  }),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Video upload schema (simplified for frontend)
export const videoUploadSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export const uploadVideoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const videoListQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  sortBy: z.enum(['uploadDate', 'title', 'size']).default('uploadDate'),
  order: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(100).optional(),
  sensitivity: z.enum(['all', 'safe', 'flagged', 'review']).optional(),
});

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
] as const;

export const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UploadVideoInput = z.infer<typeof uploadVideoSchema>;
export type VideoListQuery = z.infer<typeof videoListQuerySchema>;
