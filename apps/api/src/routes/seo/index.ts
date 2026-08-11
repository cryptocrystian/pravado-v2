/**
 * SEO Intelligence API routes (S4 - Real Implementation, S5 - On-Page & Backlinks)
 */

import type {
  ApiResponse,
  ListSEOKeywordsWithMetricsResponse,
  ListSEOOpportunityDTOsResponse,
  GetSEOSerpSnapshotResponse,
  GetSEOPageAuditResponse,
  GetSEOBacklinkProfileResponse,
} from '@pravado/types';
import {
  listSEOKeywordsSchema,
  listSEOOpportunitiesSchema,
  getSEOSerpSnapshotSchema,
  getSEOPageAuditSchema,
  getSEOBacklinkProfileSchema,
  validateEnv,
  apiEnvSchema,
} from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { SEOBacklinkService } from '../../services/seoBacklinkService';
import {
  SEOCompetitorService,
  type SEOCompetitorAnalysis,
  type RefreshCompetitorsResult,
} from '../../services/seoCompetitorService';
import { SEOKeywordService } from '../../services/seoKeywordService';
import { SEOOnPageService } from '../../services/seoOnPageService';
import { SEOOpportunityService } from '../../services/seoOpportunityService';
import { resolveSerpProvider } from '../../services/seoSerpProvider';
import { SEOSerpService } from '../../services/seoSerpService';
import {
  SEOTopicClusterService,
  type SeoKeywordCluster,
} from '../../services/seoTopicClusterService';

// Response envelopes for the Competitors surface (apps/api-scoped for now).
type GetSEOCompetitorsResponse = ApiResponse<SEOCompetitorAnalysis>;
type RefreshSEOCompetitorsResponse = ApiResponse<RefreshCompetitorsResult>;

// Response envelope for the Topics surface (apps/api-scoped for now).
type GetSEOTopicsResponse = ApiResponse<{ clusters: SeoKeywordCluster[] }>;

