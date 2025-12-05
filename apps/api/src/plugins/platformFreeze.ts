/**
 * Platform Freeze Plugin (Sprint S78)
 *
 * When PLATFORM_FREEZE=true, blocks all write operations to core intelligence domains.
 * This enables safe read-only deployments for staging validation and production freeze.
 *
 * Affected domains (S38-S76 core intelligence systems):
 * - Press Releases (S38)
 * - PR Pitches (S39)
 * - Media Monitoring (S40)
 * - RSS/Media Crawling (S41)
 * - Scheduler (S42)
 * - Media Alerts (S43)
 * - PR Outreach (S44-S45)
 * - Journalist Graph (S46)
 * - Media Lists (S47)
 * - Journalist Discovery (S48)
 * - Journalist Timeline (S49)
 * - Audience Personas (S51)
 * - Media Performance (S52)
 * - Competitive Intelligence (S53)
 * - Media Briefings (S54)
 * - Crisis (S55)
 * - Brand Reputation (S56-S57)
 * - Governance (S59)
 * - Risk Radar (S60)
 * - Executive Command Center (S61)
 * - Executive Digests (S62)
 * - Executive Board Reports (S63)
 * - Investor Relations (S64)
 * - Strategic Intelligence (S65)
 * - Unified Graph (S66)
 * - Scenario Playbooks (S67)
 * - Unified Narratives (S70)
 * - AI Scenario Simulations (S71)
 * - Scenario Orchestrations (S72)
 * - Reality Maps (S73)
 * - Insight Conflicts (S74)
 */

import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { platformFreeze } from '../config';

/**
 * Route prefixes for core intelligence domains (S38-S76)
 * These routes will be blocked for write operations when platform freeze is enabled.
 */
const FROZEN_ROUTE_PREFIXES = [
  '/api/v1/press-releases',
  '/api/v1/pr-pitches',
  '/api/v1/media-monitoring',
  '/api/v1/rss',
  '/api/v1/scheduler',
  '/api/v1/media-alerts',
  '/api/v1/pr-outreach',
  '/api/v1/pr-outreach-deliverability',
  '/api/v1/journalist-graph',
  '/api/v1/media-lists',
  '/api/v1/journalist-discovery',
  '/api/v1/journalist-timeline',
  '/api/v1/personas',
  '/api/v1/media-performance',
  '/api/v1/competitive-intelligence',
  '/api/v1/media-briefings',
  '/api/v1/crisis',
  '/api/v1/reputation',
  '/api/v1/reputation-alerts',
  '/api/v1/governance',
  '/api/v1/risk-radar',
  '/api/v1/exec-dashboards',
  '/api/v1/exec-digests',
  '/api/v1/executive-board-reports',
  '/api/v1/investor-relations',
  '/api/v1/strategic-intelligence',
  '/api/v1/unified-graph',
  '/api/v1/scenario-playbooks',
  '/api/v1/unified-narratives',
  '/api/v1/ai-scenario-simulations',
  '/api/v1/scenario-orchestrations',
  '/api/v1/reality-maps',
  '/api/v1/insight-conflicts',
  // Also include playbooks and content routes since they're core to the platform
  '/api/v1/playbooks',
  '/api/v1/playbook-runs',
  '/api/v1/content',
  '/api/v1/pr',
  '/api/v1/seo',
  '/api/v1/agents',
  '/api/v1/personalities',
];

/**
 * HTTP methods that are considered write operations
 */
const WRITE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Platform Freeze error response
 */
const PLATFORM_FROZEN_ERROR = {
  success: false,
  error: 'PLATFORM_FROZEN',
  message: 'Platform is in read-only mode. Write operations are disabled.',
};

/**
 * Check if a route is affected by platform freeze
 */
function isFrozenRoute(url: string): boolean {
  return FROZEN_ROUTE_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/**
 * Check if a request method is a write operation
 */
function isWriteOperation(method: string): boolean {
  return WRITE_METHODS.includes(method.toUpperCase());
}

/**
 * Platform Freeze preHandler hook
 * Blocks write operations to frozen routes when platform freeze is enabled.
 */
async function platformFreezePreHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Skip if platform freeze is not enabled
  if (!platformFreeze) {
    return;
  }

  // Skip if not a write operation
  if (!isWriteOperation(request.method)) {
    return;
  }

  // Skip if route is not frozen
  if (!isFrozenRoute(request.url)) {
    return;
  }

  // Block the request
  reply.status(503).send(PLATFORM_FROZEN_ERROR);
}

/**
 * Platform Freeze Fastify Plugin
 *
 * Registers a preHandler hook that blocks write operations to core intelligence
 * domains when PLATFORM_FREEZE=true.
 *
 * Usage:
 * ```typescript
 * import { platformFreezePlugin } from './plugins/platformFreeze';
 * await server.register(platformFreezePlugin);
 * ```
 */
async function platformFreezePluginImpl(
  fastify: FastifyInstance,
  _opts: FastifyPluginOptions
): Promise<void> {
  // Register the preHandler hook globally
  fastify.addHook('preHandler', platformFreezePreHandler);

  // Log platform freeze status on startup
  if (platformFreeze) {
    fastify.log.warn('PLATFORM FREEZE ENABLED: Write operations to core domains are blocked');
  }
}

/**
 * Export the plugin wrapped with fastify-plugin for proper encapsulation handling
 */
export const platformFreezePlugin = fp(platformFreezePluginImpl, {
  name: 'platform-freeze',
  fastify: '4.x',
});

/**
 * Export helpers for testing and debugging
 */
export { isFrozenRoute, isWriteOperation, FROZEN_ROUTE_PREFIXES, WRITE_METHODS };
