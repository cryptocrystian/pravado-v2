/**
 * MSW Request Handlers
 *
 * Sprint S-INT-03: All 5 Command Center endpoints de-mocked.
 * Route handlers now proxy to real Fastify backend via backendFetch().
 *
 * Removed handlers:
 * - /api/command-center/action-stream → GET /api/v1/sage/action-stream
 * - /api/command-center/intelligence-canvas → GET /api/v1/sage/intelligence-canvas
 * - /api/command-center/strategy-panel → GET /api/v1/sage/strategy-panel
 * - /api/command-center/orchestration-calendar → GET /api/v1/sage/orchestration-calendar
 * - /api/command-center/entity-map → GET /api/v1/sage/entity-map
 *
 * Add new MSW handlers below only for endpoints that don't yet have
 * a real backend implementation.
 */

import type { RequestHandler } from 'msw';

export const handlers: RequestHandler[] = [];
