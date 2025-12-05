/**
 * Competitive Intelligence API Routes (Sprint S53)
 *
 * REST API endpoints for competitive intelligence engine:
 * - Competitor profile management
 * - Mention tracking
 * - Metrics snapshots
 * - Comparative analytics
 * - Overlap analysis
 * - Strategic insights
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { CompetitorIntelligenceService } from '../../services/competitorIntelligenceService';
import {
  createCompetitorRequestSchema,
  updateCompetitorRequestSchema,
  createCompetitorMentionRequestSchema,
  createCompetitorInsightRequestSchema,
  updateCompetitorInsightRequestSchema,
  generateInsightRequestSchema,
  competitorFiltersSchema,
  competitorMentionFiltersSchema,
  snapshotFiltersSchema,
  ciInsightFiltersSchema,
  overlapFiltersSchema,
  competitorIdParamSchema,
  evaluateCompetitorRequestSchema,
  comparativeAnalyticsRequestSchema,
  overlapAnalysisRequestSchema,
} from '@pravado/validators';
import {
  CIInsightCategory,
  type CreateCompetitorRequest,
  type UpdateCompetitorRequest,
  type CreateCompetitorMentionRequest,
  type CreateCompetitorInsightRequest,
  type UpdateCompetitorInsightRequest,
  type GenerateInsightRequest,
  type CompetitorFilters,
  type CompetitorMentionFilters,
  type SnapshotFilters,
  type CIInsightFilters,
  type OverlapFilters,
  type OverlapType,
  type SnapshotPeriod,
} from '@pravado/types';

// Helper to extract orgId from headers
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Missing x-org-id header');
  }
  return orgId;
}

export default async function competitorIntelligenceRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = new CompetitorIntelligenceService(supabase);

  // =========================================================================
  // COMPETITOR MANAGEMENT ENDPOINTS
  // =========================================================================

  /**
   * POST /competitors
   * Create a new competitor profile
   */
  server.post('/competitors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = createCompetitorRequestSchema.parse(request.body);
      const competitor = await service.createCompetitor(orgId, validated as CreateCompetitorRequest);

      return reply.status(201).send({
        success: true,
        data: competitor,
      });
    } catch (error: any) {
      server.log.error('Error creating competitor:', error);
      return reply.status(error.message.includes('validation') ? 400 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /competitors
   * List competitors with filters and pagination
   */
  server.get('/competitors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { limit = 20, offset = 0, ...filters } = request.query as any;

      const validatedFilters = competitorFiltersSchema.parse(filters);
      const response = await service.getCompetitors(
        orgId,
        validatedFilters as CompetitorFilters,
        Number(limit),
        Number(offset)
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      server.log.error('Error fetching competitors:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /competitors/:id
   * Get single competitor by ID
   */
  server.get('/competitors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const competitor = await service.getCompetitor(orgId, id);

      return reply.send({
        success: true,
        data: competitor,
      });
    } catch (error: any) {
      server.log.error('Error fetching competitor:', error);
      return reply.status(error.message.includes('not found') ? 404 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /competitors/:id
   * Update competitor profile
   */
  server.patch('/competitors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const validated = updateCompetitorRequestSchema.parse(request.body);
      const competitor = await service.updateCompetitor(
        orgId,
        id,
        validated as UpdateCompetitorRequest
      );

      return reply.send({
        success: true,
        data: competitor,
      });
    } catch (error: any) {
      server.log.error('Error updating competitor:', error);
      return reply.status(error.message.includes('validation') ? 400 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * DELETE /competitors/:id
   * Delete (deactivate) competitor
   */
  server.delete('/competitors/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      await service.deleteCompetitor(orgId, id);

      return reply.send({
        success: true,
        message: 'Competitor deactivated successfully',
      });
    } catch (error: any) {
      server.log.error('Error deleting competitor:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // MENTION TRACKING ENDPOINTS
  // =========================================================================

  /**
   * POST /mentions
   * Create a competitor mention
   */
  server.post('/mentions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = createCompetitorMentionRequestSchema.parse(request.body);
      const mention = await service.createMention(orgId, validated as CreateCompetitorMentionRequest);

      return reply.status(201).send({
        success: true,
        data: mention,
      });
    } catch (error: any) {
      server.log.error('Error creating mention:', error);
      return reply.status(error.message.includes('validation') ? 400 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /mentions
   * Get mentions with filters and pagination
   */
  server.get('/mentions', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { limit = 50, offset = 0, ...filters } = request.query as any;

      const validatedFilters = competitorMentionFiltersSchema.parse(filters);
      const response = await service.getMentions(
        orgId,
        validatedFilters as CompetitorMentionFilters,
        Number(limit),
        Number(offset)
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      server.log.error('Error fetching mentions:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // SNAPSHOT & METRICS ENDPOINTS
  // =========================================================================

  /**
   * POST /competitors/:id/snapshots
   * Create a new metrics snapshot
   */
  server.post('/competitors/:id/snapshots', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const { period = 'daily' } = request.body as any;

      const snapshot = await service.createSnapshot(orgId, id, period);

      return reply.status(201).send({
        success: true,
        data: snapshot,
      });
    } catch (error: any) {
      server.log.error('Error creating snapshot:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /snapshots
   * Get snapshots with filters and pagination
   */
  server.get('/snapshots', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { limit = 50, offset = 0, ...filters } = request.query as any;

      const validatedFilters = snapshotFiltersSchema.parse(filters);
      const response = await service.getSnapshots(
        orgId,
        validatedFilters as SnapshotFilters,
        Number(limit),
        Number(offset)
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      server.log.error('Error fetching snapshots:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /competitors/:id/metrics
   * Get competitor metrics summary
   */
  server.get('/competitors/:id/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const { startDate, endDate } = request.query as any;

      if (!startDate || !endDate) {
        return reply.status(400).send({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
      }

      const metrics = await service.getCompetitorMetrics(
        orgId,
        id,
        new Date(startDate),
        new Date(endDate)
      );

      return reply.send({
        success: true,
        data: metrics,
      });
    } catch (error: any) {
      server.log.error('Error fetching competitor metrics:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // COMPARATIVE ANALYTICS ENDPOINTS
  // =========================================================================

  /**
   * POST /competitors/:id/compare
   * Get comparative analytics (brand vs competitor)
   */
  server.post('/competitors/:id/compare', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const validated = comparativeAnalyticsRequestSchema.parse({
        ...body,
        competitorId: id,
      });

      const analytics = await service.getComparativeAnalytics(
        orgId,
        id,
        new Date(validated.startDate),
        new Date(validated.endDate),
        validated.brandId
      );

      return reply.send({
        success: true,
        data: analytics,
      });
    } catch (error: any) {
      server.log.error('Error generating comparative analytics:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // OVERLAP ANALYSIS ENDPOINTS
  // =========================================================================

  /**
   * POST /competitors/:id/overlap
   * Analyze coverage/journalist overlap
   */
  server.post('/competitors/:id/overlap', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const validated = overlapAnalysisRequestSchema.parse({
        ...body,
        competitorId: id,
      });

      const overlap = await service.analyzeOverlap(
        orgId,
        id,
        validated.overlapType as OverlapType,
        validated.timeWindowDays
      );

      return reply.send({
        success: true,
        data: overlap,
      });
    } catch (error: any) {
      server.log.error('Error analyzing overlap:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /overlap
   * Get overlap analyses with filters
   */
  server.get('/overlap', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { limit = 20, offset = 0, ...filters } = request.query as any;

      const validatedFilters = overlapFiltersSchema.parse(filters);
      const response = await service.getOverlap(
        orgId,
        validatedFilters as OverlapFilters,
        Number(limit),
        Number(offset)
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      server.log.error('Error fetching overlap analyses:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  // =========================================================================
  // INSIGHT GENERATION ENDPOINTS
  // =========================================================================

  /**
   * POST /insights
   * Create a competitor insight
   */
  server.post('/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = createCompetitorInsightRequestSchema.parse(request.body);
      const insight = await service.createInsight(orgId, validated as CreateCompetitorInsightRequest);

      return reply.status(201).send({
        success: true,
        data: insight,
      });
    } catch (error: any) {
      server.log.error('Error creating insight:', error);
      return reply.status(error.message.includes('validation') ? 400 : 500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /insights
   * Get insights with filters and pagination
   */
  server.get('/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { limit = 20, offset = 0, ...filters } = request.query as any;

      const validatedFilters = ciInsightFiltersSchema.parse(filters);
      const response = await service.getInsights(
        orgId,
        validatedFilters as CIInsightFilters,
        Number(limit),
        Number(offset)
      );

      return reply.send({
        success: true,
        data: response,
      });
    } catch (error: any) {
      server.log.error('Error fetching insights:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * PATCH /insights/:id
   * Update insight (mark as read/dismissed)
   */
  server.patch('/insights/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const validated = updateCompetitorInsightRequestSchema.parse(request.body);
      const insight = await service.updateInsight(
        orgId,
        id,
        validated as UpdateCompetitorInsightRequest
      );

      return reply.send({
        success: true,
        data: insight,
      });
    } catch (error: any) {
      server.log.error('Error updating insight:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /insights/generate
   * Generate LLM-based competitive insight
   */
  server.post('/insights/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const validated = generateInsightRequestSchema.parse(request.body);
      const insight = await service.generateInsight(orgId, validated as GenerateInsightRequest);

      return reply.status(201).send({
        success: true,
        data: insight,
      });
    } catch (error: any) {
      server.log.error('Error generating insight:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /competitors/:id/evaluate
   * Manual competitor evaluation (refresh all metrics)
   */
  server.post('/competitors/:id/evaluate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = competitorIdParamSchema.parse(request.params);
      const body = request.body as Record<string, unknown>;
      const validated = evaluateCompetitorRequestSchema.parse({
        ...body,
        competitorId: id,
      });

      // Create new snapshot
      const snapshot = await service.createSnapshot(orgId, id, 'daily' as SnapshotPeriod);

      // Generate insights for all categories
      const insightCategories: CIInsightCategory[] = [
        CIInsightCategory.ADVANTAGE,
        CIInsightCategory.THREAT,
        CIInsightCategory.OPPORTUNITY,
      ];
      const insights = await Promise.all(
        insightCategories.map((category) =>
          service.generateInsight(orgId, {
            competitorId: id,
            category,
            timeWindowDays: validated.timeWindowDays || 30,
          })
        )
      );

      return reply.send({
        success: true,
        data: {
          snapshot,
          insights,
          message: 'Competitor evaluation completed successfully',
        },
      });
    } catch (error: any) {
      server.log.error('Error evaluating competitor:', error);
      return reply.status(500).send({
        success: false,
        error: error.message,
      });
    }
  });
}
