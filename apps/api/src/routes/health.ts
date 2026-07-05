/**
 * Health check routes
 *
 * Original surface (Sprint S76):
 * - /live - liveness probe
 * - /ready - readiness probe (DB ping)
 * - /info - app metadata
 *
 * Phase 0.5 Plan 03 expansion:
 * - / now reports {status, version, deps:{supabase,resend,stripe}, checks:{database,redis}}
 * - `version` resolves from RENDER_GIT_COMMIT (Render injects this on every
 *   deploy) so uptime monitors and manual curls show exactly which SHA is
 *   serving. Falls back to APP_VERSION then 'unknown'.
 * - `deps` reports downstream-SDK init status — NOT real outbound calls.
 *   We deliberately don't ping Resend/Stripe APIs because that would (a)
 *   turn an unauth endpoint into a paid poll target and (b) couple our
 *   uptime to their uptime.
 * - 503 when any check is degraded.
 *
 * Security: the response body is broadcast over an unauthenticated
 * endpoint that monitors poll every 5 minutes. Per the architect-approved
 * refinement, we MUST NOT include API key fragments, internal URLs, or
 * raw error/stack content in the body. The shape is a fixed allowlist of
 * primitives; tests assert no leaks. See apps/api/tests/health.test.ts.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/03-health.md
 */

import { FLAGS } from '@pravado/feature-flags';
import type { DepStatus, HealthCheckResponse } from '@pravado/types';
import * as Sentry from '@sentry/node';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { config, APP_VERSION, BUILD_INFO } from '../config';
import { createLogger } from '../lib/logger';

const logger = createLogger('api:health');

// Mode 3 (Stage 4 C6): /health is polled every few seconds (Render health
// check + uptime monitors). Throttle the redis-degraded Sentry event to at
// most once per 60s so a sustained degradation doesn't flood Sentry and
// starve the very alert quota we depend on. The alert rule (3+ in 5min) still
// fires reliably from the throttled stream.
const REDIS_DEGRADED_CAPTURE_THROTTLE_MS = 60_000;
let lastRedisDegradedCaptureAt = 0;
function captureRedisDegraded(latencyMs: number, errorClass: string): void {
  const now = Date.now();
  if (now - lastRedisDegradedCaptureAt < REDIS_DEGRADED_CAPTURE_THROTTLE_MS) {
    return;
  }
  lastRedisDegradedCaptureAt = now;
  Sentry.captureMessage('/health redis degraded', {
    level: 'warning',
    tags: { latency_ms: latencyMs, error_class: errorClass },
  });
}

/**
 * Safe subset of feature flags to expose via /info endpoint.
 * Only includes flags that are safe for monitoring/debugging.
 */
const SAFE_FLAGS_TO_EXPOSE: (keyof typeof FLAGS)[] = [
  'ENABLE_LLM',
  'ENABLE_SCHEDULER',
  'ENABLE_BILLING_HARD_LIMITS',
  'ENABLE_AUDIT_LOGGING',
  'ENABLE_EXECUTION_STREAMING',
  'ENABLE_DEBUG_MODE',
  'ENABLE_MAINTENANCE_MODE',
];

function getSafeFlags(): Record<string, boolean> {
  const safeFlags: Record<string, boolean> = {};
  for (const key of SAFE_FLAGS_TO_EXPOSE) {
    safeFlags[key] = FLAGS[key];
  }
  return safeFlags;
}

/**
 * Resolve the deploy SHA for the running process.
 *
 * Order:
 *   1. RENDER_GIT_COMMIT — Render injects on every deploy
 *   2. VERCEL_GIT_COMMIT_SHA — Vercel (dashboard side mirrors this)
 *   3. APP_VERSION (package.json fallback)
 *   4. 'unknown'
 *
 * Truncated to 12 chars when sourced from a git SHA so the response stays
 * compact in monitors. APP_VERSION and 'unknown' pass through unchanged.
 */
export function resolveDeployVersion(): string {
  const sha =
    process.env.RENDER_GIT_COMMIT || process.env.VERCEL_GIT_COMMIT_SHA;
  if (sha && sha.length > 0) {
    return sha.slice(0, 12);
  }
  if (APP_VERSION && APP_VERSION.length > 0) {
    return APP_VERSION;
  }
  return 'unknown';
}

/**
 * Verify the Resend SDK can construct with the configured key.
 *
 * Does NOT call any Resend API endpoint — only validates that the env
 * value is present and shape-plausible (Resend keys start with `re_`).
 * Returns 'not_configured' when the env is absent so monitors don't
 * register an alert in dev/staging envs without a key configured.
 */
export function checkResendInit(apiKey: string | undefined): DepStatus {
  if (!apiKey) {
    return 'not_configured';
  }
  // Resend keys are `re_<token>` — shape check only, never log/return the
  // value. A malformed key (wrong prefix or empty token) is a config
  // error worth flagging on /health, but the error never makes it into
  // the response body.
  const shapeOk = apiKey.startsWith('re_') && apiKey.length > 5;
  return shapeOk ? 'ok' : 'degraded';
}

/**
 * Verify the Stripe SDK can construct with the configured key.
 *
 * Same posture as `checkResendInit`: shape check only, no API call.
 * Stripe keys: `sk_live_*` or `sk_test_*`.
 */
export function checkStripeInit(secretKey: string | undefined): DepStatus {
  if (!secretKey) {
    return 'not_configured';
  }
  const shapeOk =
    (secretKey.startsWith('sk_live_') || secretKey.startsWith('sk_test_')) &&
    secretKey.length > 12;
  return shapeOk ? 'ok' : 'degraded';
}

