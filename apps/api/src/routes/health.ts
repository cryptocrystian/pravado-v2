/**
 * Health check routes
 */

import type { HealthCheckResponse } from '@pravado/types';
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(server: FastifyInstance) {
  // Basic health check
  server.get('/', async (): Promise<HealthCheckResponse> => {
    return {
      status: 'healthy',
      version: '0.0.0-s0',
      timestamp: new Date().toISOString(),
      checks: {},
    };
  });

  // Readiness probe (for k8s/orchestration)
  server.get('/ready', async () => {
    return {
      ready: true,
      timestamp: new Date().toISOString(),
    };
  });

  // Liveness probe (for k8s/orchestration)
  server.get('/live', async () => {
    return {
      alive: true,
      timestamp: new Date().toISOString(),
    };
  });
}
