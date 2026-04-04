import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();


const envSchema = z.object({
  NODE_ENV: z.enum(['development']).default('development'),
  APP_STAGE: z.enum(['dev']).default('dev'),
  PORT: z.coerce.number().positive().default(5000),
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(6, 'JWT secret must be at least 6 characters'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'Cloudinary cloud name is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'Cloudinary API key is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'Cloudinary API secret is required'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (e) {
  if (e instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(e.flatten().fieldErrors, null, 2));

    e.issues.forEach((err) => {
      const path = err.path.join('.');
      console.error(`  ${path}: ${err.message}`);
    });

    process.exit(1);
  }

  throw e;
}

export const isDev = () => env.APP_STAGE === 'dev';

export default env;
export { env };