export async function seoRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Services
  const keywordService = new SEOKeywordService(supabase);
  const serpService = new SEOSerpService(supabase);
  const opportunityService = new SEOOpportunityService(supabase);
  const onPageService = new SEOOnPageService(supabase);
  const backlinkService = new SEOBacklinkService(supabase);
  const competitorService = new SEOCompetitorService(supabase);
  const topicClusterService = new SEOTopicClusterService(supabase);

  /**
   * Helper to get user's org ID
   * For S4, we use the user's first org
   * TODO S5+: Support org selection/switching
   */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data: userOrgs } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    return userOrgs?.org_id || null;
  }

  // ========================================
  // GET /api/v1/seo/keywords
  // List keywords with metrics, supports search and filtering
  // ========================================
  server.get<{
    Querystring: {
      q?: string;
      page?: string;
      pageSize?: string;
      status?: string;
      intent?: string;
      sortBy?: string;
      sortOrder?: string;
    };
    Reply: ListSEOKeywordsWithMetricsResponse;
  }>(
    '/keywords',
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

      const orgId = await getUserOrgId(request.user.id);
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
      const validation = listSEOKeywordsSchema.safeParse({
        q: request.query.q,
        page: request.query.page ? parseInt(request.query.page, 10) : undefined,
        pageSize: request.query.pageSize
          ? parseInt(request.query.pageSize, 10)
          : undefined,
        status: request.query.status,
        intent: request.query.intent,
        sortBy: request.query.sortBy,
        sortOrder: request.query.sortOrder,
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

      try {
        const result = await keywordService.listKeywords(
          orgId,
          validation.data
        );

        return {
          success: true,
          data: {
            items: result.items,
            total: result.total,
            page: validation.data.page || 1,
            pageSize: validation.data.pageSize || 20,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch keywords',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/seo/serp
  // Get SERP snapshot for a keyword
  // ========================================
  server.get<{
    Querystring: { keywordId: string };
    Reply: GetSEOSerpSnapshotResponse;
  }>(
    '/serp',
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

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate query params
      const validation = getSEOSerpSnapshotSchema.safeParse({
        keywordId: request.query.keywordId,
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

      try {
        const snapshot = await serpService.getSerpSnapshotForKeyword(
          orgId,
          validation.data.keywordId
        );

        if (!snapshot) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Keyword not found or no SERP data available',
            },
          });
        }

        return {
          success: true,
          data: {
            snapshot,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch SERP snapshot',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/seo/opportunities
  // List SEO opportunities (DTOs with recommendations)
  // ========================================
  server.get<{
    Querystring: {
      limit?: string;
      offset?: string;
      opportunityType?: string;
      priority?: string;
      status?: string;
      minPriorityScore?: string;
    };
    Reply: ListSEOOpportunityDTOsResponse;
  }>(
    '/opportunities',
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

      const orgId = await getUserOrgId(request.user.id);
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
      const validation = listSEOOpportunitiesSchema.safeParse({
        limit: request.query.limit
          ? parseInt(request.query.limit, 10)
          : undefined,
        offset: request.query.offset
          ? parseInt(request.query.offset, 10)
          : undefined,
        opportunityType: request.query.opportunityType,
        priority: request.query.priority,
        status: request.query.status,
        minPriorityScore: request.query.minPriorityScore
          ? parseFloat(request.query.minPriorityScore)
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

      try {
        const opportunities = await opportunityService.listOpportunities(
          orgId,
          validation.data
        );

        return {
          success: true,
          data: {
            items: opportunities,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch opportunities',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/seo/onpage
  // Get on-page audit for a page (S5)
  // ========================================
  server.get<{
    Querystring: {
      pageId: string;
      auditType?: string;
    };
    Reply: GetSEOPageAuditResponse;
  }>(
    '/onpage',
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

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate query params
      const validation = getSEOPageAuditSchema.safeParse({
        pageId: request.query.pageId,
        auditType: request.query.auditType,
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

      try {
        const auditWithIssues = await onPageService.getPageAudit(
          orgId,
          validation.data.pageId,
          validation.data.auditType
        );

        if (!auditWithIssues) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Page not found',
            },
          });
        }

        return {
          success: true,
          data: {
            auditWithIssues,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch page audit',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/seo/backlinks
  // Get backlink profile (org-wide or page-specific) (S5)
  // ========================================
  server.get<{
    Querystring: {
      pageId?: string;
    };
    Reply: GetSEOBacklinkProfileResponse;
  }>(
    '/backlinks',
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

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      // Validate query params
      const validation = getSEOBacklinkProfileSchema.safeParse({
        pageId: request.query.pageId,
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

      try {
        const profile = await backlinkService.getBacklinkProfile(
          orgId,
          validation.data.pageId
        );

        return {
          success: true,
          data: {
            profile,
          },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch backlink profile',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/seo/competitors
  // Share-of-Voice + competitor positions from CACHED SERP data (org-scoped).
  // Read-only, free (no provider call). Honest-empty when there is no cache.
  // ========================================
  server.get<{
    Reply: GetSEOCompetitorsResponse;
  }>(
    '/competitors',
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

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      try {
        const analysis = await competitorService.getCompetitorAnalysis(orgId);
        return {
          success: true,
          data: analysis,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch competitor analysis',
          },
        });
      }
    }
  );

  // ========================================
  // POST /api/v1/seo/competitors/refresh
  // DELIBERATE, COSTED refresh (org-scoped): fetches live SERPs per tracked
  // keyword via the DataForSEO SERP provider and caches positions. With NO
  // DataForSEO credentials the Null provider is selected and this is an honest
  // no-op (nothing fetched, nothing written). Each processed keyword spends one
  // DataForSEO SERP call (~$0.002) — never called on a read path.
  // ========================================
  server.post<{
    Body: {
      maxKeywords?: number;
      locationCode?: number;
      languageCode?: string;
      depth?: number;
    };
    Reply: RefreshSEOCompetitorsResponse;
  }>(
    '/competitors/refresh',
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

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      try {
        const provider = resolveSerpProvider();
        const result = await competitorService.refreshCompetitors(
          orgId,
          provider,
          {
            maxKeywords: request.body?.maxKeywords,
            locationCode: request.body?.locationCode,
            languageCode: request.body?.languageCode,
            depth: request.body?.depth,
          }
        );
        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to refresh competitor data',
          },
        });
      }
    }
  );

  // ========================================
  // GET /api/v1/seo/topics
  // Topic clusters (SERP-overlap) from CACHED SERP data (org-scoped). Clustering
  // makes NO paid API calls — it reads the stored `seo_serp_results` populated by
  // the competitor refresh, derives clusters + real metrics, persists them, and
  // returns them. Honest-empty (`{ clusters: [] }`) when there is no cached SERP
  // data yet. Real errors are surfaced; no fake-success fallback.
  // ========================================
  server.get<{
    Reply: GetSEOTopicsResponse;
  }>(
    '/topics',
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

      const orgId = await getUserOrgId(request.user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: {
            code: 'NO_ORG',
            message: 'User is not a member of any organization',
          },
        });
      }

      try {
        // Free (no external call): recompute from cached SERP data and return the
        // freshly persisted clusters. Honest-empty when there is no SERP cache.
        const result = await topicClusterService.computeClusters(orgId);
        return {
          success: true,
          data: { clusters: result.clusters },
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to compute topic clusters',
          },
        });
      }
    }
  );
}