/**
 * Verify the Supabase SDK can construct with the configured URL + key
 * and that a no-op `auth.getSession` round-trip resolves. `getSession`
 * is a metadata read with no DB impact (no PII, no row reads).
 *
 * On any throw we return 'degraded'. The thrown error is logged via the
 * structured logger but NEVER serialized into the response body.
 */
export async function checkSupabaseInit(
  url: string | undefined,
  key: string | undefined
): Promise<DepStatus> {
  if (!url || !key) {
    return 'not_configured';
  }
  try {
    const client = createClient(url, key);
    // getSession is a metadata read — does not touch any table.
    const { error } = await client.auth.getSession();
    if (error) {
      logger.warn('supabase getSession returned error on /health', {
        err: error,
      });
      return 'degraded';
    }
    return 'ok';
  } catch (err) {
    logger.warn('supabase init threw on /health', { err });
    return 'degraded';
  }
}

export async function healthRoutes(server: FastifyInstance) {
  const supabase = createClient(
    config.SUPABASE_URL,
    config.SUPABASE_SERVICE_ROLE_KEY
  );

  /**
   * Health check with downstream-dep init status (Plan 03)
   * GET /health/
   */
  server.get('/', async (_request, reply): Promise<HealthCheckResponse> => {
    const checks: Record<string, string> = {};

    // Database check — query a known table
    try {
      const { error: dbErr } = await supabase
        .from('orgs')
        .select('id')
        .limit(1);
      checks.database = dbErr ? 'degraded' : 'ok';
    } catch {
      checks.database = 'failed';
    }

    // Redis check — real liveness ping
    if (config.REDIS_URL) {
      const redisStart = Date.now();
      try {
        const { default: Redis } = await import('ioredis');
        const redisClient = new Redis(config.REDIS_URL, {
          connectTimeout: 2000,
          lazyConnect: true,
          maxRetriesPerRequest: 0,
        });
        const pong = await Promise.race([
          redisClient.ping(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Redis ping timeout')), 2000)
          ),
        ]);
        checks.redis = pong === 'PONG' ? 'ok' : 'degraded';
        await redisClient.quit().catch(() => {});
        if (checks.redis === 'degraded') {
          captureRedisDegraded(
            Date.now() - redisStart,
            'unexpected_ping_reply'
          );
        }
      } catch (err) {
        // Plan 03: log the error structurally but do NOT include it in
        // the response body — the `redis_error: msg` line removed in
        // Plan 03 because it broadcast raw exception strings.
        logger.warn('redis ping failed on /health', { err });
        checks.redis = 'degraded';
        // Mode 3 (Stage 4 C6): reachable-but-failing likely means capacity or
        // connection-pool exhaustion (the F13 max-clients class).
        const errorClass =
          err instanceof Error && /timeout/i.test(err.message)
            ? 'ping_timeout'
            : 'connection_error';
        captureRedisDegraded(Date.now() - redisStart, errorClass);
      }
    } else {
      checks.redis = 'not_configured';
    }

    // Plan 03: downstream-dep init status (no real outbound calls).
    const supabaseDep = await checkSupabaseInit(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY
    );
    const deps = {
      supabase: supabaseDep,
      resend: checkResendInit(config.RESEND_API_KEY),
      stripe: checkStripeInit(config.STRIPE_SECRET_KEY),
    };

    // Health aggregation: any 'degraded' / 'failed' flips overall status.
    // `not_configured` is intentionally treated as healthy — staging or
    // pre-prod envs without optional deps shouldn't page on-call.
    const checkValues = Object.values(checks);
    const depValues = Object.values(deps);
    const allOk =
      checkValues.every((v) => v === 'ok' || v === 'not_configured') &&
      depValues.every((v) => v === 'ok' || v === 'not_configured');

    if (!allOk) {
      reply.code(503);
    }

    return {
      status: allOk ? 'healthy' : 'unhealthy',
      version: resolveDeployVersion(),
      timestamp: new Date().toISOString(),
      deps,
      checks,
    };
  });

  /**
   * Readiness probe (for k8s/orchestration)
   * GET /health/ready
   */
  server.get('/ready', async (_request, reply) => {
    // Quick database connectivity check
    const { error } = await supabase.from('orgs').select('id').limit(1);
    const dbOk = !error;

    if (!dbOk) {
      reply.code(503);
    }

    return {
      ready: dbOk,
      version: resolveDeployVersion(),
      timestamp: new Date().toISOString(),
      checks: { database: dbOk ? 'ok' : 'failed' },
    };
  });

  /**
   * Liveness probe (for k8s/orchestration)
   * GET /health/live
   *
   * Returns alive:true as long as the process is running.
   * This is a simple heartbeat check.
   */
  server.get('/live', async () => {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  });

  /**
   * Application info endpoint (for monitoring dashboards)
   * GET /health/info
   *
   * Returns safe application metadata:
   * - Version and build info
   * - Environment (sanitized)
   * - Enabled feature flags (safe subset only)
   *
   * NOTE: This endpoint does NOT leak secrets.
   */
  server.get('/info', async () => {
    return {
      app: {
        name: 'Pravado API',
        version: resolveDeployVersion(),
        packageVersion: APP_VERSION,
        buildTime: BUILD_INFO.buildTime,
      },
      environment: {
        deploymentEnv: config.DEPLOYMENT_ENV,
        nodeEnv: config.NODE_ENV,
        logLevel: config.LOG_LEVEL,
        llmProvider: config.LLM_PROVIDER,
      },
      features: getSafeFlags(),
      timestamp: new Date().toISOString(),
    };
  });
}
