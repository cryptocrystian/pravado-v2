/**
 * Content Intelligence API routes (Sprint S12)
 * Full implementation of Content Intelligence Engine V1
 */

import { FLAGS } from '@pravado/feature-flags';
import type {
  ListContentItemsResponse,
  GetContentItemResponse,
  CreateContentItemResponse,
  UpdateContentItemResponse,
  ListContentBriefsResponse,
  GetContentBriefWithContextResponse,
  CreateContentBriefResponse,
  UpdateContentBriefResponse,
  ListContentClustersResponse,
  ListContentGapsResponse,
  ContentItem,
  ContentBrief,
  AeoGateInfo,
} from '@pravado/types';
import {
  listContentItemsSchema,
  createContentItemSchema,
  updateContentItemSchema,
  listContentBriefsSchema,
  createContentBriefSchema,
  updateContentBriefSchema,
  listContentGapsSchema,
  listContentCalendarSchema,
  createContentCalendarSchema,
  updateContentCalendarSchema,
  validateEnv,
  apiEnvSchema,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { enqueueCiteMindScore } from '../../queue/bullmqQueue';
import {
  planLimitError,
  PLAN_LIMIT_STATUS,
} from '../../services/billing/planLimitReply';
import {
  enforcePlanLimit,
  PlanLimitExceededError,
} from '../../services/billing/planLimitsService';
import {
  CalendarService,
  CalendarAssetNotFoundError,
} from '../../services/calendarService';
import { runAeoGate } from '../../services/citeMind/aeoIngestionGate';
import { pingIndexationOnPublish } from '../../services/citeMind/indexationPingService';
import { enforcePublishGovernance } from '../../services/content/publishGovernance';
import { ContentService } from '../../services/contentService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(
  userId: string,
  supabase: any
): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return userOrgs?.org_id || null;
}

