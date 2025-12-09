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
  /**
   * Basic health check - backward compatible
   * GET /health/
   */
  server.get('/', async (): Promise<HealthCheckResponse> => {
    return {
      status: 'healthy',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      checks: {},
    };
  });

  /**
   * Readiness probe (for k8s/orchestration)
   * GET /health/ready
   *
   * Returns ready:true when the app can handle traffic.
   * Can be extended to check database connectivity, etc.
   */
  server.get('/ready', async () => {
    return {
      ready: true,
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
      // Future: Add database connectivity check
      // checks: { database: 'ok', redis: 'ok' }
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
