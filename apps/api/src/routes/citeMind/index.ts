/**
 * CiteMind API Routes (Sprint S-INT-04)
 *
 * Routes:
 * - POST /score/:contentItemId — trigger scoring (sync, returns score)
 * - GET  /score/:contentItemId — get latest score
 * - GET  /scores               — list scores for org
 * - POST /gate/:contentItemId/acknowledge — override warning gate
 * - POST /schema/:contentItemId/generate  — generate/regenerate JSON-LD schema
 */

import type { FastifyInstance } from 'fastify';
import type { SupabaseClient } from '@supabase/supabase-js';
import { FLAGS } from '@pravado/feature-flags';

import { requireUser } from '../../middleware/requireUser';
import { getSupabaseClient } from '../../lib/supabase';
import { scoreAndPersist } from '../../services/citeMind/citeMindQualityScorer';
import {
  checkGate,
  acknowledgeGate,
  getLatestScore,
  listScoresForOrg,
} from '../../services/citeMind/citeMindPublishGateService';
import { generateSchema } from '../../services/citeMind/citeMindSchemaGenerator';
import { monitorCitations } from '../../services/citeMind/citationMonitor';
import { enforcePlanLimit, PlanLimitExceededError } from '../../services/billing/planLimitsService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return (data as { org_id: string } | null)?.org_id || null;
}

export async function citeMindRoutes(server: FastifyInstance) {
  const supabase = getSupabaseClient();

  // ========================================
  // POST /score/:contentItemId — Trigger scoring
  // ========================================

  server.post<{ Params: { contentItemId: string } }>(
    '/score/:contentItemId',
    { preHandler: requireUser, config: { rateLimit: { max: 20, timeWindow: '1 hour' } } },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.code(404).send({ success: false, error: { message: 'CiteMind is not enabled' } });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      try {
        // S-INT-09: Enforce CiteMind scoring plan limits
        await enforcePlanLimit(supabase, orgId, 'citemindScoresPerMonth');

        const result = await scoreAndPersist(supabase, request.params.contentItemId, orgId);

        // Emit SAGE signal if score < 55 (blocked)
        if (result.gate_status === 'blocked') {
          await emitCiteMindSignal(supabase, orgId, request.params.contentItemId, result);
        }

        return reply.send({ success: true, data: result });
      } catch (error) {
        if (error instanceof PlanLimitExceededError) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'PLAN_LIMIT_EXCEEDED',
              message: error.message,
              resource: error.resource,
              current: error.current,
              limit: error.limit,
            },
          });
        }
        const msg = error instanceof Error ? error.message : 'Scoring failed';
        return reply.code(500).send({ success: false, error: { message: msg } });
      }
    }
  );

  // ========================================
  // GET /score/:contentItemId — Get latest score
  // ========================================

  server.get<{ Params: { contentItemId: string } }>(
    '/score/:contentItemId',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.code(404).send({ success: false, error: { message: 'CiteMind is not enabled' } });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      const score = await getLatestScore(supabase, request.params.contentItemId, orgId);

      if (!score) {
        return reply.send({
          success: true,
          data: {
            score: null,
            gate_status: 'pending',
            message: 'No CiteMind score found. Trigger scoring first.',
          },
        });
      }

      return reply.send({ success: true, data: score });
    }
  );

  // ========================================
  // GET /scores — List scores for org
  // ========================================

  server.get<{
    Querystring: { gate_status?: string; limit?: string };
  }>(
    '/scores',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.code(404).send({ success: false, error: { message: 'CiteMind is not enabled' } });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      const scores = await listScoresForOrg(supabase, orgId, {
        gate_status: request.query.gate_status,
        limit: request.query.limit ? parseInt(request.query.limit, 10) : undefined,
      });

      return reply.send({ success: true, data: { items: scores } });
    }
  );

  // ========================================
  // POST /gate/:contentItemId/acknowledge — Override warning gate
  // ========================================

  server.post<{ Params: { contentItemId: string } }>(
    '/gate/:contentItemId/acknowledge',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.send({ success: true, data: { acknowledged: true, content_item_id: request.params.contentItemId } });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      const result = await acknowledgeGate(
        supabase,
        request.params.contentItemId,
        orgId,
        request.user.id
      );

      return reply.send({ success: true, data: result });
    }
  );

  // ========================================
  // POST /schema/:contentItemId/generate — Generate JSON-LD schema
  // ========================================

  server.post<{ Params: { contentItemId: string } }>(
    '/schema/:contentItemId/generate',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.code(404).send({ success: false, error: { message: 'CiteMind is not enabled' } });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      try {
        const result = await generateSchema(supabase, request.params.contentItemId, orgId);
        return reply.send({ success: true, data: result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Schema generation failed';
        return reply.code(500).send({ success: false, error: { message: msg } });
      }
    }
  );

  // ========================================
  // GET /gate/:contentItemId — Check gate status
  // ========================================

  server.get<{ Params: { contentItemId: string } }>(
    '/gate/:contentItemId',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.send({
          success: true,
          data: { allowed: true, score: null, gate_status: 'passed', recommendations: [] },
        });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      const result = await checkGate(supabase, request.params.contentItemId, orgId);
      return reply.send({ success: true, data: result });
    }
  );

  // ========================================
  // GET /monitor/summary — Citation summary for org
  // ========================================

  server.get(
    '/monitor/summary',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.send({ success: true, data: null });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      const { data: summary } = await supabase
        .from('citation_summaries')
        .select('*')
        .eq('org_id', orgId)
        .eq('period_days', 30)
        .single();

      return reply.send({ success: true, data: summary });
    }
  );

  // ========================================
  // GET /monitor/results — Paginated citation results
  // ========================================

  server.get<{
    Querystring: { engine?: string; days?: string; mentioned_only?: string; limit?: string; offset?: string };
  }>(
    '/monitor/results',
    { preHandler: requireUser },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.send({ success: true, data: { items: [] } });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      let query = supabase
        .from('citation_monitor_results')
        .select('*')
        .eq('org_id', orgId)
        .order('monitored_at', { ascending: false });

      if (request.query.engine) {
        query = query.eq('engine', request.query.engine);
      }

      if (request.query.days) {
        const days = parseInt(request.query.days, 10);
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('monitored_at', cutoff);
      }

      if (request.query.mentioned_only === 'true') {
        query = query.eq('brand_mentioned', true);
      }

      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
      const offset = request.query.offset ? parseInt(request.query.offset, 10) : 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        return reply.code(500).send({ success: false, error: { message: error.message } });
      }

      return reply.send({ success: true, data: { items: data ?? [] } });
    }
  );

  // ========================================
  // POST /monitor/run — Trigger immediate monitor cycle
  // ========================================

  server.post(
    '/monitor/run',
    { preHandler: requireUser, config: { rateLimit: { max: 3, timeWindow: '1 hour' } } },
    async (request, reply) => {
      if (!FLAGS.ENABLE_CITEMIND) {
        return reply.code(404).send({ success: false, error: { message: 'CiteMind is not enabled' } });
      }

      if (!request.user) {
        return reply.code(401).send({ success: false, error: { message: 'Authentication required' } });
      }

      const orgId = await getUserOrgId(request.user.id, supabase);
      if (!orgId) {
        return reply.code(403).send({ success: false, error: { message: 'No organization found' } });
      }

      try {
        const result = await monitorCitations(supabase, orgId);
        return reply.send({ success: true, data: result });
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Monitor run failed';
        return reply.code(500).send({ success: false, error: { message: msg } });
      }
    }
  );
}

