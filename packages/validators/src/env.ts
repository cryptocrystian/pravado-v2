/**
 * Environment variable validation schemas
 */

import { z } from 'zod';

export const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().min(1).max(65535).default(3001),
  API_HOST: z.string().default('localhost'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  COOKIE_SECRET: z.string().default('pravado-cookie-secret'),
  // Email configuration (optional - falls back to console logging)
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_FROM_EMAIL: z.string().email().optional(),
  DASHBOARD_URL: z.string().url().default('http://localhost:3000'),
});

export const dashboardEnvSchema = baseEnvSchema.extend({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Required for building invite links
  NEXT_PUBLIC_DASHBOARD_URL: z.string().url().default('http://localhost:3000'),
});

export const mobileEnvSchema = baseEnvSchema.extend({
  EXPO_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type DashboardEnv = z.infer<typeof dashboardEnvSchema>;
export type MobileEnv = z.infer<typeof mobileEnvSchema>;

/**
 * Validate and parse environment variables
 * @throws {Error} if validation fails
 */
export function validateEnv<T extends z.ZodType>(
  schema: T,
  env: Record<string, unknown> = process.env
): z.infer<T> {
  const result = schema.safeParse(env);

  if (!result.success) {
    const errors = result.error.format();
    console.error('Environment validation failed:', errors);
    throw new Error('Invalid environment configuration');
  }

  return result.data;
}
