import { z } from 'zod';

const envSchema = z.object({
  VITE_API_URL: z.string().url().default('http://localhost:5000'),
  VITE_SOCKET_URL: z.string().url().default('http://localhost:5000'),
  MODE: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(import.meta.env);
} catch (e) {
  if (e instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(e.flatten().fieldErrors, null, 2));
    
    e.issues.forEach((err) => {
      const path = err.path.join('.');
      console.error(`  ${path}: ${err.message}`);
    });
    
    throw new Error('Invalid environment configuration');
  }
  
  throw e;
}

export const isProd = () => env.MODE === 'production';
export const isDev = () => env.MODE === 'development';
export const isTest = () => env.MODE === 'test';

export default env;
export { env };
