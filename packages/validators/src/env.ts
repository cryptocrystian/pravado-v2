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
  // LLM configuration (S16 - optional, falls back to stub)
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'stub']).default('stub'),
  LLM_OPENAI_API_KEY: z.string().optional(),
  LLM_OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  LLM_ANTHROPIC_API_KEY: z.string().optional(),
  LLM_ANTHROPIC_MODEL: z.string().default('claude-3-5-sonnet-20241022'),
  LLM_TIMEOUT_MS: z.coerce.number().default(20000),
  LLM_MAX_TOKENS: z.coerce.number().default(2048),
  // Billing configuration (S28 - optional, falls back to internal-dev)
  BILLING_DEFAULT_PLAN_SLUG: z.string().default('internal-dev'),
  // Stripe configuration (S30 - optional, required only if ENABLE_STRIPE_BILLING is true)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_GROWTH: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE: z.string().optional(),
  BILLING_PORTAL_RETURN_URL: z.string().url().optional(),
  // Audit export configuration (S36 - optional)
  AUDIT_EXPORT_STORAGE_DIR: z.string().default('/tmp/audit_exports'),
  // Platform freeze mode (S78 - optional, default false)
  // When true, blocks all write operations to core intelligence domains
  PLATFORM_FREEZE: z
    .enum(['true', 'false', '1', '0'])
    .default('false')
    .transform((val) => val === 'true' || val === '1'),
});

export const dashboardEnvSchema = baseEnvSchema.extend({
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Required for building invite links
  NEXT_PUBLIC_DASHBOARD_URL: z.string().url().default('http://localhost:3000'),
  // Stripe configuration (S30 - optional, required only if ENABLE_STRIPE_BILLING is true)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
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
