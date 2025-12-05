/**
 * Journalist Relationship Timeline Routes (Sprint S49)
 * API routes for journalist relationship timeline and narrative generation
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { FLAGS } from '@pravado/feature-flags';
import { JournalistTimelineService } from '../../services/journalistTimelineService';
import { NarrativeGeneratorService } from '../../services/narrativeGeneratorService';
import { BillingService } from '../../services/billingService';
import { requireUser } from '../../middleware/requireUser';
import {
  CreateTimelineEventInputSchema,
  UpdateTimelineEventInputSchema,
  CreateManualNoteInputSchema,
  TimelineQuerySchema,
  GenerateNarrativeInputSchema,
  BatchCreateTimelineEventsInputSchema,
  SystemEventPushSchema,
  type CreateTimelineEventInput,
  type UpdateTimelineEventInput,
  type CreateManualNoteInput,
  type TimelineQuery,
  type GenerateNarrativeInput,
  type BatchCreateTimelineEventsInput,
  type SystemEventPush,
} from '@pravado/validators';
import type {
  JournalistTimelineEvent,
  TimelineListResponse,
  TimelineStats,
  RelationshipHealthScore,
  TimelineAggregation,
  TimelineCluster,
  BatchCreateTimelineEventsResult,
  JournalistNarrative,
} from '@pravado/types';
import { LlmRouter } from '@pravado/utils';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: SupabaseClient): Promise<string | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id')
    .eq('id', userId)
    .single();

  return profile?.org_id || null;
}

export async function journalistTimelineRoutes(fastify: FastifyInstance) {
  // Check feature flag
  if (!FLAGS.ENABLE_JOURNALIST_TIMELINE) {
    fastify.log.info('Journalist timeline routes disabled by feature flag');
    return;
  }

  const supabase = (fastify as unknown as { supabase: SupabaseClient }).supabase;

  // ========================================
  // Core Event Management
  // ========================================

  // POST /api/v1/journalist-timeline/events
  fastify.post<{
    Body: CreateTimelineEventInput;
    Reply: JournalistTimelineEvent | { error: string };
  }>(
    '/events',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: CreateTimelineEventInput }>, reply: FastifyReply) => {
      try {
        const validationResult = CreateTimelineEventInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const event = await timelineService.createEvent(orgId, input, user.id);

        return reply.status(201).send(event);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-timeline/events' }, 'Failed to create timeline event');
        return reply.status(500).send({ error: 'Failed to create timeline event', message: error.message });
      }
    }
  );

  // GET /api/v1/journalist-timeline/events/:id
  fastify.get<{
    Params: { id: string };
    Reply: JournalistTimelineEvent | { error: string };
  }>(
    '/events/:id',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const event = await timelineService.getEvent(orgId, request.params.id);

        if (!event) {
          return reply.status(404).send({ error: 'Timeline event not found' });
        }

        return reply.status(200).send(event);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /journalist-timeline/events/:id' }, 'Failed to get timeline event');
        return reply.status(500).send({ error: 'Failed to get timeline event', message: error.message });
      }
    }
  );

  // PATCH /api/v1/journalist-timeline/events/:id
  fastify.patch<{
    Params: { id: string };
    Body: UpdateTimelineEventInput;
    Reply: JournalistTimelineEvent | { error: string };
  }>(
    '/events/:id',
    { onRequest: [requireUser] },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: UpdateTimelineEventInput }>,
      reply: FastifyReply
    ) => {
      try {
        const validationResult = UpdateTimelineEventInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const event = await timelineService.updateEvent(orgId, request.params.id, input);

        return reply.status(200).send(event);
      } catch (error: any) {
        fastify.log.error({ error, route: 'PATCH /journalist-timeline/events/:id' }, 'Failed to update timeline event');
        return reply.status(500).send({ error: 'Failed to update timeline event', message: error.message });
      }
    }
  );

  // DELETE /api/v1/journalist-timeline/events/:id
  fastify.delete<{
    Params: { id: string };
    Reply: { success: boolean } | { error: string };
  }>(
    '/events/:id',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        await timelineService.deleteEvent(orgId, request.params.id);

        return reply.status(200).send({ success: true });
      } catch (error: any) {
        fastify.log.error({ error, route: 'DELETE /journalist-timeline/events/:id' }, 'Failed to delete timeline event');
        return reply.status(500).send({ error: 'Failed to delete timeline event', message: error.message });
      }
    }
  );

  // GET /api/v1/journalist-timeline/events
  fastify.get<{
    Querystring: TimelineQuery;
    Reply: TimelineListResponse | { error: string };
  }>(
    '/events',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Querystring: TimelineQuery }>, reply: FastifyReply) => {
      try {
        const validationResult = TimelineQuerySchema.safeParse(request.query);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid query parameters', details: validationResult.error.errors });
        }

        const query = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const result = await timelineService.listEvents(orgId, query);

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /journalist-timeline/events' }, 'Failed to list timeline events');
        return reply.status(500).send({ error: 'Failed to list timeline events', message: error.message });
      }
    }
  );

  // ========================================
  // Statistics & Analytics
  // ========================================

  // GET /api/v1/journalist-timeline/stats/:journalistId
  fastify.get<{
    Params: { journalistId: string };
    Reply: TimelineStats | { error: string };
  }>(
    '/stats/:journalistId',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { journalistId: string } }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const stats = await timelineService.getStats(orgId, request.params.journalistId);

        return reply.status(200).send(stats);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /journalist-timeline/stats/:journalistId' }, 'Failed to get timeline stats');
        return reply.status(500).send({ error: 'Failed to get timeline stats', message: error.message });
      }
    }
  );

  // GET /api/v1/journalist-timeline/health-score/:journalistId
  fastify.get<{
    Params: { journalistId: string };
    Reply: RelationshipHealthScore | { error: string };
  }>(
    '/health-score/:journalistId',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { journalistId: string } }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const healthScore = await timelineService.calculateHealthScore(orgId, request.params.journalistId);

        return reply.status(200).send(healthScore);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /journalist-timeline/health-score/:journalistId' }, 'Failed to calculate health score');
        return reply.status(500).send({ error: 'Failed to calculate health score', message: error.message });
      }
    }
  );

  // GET /api/v1/journalist-timeline/aggregation/:journalistId
  fastify.get<{
    Params: { journalistId: string };
    Querystring: {
      period: 'day' | 'week' | 'month';
      startDate: string;
      endDate: string;
    };
    Reply: TimelineAggregation | { error: string };
  }>(
    '/aggregation/:journalistId',
    { onRequest: [requireUser] },
    async (
      request: FastifyRequest<{
        Params: { journalistId: string };
        Querystring: { period: 'day' | 'week' | 'month'; startDate: string; endDate: string };
      }>,
      reply: FastifyReply
    ) => {
      try {
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const { period, startDate, endDate } = request.query;

        if (!['day', 'week', 'month'].includes(period)) {
          return reply.status(400).send({ error: 'Invalid period. Must be day, week, or month.' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const aggregation = await timelineService.getAggregation(
          orgId,
          request.params.journalistId,
          period,
          new Date(startDate),
          new Date(endDate)
        );

        return reply.status(200).send(aggregation);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /journalist-timeline/aggregation/:journalistId' }, 'Failed to get timeline aggregation');
        return reply.status(500).send({ error: 'Failed to get timeline aggregation', message: error.message });
      }
    }
  );

  // ========================================
  // Event Clustering
  // ========================================

  // POST /api/v1/journalist-timeline/auto-cluster/:journalistId
  fastify.post<{
    Params: { journalistId: string };
    Reply: { clustersCreated: number } | { error: string };
  }>(
    '/auto-cluster/:journalistId',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { journalistId: string } }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const clustersCreated = await timelineService.autoClusterEvents(orgId, request.params.journalistId);

        return reply.status(200).send({ clustersCreated });
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-timeline/auto-cluster/:journalistId' }, 'Failed to auto-cluster events');
        return reply.status(500).send({ error: 'Failed to auto-cluster events', message: error.message });
      }
    }
  );

  // GET /api/v1/journalist-timeline/clusters/:clusterId
  fastify.get<{
    Params: { clusterId: string };
    Reply: TimelineCluster | { error: string };
  }>(
    '/clusters/:clusterId',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Params: { clusterId: string } }>, reply: FastifyReply) => {
      try {
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const cluster = await timelineService.getCluster(orgId, request.params.clusterId);

        return reply.status(200).send(cluster);
      } catch (error: any) {
        fastify.log.error({ error, route: 'GET /journalist-timeline/clusters/:clusterId' }, 'Failed to get cluster');
        return reply.status(500).send({ error: 'Failed to get cluster', message: error.message });
      }
    }
  );

  // ========================================
  // Batch Operations
  // ========================================

  // POST /api/v1/journalist-timeline/batch
  fastify.post<{
    Body: BatchCreateTimelineEventsInput;
    Reply: BatchCreateTimelineEventsResult | { error: string };
  }>(
    '/batch',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: BatchCreateTimelineEventsInput }>, reply: FastifyReply) => {
      try {
        const validationResult = BatchCreateTimelineEventsInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const result = await timelineService.batchCreateEvents(orgId, input, user.id);

        return reply.status(200).send(result);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-timeline/batch' }, 'Failed to batch create events');
        return reply.status(500).send({ error: 'Failed to batch create events', message: error.message });
      }
    }
  );

  // ========================================
  // Manual Notes
  // ========================================

  // POST /api/v1/journalist-timeline/notes
  fastify.post<{
    Body: CreateManualNoteInput;
    Reply: JournalistTimelineEvent | { error: string };
  }>(
    '/notes',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: CreateManualNoteInput }>, reply: FastifyReply) => {
      try {
        const validationResult = CreateManualNoteInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const note = await timelineService.createManualNote(orgId, input, user.id);

        return reply.status(201).send(note);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-timeline/notes' }, 'Failed to create manual note');
        return reply.status(500).send({ error: 'Failed to create manual note', message: error.message });
      }
    }
  );

  // ========================================
  // Narrative Generation
  // ========================================

  // POST /api/v1/journalist-timeline/narrative
  fastify.post<{
    Body: GenerateNarrativeInput;
    Reply: JournalistNarrative | { error: string };
  }>(
    '/narrative',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: GenerateNarrativeInput }>, reply: FastifyReply) => {
      try {
        const validationResult = GenerateNarrativeInputSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const input = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        // Initialize services
        const billingService = new BillingService(supabase);
        const llmRouter = new LlmRouter();
        const narrativeService = new NarrativeGeneratorService(supabase, billingService, llmRouter);

        const narrative = await narrativeService.generateNarrative(orgId, input);

        return reply.status(200).send(narrative);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-timeline/narrative' }, 'Failed to generate narrative');
        return reply.status(500).send({ error: 'Failed to generate narrative', message: error.message });
      }
    }
  );

  // ========================================
  // System Integration (S38-S48 Event Push)
  // ========================================

  // POST /api/v1/journalist-timeline/push-event
  // This endpoint is for internal use by S38-S48 systems to push events
  fastify.post<{
    Body: SystemEventPush;
    Reply: JournalistTimelineEvent | { error: string };
  }>(
    '/push-event',
    { onRequest: [requireUser] },
    async (request: FastifyRequest<{ Body: SystemEventPush }>, reply: FastifyReply) => {
      try {
        const validationResult = SystemEventPushSchema.safeParse(request.body);
        if (!validationResult.success) {
          return reply.status(400).send({ error: 'Invalid input', details: validationResult.error.errors });
        }

        const event = validationResult.data;
        const user = (request as any).user;
        const orgId = await getUserOrgId(user.id, supabase);

        if (!orgId) {
          return reply.status(403).send({ error: 'User organization not found' });
        }

        const timelineService = new JournalistTimelineService(supabase);
        const timelineEvent = await timelineService.pushSystemEvent(orgId, event);

        return reply.status(201).send(timelineEvent);
      } catch (error: any) {
        fastify.log.error({ error, route: 'POST /journalist-timeline/push-event' }, 'Failed to push system event');
        return reply.status(500).send({ error: 'Failed to push system event', message: error.message });
      }
    }
  );
}