export async function contentRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const contentService = new ContentService(supabase);
  const calendarService = new CalendarService(supabase);

  // ========================================
  // CONTENT ITEMS ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/content/items
   * List content items with filtering and pagination
   */
  server.get<{
    Querystring: {
      status?: string;
      q?: string;
      topicId?: string;
      page?: string;
      pageSize?: string;
      contentType?: string;
    };
    Reply: ListContentItemsResponse;
  }>(
    '/items',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Parse and validate query params
      const validation = listContentItemsSchema.safeParse({
        status: request.query.status,
        q: request.query.q,
        topicId: request.query.topicId,
        page: request.query.page ? parseInt(request.query.page, 10) : undefined,
        pageSize: request.query.pageSize
          ? parseInt(request.query.pageSize, 10)
          : undefined,
        contentType: request.query.contentType,
      });

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
          },
        });
      }

      const filters = validation.data;
      const result = await contentService.listContentItems(orgId, filters);

      return reply.send({
        success: true,
        data: result,
      });
    }
  );

  /**
   * GET /api/v1/content/items/:id
   * Get a single content item by ID
   */
  server.get<{
    Params: { id: string };
    Reply: GetContentItemResponse;
  }>(
    '/items/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { id } = request.params;
      const item = await contentService.getContentItemById(orgId, id);

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content item not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { item },
      });
    }
  );

  /**
   * POST /api/v1/content/items
   * Create a new content item
   */
  server.post<{
    Body: Partial<ContentItem>;
    Reply: CreateContentItemResponse;
  }>(
    '/items',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = createContentItemSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content item data',
          },
        });
      }

      // CRAFT/mo entitlement. `contentDocumentsPerMonth` was defined for every
      // plan but had zero readers — this is the only content-item create path
      // (contentService.createContentItem has exactly one caller), so the limit
      // becomes load-bearing here.
      try {
        await enforcePlanLimit(supabase, orgId, 'contentDocumentsPerMonth');
      } catch (e) {
        if (e instanceof PlanLimitExceededError) {
          return reply
            .code(PLAN_LIMIT_STATUS)
            .send({ success: false, error: planLimitError(e) });
        }
        throw e;
      }

      const data = validation.data;
      const item = await contentService.createContentItem(orgId, data);

      return reply.code(201).send({
        success: true,
        data: { item },
      });
    }
  );

  /**
   * PUT /api/v1/content/items/:id
   * Update an existing content item
   */
  server.put<{
    Params: { id: string };
    Body: Partial<ContentItem>;
    Reply: UpdateContentItemResponse;
  }>(
    '/items/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { id } = request.params;

      // Validate request body
      const validation = updateContentItemSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content item update data',
          },
        });
      }

      const updates = validation.data;
      // Canon governance chokepoint: a transition to `published` is not a plain
      // status write. It must clear the Manual-only mode ceiling (§7.4) and the
      // CiteMind qualification gate (§7.1) BEFORE the DB mutation — a HARD BLOCK.
      // This is the server-side enforcement of "no content bypasses governance".
      if (updates.status === 'published') {
        const governance = await enforcePublishGovernance(
          supabase,
          request.user.id,
          orgId,
          id
        );
        if (!governance.ok) {
          return reply.code(422).send({
            success: false,
            error: {
              code:
                governance.reason === 'mode_ceiling'
                  ? 'PUBLISH_MODE_CEILING'
                  : 'CITEMIND_GATE_BLOCKED',
              message: governance.message ?? 'Publishing is not permitted.',
              details: {
                mode: governance.mode,
                gateStatus: governance.gate?.gate_status,
                score: governance.gate?.score,
                recommendations: governance.gate?.recommendations,
              },
            },
          });
        }
      }

      // The AEO ingestion-readiness gate (below, post-write) is ADVISORY, not a
      // block — canon SEO_AEO §3E: the check is non-optional but never blocks publish.
      const isPublishing = updates.status === 'published';

      const item = await contentService.updateContentItem(orgId, id, updates);

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content item not found',
          },
        });
      }

      // Fire-and-forget: enqueue CiteMind scoring if body was updated
      if (updates.body) {
        enqueueCiteMindScore(id, orgId).catch(() => {
          /* non-critical */
        });
      }

      // Pre-Publish AEO ingestion-readiness gate (canon SEO_AEO_PILLAR_CANON §3E).
      // ADVISORY, never blocking: on publish it always runs and persists the
      // score/band/gaps to aeo_gate_results, and the result is surfaced as
      // non-blocking info on the response. Publish proceeds regardless of score.
      let aeo: AeoGateInfo | undefined;
      if (isPublishing && FLAGS.ENABLE_CITEMIND && FLAGS.ENABLE_AEO_GATE) {
        try {
          const gate = await runAeoGate(supabase, id, orgId);
          aeo = {
            aeo_score: gate.aeo_score,
            band: gate.band,
            passed: gate.passed,
            gaps: gate.gaps,
            explanation: gate.explanation,
          };
        } catch {
          aeo = undefined; // advisory: gate failure must never affect publish
        }
      }

      // Indexation ping on publish (Autopilot; canon §3D / CITEMIND_SYSTEM §2.5).
      // Fire-and-forget IndexNow submit (+ Google Indexing for high-priority).
      if (isPublishing && FLAGS.ENABLE_INDEXNOW && item?.url) {
        pingIndexationOnPublish(supabase, {
          orgId,
          contentItemId: id,
          url: item.url,
        }).catch(() => {
          /* non-critical */
        });
      }

      return reply.send({
        success: true,
        data: { item, ...(aeo ? { aeo } : {}) },
      });
    }
  );

  // ========================================
  // CONTENT BRIEFS ENDPOINTS
  // ========================================

  /**
   * GET /api/v1/content/briefs
   * List content briefs with filtering
   */
  server.get<{
    Querystring: {
      status?: string;
      limit?: string;
      offset?: string;
    };
    Reply: ListContentBriefsResponse;
  }>(
    '/briefs',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Parse and validate query params
      const validation = listContentBriefsSchema.safeParse({
        status: request.query.status,
        limit: request.query.limit
          ? parseInt(request.query.limit, 10)
          : undefined,
        offset: request.query.offset
          ? parseInt(request.query.offset, 10)
          : undefined,
      });

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
          },
        });
      }

      const filters = validation.data;
      const items = await contentService.listContentBriefs(orgId, filters);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );

  /**
   * GET /api/v1/content/briefs/:id
   * Get a content brief with context (related topics and suggested keywords)
   */
  server.get<{
    Params: { id: string };
    Reply: GetContentBriefWithContextResponse;
  }>(
    '/briefs/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { id } = request.params;
      const briefWithContext = await contentService.getContentBriefWithContext(
        orgId,
        id
      );

      if (!briefWithContext) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content brief not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: briefWithContext,
      });
    }
  );

  /**
   * POST /api/v1/content/briefs
   * Create a new content brief
   */
  server.post<{
    Body: Partial<ContentBrief>;
    Reply: CreateContentBriefResponse;
  }>(
    '/briefs',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate request body
      const validation = createContentBriefSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content brief data',
          },
        });
      }

      const data = validation.data;
      const item = await contentService.createContentBrief(orgId, data);

      return reply.code(201).send({
        success: true,
        data: { item },
      });
    }
  );

  /**
   * PUT /api/v1/content/briefs/:id
   * Update an existing content brief
   */
  server.put<{
    Params: { id: string };
    Body: Partial<ContentBrief>;
    Reply: UpdateContentBriefResponse;
  }>(
    '/briefs/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { id } = request.params;

      // Validate request body
      const validation = updateContentBriefSchema.safeParse(request.body);

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid content brief update data',
          },
        });
      }

      const updates = validation.data;
      const item = await contentService.updateContentBrief(orgId, id, updates);

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Content brief not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { item },
      });
    }
  );

  // ========================================
  // CONTENT CLUSTERS ENDPOINT
  // ========================================

  /**
   * GET /api/v1/content/clusters
   * Get content topic clusters with topics and representative content
   */
  server.get<{
    Reply: ListContentClustersResponse;
  }>(
    '/clusters',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const items = await contentService.listContentClusters(orgId);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );

  // ========================================
  // CONTENT GAPS ENDPOINT
  // ========================================

  /**
   * GET /api/v1/content/gaps
   * Get content gap opportunities based on SEO keywords vs existing content
   */
  server.get<{
    Querystring: {
      keyword?: string;
      minScore?: string;
      topicId?: string;
      limit?: string;
    };
    Reply: ListContentGapsResponse;
  }>(
    '/gaps',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Parse and validate query params
      const validation = listContentGapsSchema.safeParse({
        keyword: request.query.keyword,
        minScore: request.query.minScore
          ? parseFloat(request.query.minScore)
          : undefined,
        topicId: request.query.topicId,
        limit: request.query.limit
          ? parseInt(request.query.limit, 10)
          : undefined,
      });

      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
          },
        });
      }

      const filters = validation.data;
      const items = await contentService.listContentGaps(orgId, filters);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );

  // ========================================
  // CONTENT CALENDAR ENDPOINTS (W2)
  // ========================================
  // Scheduling metadata + click-to-open ONLY. These endpoints NEVER publish,
  // execute, or route through publish governance. `automation_mode` is stored
  // as metadata and is not an execution trigger — there is no auto-publish path.

  /**
   * GET /api/v1/content/calendar?from=&to=
   * List the org's calendar entries (joined to content_items), ordered by
   * scheduled_at. Honest empty array when nothing is scheduled.
   */
  server.get<{
    Querystring: { from?: string; to?: string };
  }>(
    '/calendar',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const validation = listContentCalendarSchema.safeParse({
        from: request.query.from,
        to: request.query.to,
      });
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
          },
        });
      }

      const items = await calendarService.listEntries(orgId, validation.data);

      return reply.send({
        success: true,
        data: { items },
      });
    }
  );

  /**
   * POST /api/v1/content/calendar
   * Schedule an existing content item onto a date. The asset MUST belong to the
   * caller's org — cross-org / unknown assets are rejected with 400.
   */
  server.post<{
    Body: {
      asset_id?: string;
      scheduled_at?: string;
      campaign?: string;
      theme?: string;
      automation_mode?: string;
    };
  }>(
    '/calendar',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const validation = createContentCalendarSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid calendar entry data',
          },
        });
      }

      const body = validation.data;

      try {
        const item = await calendarService.createEntry(orgId, {
          assetId: body.asset_id,
          scheduledAt: body.scheduled_at,
          campaign: body.campaign,
          theme: body.theme,
          automationMode: body.automation_mode,
        });

        return reply.code(201).send({
          success: true,
          data: { item },
        });
      } catch (e) {
        // Cross-org / unknown asset — reject as a client error, never a 5xx and
        // never a silent success.
        if (e instanceof CalendarAssetNotFoundError) {
          return reply.code(400).send({
            success: false,
            error: {
              code: 'ASSET_NOT_IN_ORG',
              message: e.message,
            },
          });
        }
        throw e;
      }
    }
  );

  /**
   * PUT /api/v1/content/calendar/:id
   * Reschedule / update a calendar entry, org-scoped.
   */
  server.put<{
    Params: { id: string };
    Body: {
      scheduled_at?: string;
      campaign?: string | null;
      theme?: string | null;
      automation_mode?: string;
    };
  }>(
    '/calendar/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const validation = updateContentCalendarSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid calendar entry update data',
          },
        });
      }

      const { id } = request.params;
      const body = validation.data;

      const item = await calendarService.updateEntry(orgId, id, {
        scheduledAt: body.scheduled_at,
        campaign: body.campaign,
        theme: body.theme,
        automationMode: body.automation_mode,
      });

      if (!item) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Calendar entry not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { item },
      });
    }
  );

  /**
   * DELETE /api/v1/content/calendar/:id
   * Unschedule a calendar entry, org-scoped.
   */
  server.delete<{
    Params: { id: string };
  }>(
    '/calendar/:id',
    {
      preHandler: requireUser,
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      const { id } = request.params;
      const deleted = await calendarService.deleteEntry(orgId, id);

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Calendar entry not found',
          },
        });
      }

      return reply.send({
        success: true,
        data: { id },
      });
    }
  );
}
