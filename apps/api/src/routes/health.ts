/**
 * Health check routes (Sprint S76)
 *
 * Provides endpoints for infrastructure monitoring:
 * - /live - Kubernetes liveness probe (is the process running?)
 * - /ready - Kubernetes readiness probe (can the app handle traffic?)
 * - /info - Application info for monitoring dashboards
 */

import type { HealthCheckResponse } from '@pravado/types';
import { FLAGS } from '@pravado/feature-flags';
import type { FastifyInstance } from 'fastify';
import { createClient } from '@supabase/supabase-js';

import { config, APP_VERSION, BUILD_INFO } from '../config';

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

export async function healthRoutes(server: FastifyInstance) {
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  /**
   * Basic health check with dependency checks (S-INT-10 upgrade)
   * GET /health/
   */
  server.get('/', async (_request, reply): Promise<HealthCheckResponse> => {
    const checks: Record<string, string> = {};

    // Database check — query a known table
    try {
      const { error: dbErr } = await supabase.from('orgs').select('id').limit(1);
      checks.database = dbErr ? 'degraded' : 'ok';
    } catch {
      checks.database = 'failed';
    }

    // Redis check — real liveness ping
    if (config.REDIS_URL) {
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        checks.redis = 'degraded';
        checks.redis_error = msg;
      }
    } else {
      checks.redis = 'not_configured';
    }

    const allOk = Object.values(checks).every((v) => v === 'ok' || v === 'not_configured');

    if (!allOk) {
      reply.code(503);
    }

    return {
      status: allOk ? 'healthy' : 'unhealthy',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
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
      version: APP_VERSION,
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
        version: APP_VERSION,
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
