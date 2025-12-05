/**
 * Render Staging Configuration Script (S82)
 *
 * Idempotent script to create or update the pravado-api-staging service on Render.
 * Uses the Render REST API with RENDER_API_KEY from local .env.
 *
 * Run with: pnpm --filter @pravado/api configure:render:staging
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// ENV LOADING
// ============================================================================

function loadEnvFile(): void {
  // Try to load .env.local from repo root
  const repoRoot = join(import.meta.dirname, '../../../../');
  const envPaths = [
    join(repoRoot, '.env.local'),
    join(repoRoot, '.env'),
  ];

  for (const envPath of envPaths) {
    if (existsSync(envPath)) {
      console.log(`Loading env from: ${envPath}`);
      const content = readFileSync(envPath, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIndex = trimmed.indexOf('=');
        if (eqIndex === -1) continue;
        const key = trimmed.slice(0, eqIndex).trim();
        let value = trimmed.slice(eqIndex + 1).trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      return;
    }
  }
  console.warn('No .env.local or .env file found at repo root');
}

loadEnvFile();

// ============================================================================
// CONFIGURATION
// ============================================================================

const RENDER_API_BASE = 'https://api.render.com/v1';
const SERVICE_NAME = 'pravado-api-staging';

// Service configuration
const SERVICE_CONFIG = {
  name: SERVICE_NAME,
  type: 'web_service',
  runtime: 'node',
  plan: 'starter', // Starter plan ($7/month, no spin-down)
  region: 'oregon',
  branch: 'main',
  rootDir: '', // Empty = repo root for monorepo
  buildCommand: 'pnpm install && pnpm build',
  startCommand: 'node --import tsx apps/api/dist/index.js',
  healthCheckPath: '/health/live',
  numInstances: 1,
};

// Required environment variables
const REQUIRED_ENV_VARS = [
  'RENDER_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
] as const;

// Environment variables to set on the Render service
interface EnvVarConfig {
  key: string;
  value: string | undefined;
  required: boolean;
}

function getEnvVarsToSet(): EnvVarConfig[] {
  return [
    // Required - hardcoded values
    { key: 'NODE_ENV', value: 'production', required: true },
    { key: 'API_HOST', value: '0.0.0.0', required: true },
    { key: 'API_PORT', value: '10000', required: true },

    // Required - from local env
    { key: 'SUPABASE_URL', value: process.env.SUPABASE_URL, required: true },
    { key: 'SUPABASE_ANON_KEY', value: process.env.SUPABASE_ANON_KEY, required: true },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', value: process.env.SUPABASE_SERVICE_ROLE_KEY, required: true },

    // CORS - default to localhost, user can update later
    { key: 'CORS_ORIGIN', value: process.env.CORS_ORIGIN || 'http://localhost:3000', required: true },
    { key: 'DASHBOARD_URL', value: process.env.DASHBOARD_URL || 'http://localhost:3000', required: true },

    // Cookie secret - generate if not present
    { key: 'COOKIE_SECRET', value: process.env.COOKIE_SECRET || generateCookieSecret(), required: true },

    // Recommended - only set if present locally
    { key: 'LLM_PROVIDER', value: process.env.LLM_PROVIDER, required: false },
    { key: 'LLM_ANTHROPIC_API_KEY', value: process.env.LLM_ANTHROPIC_API_KEY, required: false },
    { key: 'LLM_OPENAI_API_KEY', value: process.env.LLM_OPENAI_API_KEY, required: false },
    { key: 'PLATFORM_FREEZE', value: process.env.PLATFORM_FREEZE || 'false', required: false },

    // Optional integrations
    { key: 'STRIPE_SECRET_KEY', value: process.env.STRIPE_SECRET_KEY, required: false },
    { key: 'STRIPE_WEBHOOK_SECRET', value: process.env.STRIPE_WEBHOOK_SECRET, required: false },
    { key: 'MAILGUN_API_KEY', value: process.env.MAILGUN_API_KEY, required: false },
    { key: 'MAILGUN_DOMAIN', value: process.env.MAILGUN_DOMAIN, required: false },
  ];
}

function generateCookieSecret(): string {
  // Simple random string for cookie secret
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// RENDER API TYPES
// ============================================================================

interface RenderService {
  id: string;
  name: string;
  type: string;
  slug: string;
  suspended: string;
  serviceDetails?: {
    buildCommand?: string;
    startCommand?: string;
    healthCheckPath?: string;
    region?: string;
    plan?: string;
    numInstances?: number;
  };
}

interface RenderServiceWrapper {
  service: RenderService;
}

interface RenderOwner {
  id: string;
  name: string;
  email?: string;
  type?: string;
}

interface RenderOwnerWrapper {
  owner: RenderOwner;
}

// ============================================================================
// RENDER API HELPERS
// ============================================================================

async function renderFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    throw new Error('RENDER_API_KEY is not set');
  }

  const url = `${RENDER_API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return response;
}

async function listServices(): Promise<RenderService[]> {
  console.log('Fetching existing Render services...');
  const response = await renderFetch('/services?limit=100');

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to list services: ${response.status} ${response.statusText}\n${body}`);
  }

  const data = (await response.json()) as RenderServiceWrapper[];
  // Render API returns array of { service: RenderService } objects
  return data.map((item) => item.service);
}

async function findServiceByName(name: string): Promise<RenderService | null> {
  const services = await listServices();
  const found = services.find((s) => s.name === name);
  return found || null;
}

async function updateServiceEnvVars(
  serviceId: string,
  envVars: { key: string; value: string }[]
): Promise<void> {
  console.log(`Updating ${envVars.length} env vars on service ${serviceId}...`);

  // Render API expects PUT with array of env var objects
  const response = await renderFetch(`/services/${serviceId}/env-vars`, {
    method: 'PUT',
    body: JSON.stringify(envVars.map((ev) => ({ key: ev.key, value: ev.value }))),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to update env vars: ${response.status} ${response.statusText}\n${body}`);
  }

  console.log('Environment variables updated successfully');
}

async function updateService(
  serviceId: string,
  updates: Record<string, unknown>
): Promise<void> {
  console.log(`Updating service ${serviceId}...`);

  const response = await renderFetch(`/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to update service: ${response.status} ${response.statusText}\n${body}`);
  }

  console.log('Service configuration updated successfully');
}

async function createService(
  repoUrl: string,
  ownerId: string
): Promise<RenderService> {
  console.log('Creating new Render service...');

  const payload = {
    type: 'web_service',
    name: SERVICE_NAME,
    ownerId: ownerId,
    repo: repoUrl,
    autoDeploy: 'yes',
    branch: SERVICE_CONFIG.branch,
    rootDir: SERVICE_CONFIG.rootDir,
    serviceDetails: {
      env: SERVICE_CONFIG.runtime, // Render API uses 'env' not 'runtime'
      plan: SERVICE_CONFIG.plan,
      region: SERVICE_CONFIG.region,
      healthCheckPath: SERVICE_CONFIG.healthCheckPath,
      numInstances: SERVICE_CONFIG.numInstances,
      envSpecificDetails: {
        buildCommand: SERVICE_CONFIG.buildCommand,
        startCommand: SERVICE_CONFIG.startCommand,
      },
    },
  };

  const response = await renderFetch('/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to create service: ${response.status} ${response.statusText}\n${body}`);
  }

  const data = (await response.json()) as RenderServiceWrapper;
  console.log(`Service created: ${data.service.id}`);
  return data.service;
}

async function getOwnerInfo(): Promise<RenderOwner> {
  console.log('Fetching Render owner info...');
  const response = await renderFetch('/owners?limit=1');

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to get owner info: ${response.status} ${response.statusText}\n${body}`);
  }

  const data = (await response.json()) as RenderOwnerWrapper[];
  if (!data || data.length === 0) {
    throw new Error('No Render owner found. Check your API key permissions.');
  }

  const owner = data[0].owner;
  console.log(`Using owner: ${owner.name} (${owner.id})`);
  return owner;
}

// ============================================================================
// MAIN LOGIC
// ============================================================================

async function validateRequiredEnvVars(): Promise<void> {
  console.log('\nValidating required environment variables...');

  const missing: string[] = [];
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      console.log(`  ✓ ${varName}: present`);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((v) => `  - ${v}`).join('\n')}\n\nPlease set these in your .env.local file.`
    );
  }
}

function logEnvVarSummary(envVars: EnvVarConfig[]): void {
  console.log('\nEnvironment variables to configure:');
  for (const ev of envVars) {
    if (ev.value) {
      // Don't print actual values for secrets
      const isSecret = ev.key.includes('KEY') || ev.key.includes('SECRET');
      const displayValue = isSecret ? '[REDACTED]' : ev.value;
      console.log(`  ${ev.required ? '✓' : '○'} ${ev.key}: ${displayValue}`);
    } else if (ev.required) {
      console.log(`  ✗ ${ev.key}: MISSING (required)`);
    } else {
      console.log(`  - ${ev.key}: not set (optional)`);
    }
  }
}

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RENDER STAGING CONFIGURATION SCRIPT');
  console.log('  Service: pravado-api-staging');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Step 1: Validate required env vars
  await validateRequiredEnvVars();

  // Step 2: Prepare env vars
  const envVarsToSet = getEnvVarsToSet();
  logEnvVarSummary(envVarsToSet);

  // Filter to only vars with values
  const envVarsWithValues = envVarsToSet
    .filter((ev) => ev.value !== undefined)
    .map((ev) => ({ key: ev.key, value: ev.value! }));

  // Step 3: Check if service exists
  console.log('\n--- Checking Render for existing service ---');
  const existingService = await findServiceByName(SERVICE_NAME);

  if (existingService) {
    // Service exists - update it
    console.log(`\n✓ Found existing service: ${existingService.name} (${existingService.id})`);
    console.log('  Updating configuration...\n');

    // Update service settings
    await updateService(existingService.id, {
      branch: SERVICE_CONFIG.branch,
      rootDir: SERVICE_CONFIG.rootDir,
      serviceDetails: {
        buildCommand: SERVICE_CONFIG.buildCommand,
        startCommand: SERVICE_CONFIG.startCommand,
        healthCheckPath: SERVICE_CONFIG.healthCheckPath,
      },
    });

    // Update env vars
    await updateServiceEnvVars(existingService.id, envVarsWithValues);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  UPDATE COMPLETE');
    console.log(`  Service ID: ${existingService.id}`);
    console.log(`  Service URL: https://${existingService.slug}.onrender.com`);
    console.log('═══════════════════════════════════════════════════════════');
  } else {
    // Service doesn't exist - need more info to create
    console.log(`\n✗ No service named "${SERVICE_NAME}" found.`);
    console.log('  To create a new service, we need repository information.\n');

    // Get owner info
    const owner = await getOwnerInfo();

    // For creating a new service, we need the repo URL
    // This would typically be configured or read from git
    const repoUrl = process.env.RENDER_REPO_URL;
    if (!repoUrl) {
      console.log('\n⚠️  RENDER_REPO_URL not set.');
      console.log('   To create a new service, add RENDER_REPO_URL to your .env.local');
      console.log('   Example: RENDER_REPO_URL=https://github.com/your-org/pravado-v2');
      console.log('\n   Alternatively, create the service manually in Render Dashboard:');
      console.log('   1. Go to https://dashboard.render.com');
      console.log('   2. Click New > Web Service');
      console.log('   3. Connect your repo and name it "pravado-api-staging"');
      console.log('   4. Then re-run this script to configure env vars\n');
      process.exit(1);
    }

    // Create the service
    const newService = await createService(repoUrl, owner.id);

    // Set env vars on the new service
    await updateServiceEnvVars(newService.id, envVarsWithValues);

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  SERVICE CREATED');
    console.log(`  Service ID: ${newService.id}`);
    console.log(`  Service URL: https://${newService.slug}.onrender.com`);
    console.log('  Note: Initial deploy may take 3-5 minutes');
    console.log('═══════════════════════════════════════════════════════════');
  }

  console.log('\nNext steps:');
  console.log('  1. Check Render Dashboard for deploy status');
  console.log('  2. Once deployed, verify: curl https://<service>.onrender.com/health/ready');
  console.log('  3. Update CORS_ORIGIN to your Vercel dashboard URL');
  console.log('  4. Re-run this script to apply CORS update\n');
}

// ============================================================================
// CLI ENTRYPOINT
// ============================================================================

main()
  .then(() => {
    console.log('Script completed successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error.message);
    if (error.stack && process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  });