// ============================================================================
// SAGE Signal Integration
// ============================================================================

/**
 * When content scores < 55 (blocked), emit a SAGE signal.
 */
async function emitCiteMindSignal(
  supabase: SupabaseClient,
  orgId: string,
  contentItemId: string,
  scoreResult: { overall_score: number; recommendations: string[]; gate_status: string }
): Promise<void> {
  // Find lowest-scoring factor from recommendations
  const lowestFactor = scoreResult.recommendations[0] || 'Overall score below threshold';

  try {
    // Use type assertion since supabase client doesn't have sage_signals typed
    await (supabase.from('sage_signals') as unknown as { insert: (data: Record<string, unknown>) => Promise<unknown> }).insert({
      org_id: orgId,
      signal_type: 'content_low_citemind',
      pillar: 'Content',
      source_table: 'citemind_scores',
      source_id: contentItemId,
      signal_data: {
        content_item_id: contentItemId,
        score: scoreResult.overall_score,
        gate_status: scoreResult.gate_status,
        top_recommendation: lowestFactor,
      },
      evi_impact_estimate: Math.max(1, (55 - scoreResult.overall_score) / 10),
      confidence: 0.9,
      priority: scoreResult.overall_score < 30 ? 'high' : 'medium',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    });
  } catch {
    // Non-critical — signal emission failure should not block scoring
  }
}
