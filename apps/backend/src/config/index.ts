import { env } from './env.js';

export const config = {
  PORT: env.PORT,
  NODE_ENV: env.NODE_ENV,
  MONGODB_URI: env.MONGODB_URI,
  JWT_SECRET: env.JWT_SECRET,
  CORS_ORIGIN: env.CORS_ORIGIN,
  CLOUDINARY_CLOUD_NAME: env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: env.CLOUDINARY_API_SECRET || '',
};

export default config;
