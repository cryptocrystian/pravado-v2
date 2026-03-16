/**
 * Configure Render Production Service
 *
 * Creates or updates the "pravado-api" web service on Render
 * with all production environment variables.
 *
 * Usage:
 *   cd apps/api && pnpm exec tsx --env-file=.env src/scripts/configureRenderProduction.ts
 */

const RENDER_API_BASE = 'https://api.render.com/v1';
const SERVICE_NAME = 'pravado-api';
const REPO_URL = 'https://github.com/cryptocrystian/pravado-v2';
const BRANCH = 'main';
const REGION = 'oregon';
const PLAN = 'starter';

const RENDER_API_KEY = process.env.RENDER_API_KEY;
if (!RENDER_API_KEY) {
  console.error('RENDER_API_KEY is required');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${RENDER_API_KEY}`,
  'Content-Type': 'application/json',
};

// All production env vars — secrets from .env, config hardcoded
const ENV_VARS: Array<{ key: string; value: string }> = [
  // Node / Server
  { key: 'NODE_ENV', value: 'production' },
  { key: 'NODE_VERSION', value: '20' },
  { key: 'API_HOST', value: '0.0.0.0' },
  { key: 'API_PORT', value: '10000' },
  { key: 'DEPLOYMENT_ENV', value: 'production' },
  { key: 'LOG_LEVEL', value: 'info' },

  // Supabase
  { key: 'SUPABASE_URL', value: process.env.SUPABASE_URL || '' },
  { key: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY || '' },
  { key: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY || '' },
  { key: 'SUPABASE_JWT_SECRET', value: process.env.SUPABASE_JWT_SECRET || '' },

  // Redis
  { key: 'REDIS_URL', value: process.env.REDIS_URL || '' },
  { key: 'REDIS_API_KEY', value: process.env.REDIS_API_KEY || '' },

  // Auth
  { key: 'JWT_SECRET', value: process.env.JWT_SECRET || '' },

  // Stripe
  { key: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY || '' },
  { key: 'STRIPE_PUBLISHABLE_KEY', value: process.env.STRIPE_PUBLISHABLE_KEY || '' },
  { key: 'STRIPE_WEBHOOK_SECRET', value: process.env.STRIPE_WEBHOOK_SECRET || '' },
  { key: 'STRIPE_PRICE_STARTER', value: process.env.STRIPE_PRICE_STARTER || '' },
  { key: 'STRIPE_PRICE_PRO', value: process.env.STRIPE_PRICE_PRO || '' },
  { key: 'STRIPE_PRICE_GROWTH', value: process.env.STRIPE_PRICE_GROWTH || '' },

  // AI Services
  { key: 'OPENAI_API_KEY', value: process.env.OPENAI_API_KEY || '' },
  { key: 'ANTHROPIC_API_KEY', value: process.env.ANTHROPIC_API_KEY || '' },
  { key: 'PERPLEXITY_API_KEY', value: process.env.PERPLEXITY_API_KEY || '' },

  // Google OAuth
  { key: 'GOOGLE_CLIENT_ID', value: process.env.GOOGLE_CLIENT_ID || '' },
  { key: 'GOOGLE_CLIENT_SECRET', value: process.env.GOOGLE_CLIENT_SECRET || '' },

  // Email
  { key: 'SENDGRID_API_KEY', value: process.env.SENDGRID_API_KEY || '' },

  // Monitoring
  { key: 'SENTRY_DSN', value: process.env.SENTRY_DSN || '' },
  { key: 'POSTHOG_API_KEY', value: process.env.POSTHOG_API_KEY || '' },

  // Data Enrichment
  { key: 'PEOPLE_DATA_LABS_API_KEY', value: process.env.PEOPLE_DATA_LABS_API_KEY || '' },
  { key: 'HUNTER_API_KEY', value: process.env.HUNTER_API_KEY || '' },
  { key: 'WHOIS_XML_API_KEY', value: process.env.WHOIS_XML_API_KEY || '' },

  // CDN
  { key: 'FASTLY_API_KEY', value: process.env.FASTLY_API_KEY || '' },

  // CORS / URLs
  { key: 'CORS_ORIGIN', value: 'https://pravado-dashboard.vercel.app' },
  { key: 'DASHBOARD_URL', value: 'https://pravado-dashboard.vercel.app' },
  { key: 'RENDER_EXTERNAL_URL', value: 'https://pravado-api.onrender.com' },
];

async function renderFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${RENDER_API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, body };
}

async function findService(): Promise<string | null> {
  const { ok, body } = await renderFetch(`/services?name=${encodeURIComponent(SERVICE_NAME)}&type=web&limit=1`);
  if (!ok || !Array.isArray(body) || body.length === 0) return null;
  return body[0].service?.id || body[0].id || null;
}

async function getOwnerId(): Promise<string> {
  const { ok, body } = await renderFetch('/owners?limit=1');
  if (!ok || !Array.isArray(body) || body.length === 0) {
    console.error('Failed to fetch Render owner:', JSON.stringify(body, null, 2));
    process.exit(1);
  }
  return body[0].owner.id;
}

async function createService(): Promise<string> {
  const ownerId = await getOwnerId();
  console.log(`Creating service "${SERVICE_NAME}" on Render (owner: ${ownerId})...`);
  const { ok, body } = await renderFetch('/services', {
    method: 'POST',
    body: JSON.stringify({
      type: 'web_service',
      name: SERVICE_NAME,
      ownerId,
      repo: REPO_URL,
      autoDeploy: 'yes',
      branch: BRANCH,
      rootDir: '',
      serviceDetails: {
        region: REGION,
        plan: PLAN,
        healthCheckPath: '/health',
        envSpecificDetails: {
          buildCommand: 'npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @pravado/api build',
          startCommand: 'pnpm --filter @pravado/api start:prod',
          runtime: 'node',
        },
        envVars: ENV_VARS.map((e) => ({ key: e.key, value: e.value })),
      },
    }),
  });

  if (!ok) {
    console.error('Failed to create service:', JSON.stringify(body, null, 2));
    process.exit(1);
  }

  const serviceId = body.service?.id || body.id;
  console.log(`Service created: ${serviceId}`);
  return serviceId;
}

async function updateEnvVars(serviceId: string): Promise<void> {
  console.log(`Updating env vars for service ${serviceId}...`);
  const { ok, body } = await renderFetch(`/services/${serviceId}/env-vars`, {
    method: 'PUT',
    body: JSON.stringify(ENV_VARS.map((e) => ({ ...e, type: 'plain' }))),
  });

  if (!ok) {
    console.error('Failed to update env vars:', JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log(`Updated ${ENV_VARS.length} env vars`);
}

async function main() {
  console.log('=== Render Production Configuration ===');
  console.log(`Service: ${SERVICE_NAME}`);
  console.log(`Repo: ${REPO_URL}`);
  console.log(`Branch: ${BRANCH}`);
  console.log();

  let serviceId = await findService();

  if (serviceId) {
    console.log(`Found existing service: ${serviceId}`);
    await updateEnvVars(serviceId);
  } else {
    serviceId = await createService();
  }

  console.log();
  console.log('=== Configuration Complete ===');
  console.log(`Service ID: ${serviceId}`);
  console.log(`Service URL: https://pravado-api.onrender.com`);
  console.log(`Health: https://pravado-api.onrender.com/health`);
  console.log();
  console.log('Next: trigger a deploy with:');
  console.log(`  curl -X POST "https://api.render.com/v1/services/${serviceId}/deploys" \\`);
  console.log(`    -H "Authorization: Bearer $RENDER_API_KEY" \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{"clearCache": "do_not_clear"}'`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
