/**
 * Environment variable validation schemas
 */

import { z } from 'zod';

export const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const apiEnvSchema = baseEnvSchema.extend({
  API_PORT: z.coerce.number().min(1).max(65535).default(3001),
  API_HOST: z.string().default('localhost'),
  // Deployment environment (staging vs production) - separate from NODE_ENV
  DEPLOYMENT_ENV: z
    .enum(['development', 'staging', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1),
  COOKIE_SECRET: z.string().default('pravado-cookie-secret'),
  // Email configuration (optional - falls back to console logging)
  // Resend (primary)
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional().default('hello@pravado.io'),
  // Outreach send-from + display name (read directly by the provider config
  // resolvers; declared here for schema visibility).
  RESEND_OUTREACH_FROM_EMAIL: z.string().optional(),
  RESEND_FROM_NAME: z.string().optional(),
  // Svix signing secret (whsec_...) for the Resend ENGAGEMENT webhook
  // (delivered/opened/clicked/bounced/complained).
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  // Svix signing secret (whsec_...) for the Resend INBOUND webhook
  // (email.received → reply capture). Falls back to RESEND_WEBHOOK_SECRET when
  // a single Resend endpoint serves both event families.
  RESEND_INBOUND_WEBHOOK_SECRET: z.string().optional(),
  // Mailgun (legacy fallback)
  MAILGUN_API_KEY: z.string().optional(),
  MAILGUN_DOMAIN: z.string().optional(),
  MAILGUN_FROM_EMAIL: z.string().email().optional(),
  // SendGrid configuration (S98)
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),
  SENDGRID_FROM_NAME: z.string().optional(),
  /** SendGrid Event Webhook verification key (ECDSA public key) */
  SENDGRID_WEBHOOK_KEY: z.string().optional(),
  // Email provider selection — must match the EmailProvider union / factory.
  EMAIL_PROVIDER: z
    .enum(['sendgrid', 'resend', 'mailgun', 'ses', 'stub'])
    .default('stub'),
  // Cron secret for scheduler endpoint authentication (S98)
  CRON_SECRET: z.string().optional(),
  DASHBOARD_URL: z.string().url().default('http://localhost:3000'),
  // LLM configuration (S16 - optional, falls back to stub)
  LLM_PROVIDER: z.enum(['openai', 'anthropic', 'stub']).default('stub'),
  LLM_OPENAI_API_KEY: z.string().optional(),
  LLM_OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  LLM_ANTHROPIC_API_KEY: z.string().optional(),
  // STANDARD tier (default). Cost-router tiers per canon LLM_COST_ROUTER —
  // ECONOMY/PREMIUM are optional overrides; the router defaults to Haiku/Sonnet
  // when unset. Set these to pin models or repoint ECONOMY at a self-hosted model.
  LLM_ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-5-20250929'),
  LLM_MODEL_ECONOMY: z.string().optional(),
  LLM_MODEL_PREMIUM: z.string().optional(),
  LLM_TIMEOUT_MS: z.coerce.number().default(20000),
  LLM_MAX_TOKENS: z.coerce.number().default(2048),
  // Billing configuration (S28 - optional, falls back to internal-dev)
  BILLING_DEFAULT_PLAN_SLUG: z.string().default('internal-dev'),
  // Stripe configuration (S30 - optional, required only if ENABLE_STRIPE_BILLING is true)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_STARTER: z.string().optional(),
  STRIPE_PRICE_PRO: z.string().optional(),
  STRIPE_PRICE_SCALE: z.string().optional(),
  // Legacy (pre-2026-08-20 Growth→Scale rename). Kept as a rollout fallback for
  // STRIPE_PRICE_SCALE in priceIdMap; remove once Render env is fully renamed.
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
  // Observability (S-INT-08)
  SENTRY_DSN: z.string().optional(),
  // Hunter.io (S-INT-06)
  HUNTER_API_KEY: z.string().optional(),
  // Google OAuth — GSC integration (S-INT-06 / F38).
  // The code reads process.env.GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET directly
  // (routes/integrations/gsc.ts, services/gsc/*). These are declared here so the
  // real vars are schema-known and type-validated — replacing the never-referenced
  // GSC_CLIENT_ID / GSC_CLIENT_SECRET entries, whose name mismatch let a missing
  // credential surface as a runtime 500 (CONFIG_ERROR) instead of a boot failure.
  // Kept OPTIONAL rather than required-at-boot on purpose: GSC is flag-gated
  // (ENABLE_GSC_INTEGRATION), so an unconditional hard requirement would break
  // flag-off / CI / non-GSC environments. A flag-conditional fail-fast is the
  // proper follow-up (see DECISIONS_LOG D025).
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  // CiteMind Engine 1 — indexation ping (Lane D).
  // IndexNow: instant search-engine notification on publish (Autopilot; canon
  // CITEMIND_SYSTEM 2.5 / SEO_AEO_PILLAR_CANON 3D). Free, keyed POST.
  INDEXNOW_KEY: z.string().optional(),
  // Public URL that hosts the `${key}.txt` file (defaults to `<host>/<key>.txt`).
  INDEXNOW_KEY_LOCATION: z.string().url().optional(),
  // Google Indexing API — direct indexing request (Copilot/high-priority; canon
  // 2.5). Service-account credentials used to mint a short-lived access token.
  GOOGLE_INDEXING_SA_EMAIL: z.string().optional(),
  GOOGLE_INDEXING_SA_PRIVATE_KEY: z.string().optional(),
  // SEO keyword data provider — commodity Layer-1 (search volume / difficulty /
  // CPC) per canon SEO_AEO_PILLAR_CANON ("measure vs. build": buy Layer-1).
  // DataForSEO REST credentials. OPTIONAL: absence must NOT fail boot — when
  // unset, resolveKeywordProvider() returns the honest Null provider (no data),
  // never the fabricating stub. Read directly by the provider factory
  // (services/seoKeywordService.ts), matching the GSC direct-env pattern above.
  DATAFORSEO_LOGIN: z.string().optional(),
  DATAFORSEO_PASSWORD: z.string().optional(),
  // Internal dev/test escape hatch for the keyword provider. Only 'stub' has an
  // effect, and only outside production. NOT a user-facing surface flag — the
  // SEO_*_WIRED / ANALYTICS_SEO_WIRED surface flags are intentionally untouched.
  SEO_KEYWORD_PROVIDER: z.enum(['dataforseo', 'null', 'stub']).optional(),
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
