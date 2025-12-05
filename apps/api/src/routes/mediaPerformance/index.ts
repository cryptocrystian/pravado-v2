/**
 * Media Performance Analytics Routes (Sprint S52)
 * API endpoints for unified performance intelligence
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { MediaPerformanceService } from '../../services/mediaPerformanceService';
import {
  createSnapshotRequestSchema,
  createDimensionRequestSchema,
  createScoreRequestSchema,
  createInsightRequestSchema,
  updateInsightRequestSchema,
  mediaPerformanceFiltersSchema,
  dimensionFiltersSchema,
  scoreFiltersSchema,
  insightFiltersSchema,
  getOverviewRequestSchema,
} from '@pravado/validators';
import type {
  CreateSnapshotRequest,
  CreateDimensionRequest,
  CreateScoreRequest,
  CreateInsightRequest,
  UpdateInsightRequest,
  MediaPerformanceFilters,
  DimensionFilters,
  ScoreFilters,
  InsightFilters,
  MetricType,
  InsightCategory,
} from '@pravado/types';

// Helper to get org ID from request
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Organization ID is required');
  }
  return orgId;
}

export default async function mediaPerformanceRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = new MediaPerformanceService(supabase);

  /**
   * ============================================================================
   * SNAPSHOT ENDPOINTS
   * ============================================================================
   */

  /**
   * POST /api/media-performance/snapshots
   * Create a new performance snapshot
   */
  server.post('/snapshots', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = createSnapshotRequestSchema.parse(request.body);

      const snapshot = await service.createSnapshot(orgId, validated as CreateSnapshotRequest);

      return reply.status(201).send({
        success: true,
        data: snapshot,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating snapshot');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/media-performance/snapshots
   * Get snapshots with filters
   */
  server.get('/snapshots', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const filters: MediaPerformanceFilters = mediaPerformanceFiltersSchema.parse({
        brandId: queryParams.brandId,
        campaignId: queryParams.campaignId,
        journalistId: queryParams.journalistId,
        outletTier: queryParams.outletTier,
        topicCluster: queryParams.topicCluster,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        aggregationPeriod: queryParams.aggregationPeriod,
        hasAnomaly: queryParams.hasAnomaly === 'true',
        minEviScore: queryParams.minEviScore ? Number(queryParams.minEviScore) : undefined,
        minVisibilityScore: queryParams.minVisibilityScore
          ? Number(queryParams.minVisibilityScore)
          : undefined,
      });

      const limit = queryParams.limit ? Number(queryParams.limit) : 100;
      const offset = queryParams.offset ? Number(queryParams.offset) : 0;

      const result = await service.getSnapshots(orgId, filters, limit, offset);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting snapshots');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/media-performance/snapshots/:id
   * Get snapshot by ID
   */
  server.get('/snapshots/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };

      const snapshot = await service.getSnapshot(orgId, id);

      return reply.send({
        success: true,
        data: snapshot,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting snapshot');
      return reply.status(errorMessage.includes('not found') ? 404 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * ============================================================================
   * DIMENSION ENDPOINTS
   * ============================================================================
   */

  /**
   * POST /api/media-performance/dimensions
   * Create dimension rollup
   */
  server.post('/dimensions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = createDimensionRequestSchema.parse(request.body);

      const dimension = await service.createDimension(orgId, validated as CreateDimensionRequest);

      return reply.status(201).send({
        success: true,
        data: dimension,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating dimension');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/media-performance/dimensions
   * Get dimensions with filters
   */
  server.get('/dimensions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const filters: DimensionFilters = dimensionFiltersSchema.parse({
        dimensionType: queryParams.dimensionType,
        dimensionValue: queryParams.dimensionValue,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
      });

      const limit = queryParams.limit ? Number(queryParams.limit) : 100;
      const offset = queryParams.offset ? Number(queryParams.offset) : 0;

      const result = await service.getDimensions(orgId, filters, limit, offset);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting dimensions');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * ============================================================================
   * SCORE ENDPOINTS
   * ============================================================================
   */

  /**
   * POST /api/media-performance/scores
   * Create or update score
   */
  server.post('/scores', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = createScoreRequestSchema.parse(request.body);

      const score = await service.upsertScore(orgId, validated as CreateScoreRequest);

      return reply.status(201).send({
        success: true,
        data: score,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error upserting score');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/media-performance/scores
   * Get scores with filters
   */
  server.get('/scores', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const filters: ScoreFilters = scoreFiltersSchema.parse({
        entityType: queryParams.entityType,
        entityId: queryParams.entityId,
        scoreType: queryParams.scoreType,
        minScore: queryParams.minScore ? Number(queryParams.minScore) : undefined,
        maxScore: queryParams.maxScore ? Number(queryParams.maxScore) : undefined,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
      });

      const limit = queryParams.limit ? Number(queryParams.limit) : 100;
      const offset = queryParams.offset ? Number(queryParams.offset) : 0;

      const result = await service.getScores(orgId, filters, limit, offset);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting scores');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * ============================================================================
   * INSIGHT ENDPOINTS
   * ============================================================================
   */

  /**
   * POST /api/media-performance/insights
   * Create insight
   */
  server.post('/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = createInsightRequestSchema.parse(request.body);

      const insight = await service.createInsight(orgId, validated as CreateInsightRequest);

      return reply.status(201).send({
        success: true,
        data: insight,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error creating insight');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * POST /api/media-performance/insights/generate/:snapshotId
   * Generate LLM insight from snapshot
   */
  server.post('/insights/generate/:snapshotId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { snapshotId } = request.params as { snapshotId: string };
      const body = request.body as { category?: string };

      if (!body.category) {
        return reply.status(400).send({
          success: false,
          error: 'Category is required',
        });
      }

      const insight = await service.generateInsight(
        orgId,
        snapshotId,
        body.category as InsightCategory
      );

      return reply.status(201).send({
        success: true,
        data: insight,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error generating insight');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * PATCH /api/media-performance/insights/:id
   * Update insight (mark as read/dismissed)
   */
  server.patch('/insights/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };
      const validated = updateInsightRequestSchema.parse(request.body);

      const insight = await service.updateInsight(orgId, id, validated as UpdateInsightRequest);

      return reply.send({
        success: true,
        data: insight,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error updating insight');
      return reply.status(errorMessage.includes('validation') ? 400 : 500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/media-performance/insights
   * Get insights with filters
   */
  server.get('/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const filters: InsightFilters = insightFiltersSchema.parse({
        category: queryParams.category,
        isRead: queryParams.isRead === 'true',
        isDismissed: queryParams.isDismissed === 'true',
        relatedEntityType: queryParams.relatedEntityType,
        relatedEntityId: queryParams.relatedEntityId,
        minImpactScore: queryParams.minImpactScore ? Number(queryParams.minImpactScore) : undefined,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
      });

      const limit = queryParams.limit ? Number(queryParams.limit) : 50;
      const offset = queryParams.offset ? Number(queryParams.offset) : 0;

      const result = await service.getInsights(orgId, filters, limit, offset);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting insights');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * ============================================================================
   * ANALYTICS ENDPOINTS
   * ============================================================================
   */

  /**
   * GET /api/media-performance/trends/:metric
   * Get trend data for a metric
   */
  server.get('/trends/:metric', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { metric } = request.params as { metric: string };
      const queryParams = request.query as Record<string, unknown>;

      const filters: MediaPerformanceFilters = mediaPerformanceFiltersSchema.parse({
        brandId: queryParams.brandId,
        campaignId: queryParams.campaignId,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
      });

      const limit = queryParams.limit ? Number(queryParams.limit) : 100;

      const result = await service.getTrend(orgId, metric as MetricType, filters, limit);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting trend');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/media-performance/anomalies
   * Get detected anomalies
   */
  server.get('/anomalies', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const filters: MediaPerformanceFilters = mediaPerformanceFiltersSchema.parse({
        brandId: queryParams.brandId,
        campaignId: queryParams.campaignId,
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
      });

      const limit = queryParams.limit ? Number(queryParams.limit) : 20;

      const result = await service.getAnomalies(orgId, filters, limit);

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting anomalies');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });

  /**
   * GET /api/media-performance/overview
   * Get performance overview with summary, trends, and insights
   */
  server.get('/overview', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const validated = getOverviewRequestSchema.parse({
        startDate: queryParams.startDate,
        endDate: queryParams.endDate,
        brandId: queryParams.brandId,
        campaignId: queryParams.campaignId,
      });

      const result = await service.getOverview(
        orgId,
        new Date(validated.startDate),
        new Date(validated.endDate),
        validated.brandId,
        validated.campaignId
      );

      return reply.send({
        success: true,
        data: result,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      server.log.error({ err: error }, 'Error getting overview');
      return reply.status(500).send({
        success: false,
        error: errorMessage,
      });
    }
  });
}
