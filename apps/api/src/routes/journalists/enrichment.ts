/**
 * Journalist Enrichment Routes (Sprint S-INT-06)
 *
 * Hunter.io enrichment + journalist discovery endpoints.
 * Prefix: /api/v1/journalists
 */

import { FLAGS } from '@pravado/feature-flags';
import type { FastifyInstance } from 'fastify';

import { getSupabaseClient } from '../../lib/supabase';

export async function journalistEnrichmentRoutes(server: FastifyInstance) {
  const supabase = getSupabaseClient();

  // Helper to get user's org ID
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .single();
    return data?.org_id ?? null;
  }

  // ========================================================================
  // POST /enrich/:journalistId — Enrich a single journalist
  // ========================================================================
  server.post<{ Params: { journalistId: string } }>(
    '/enrich/:journalistId',
    async (request, reply) => {
      if (!FLAGS.ENABLE_JOURNALIST_ENRICHMENT) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'Journalist enrichment not enabled' },
        });
      }

      if (!(request as any).user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId((request as any).user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      const { journalistId } = request.params;

      const { enrichJournalist } = await import(
        '../../services/journalists/hunterEnrichmentService'
      );
      const result = await enrichJournalist(supabase, journalistId, orgId);

      if (!result) {
        return reply.send({
          success: true,
          data: { enriched: false, reason: 'Skipped — recently enriched, name unparseable, or API unavailable' },
        });
      }

      return reply.send({
        success: true,
        data: {
          enriched: true,
          email: result.email,
          email_confidence: result.email_confidence,
          enrichment_source: result.enrichment_source,
        },
      });
    }
  );

  // ========================================================================
  // POST /enrich-batch — Enrich all unenriched journalists for org
  // ========================================================================
  server.post('/enrich-batch', async (request, reply) => {
    if (!FLAGS.ENABLE_JOURNALIST_ENRICHMENT) {
      return reply.code(404).send({
        success: false,
        error: { code: 'FEATURE_DISABLED', message: 'Journalist enrichment not enabled' },
      });
    }

    if (!(request as any).user) {
      return reply.code(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
    }

    const orgId = await getUserOrgId((request as any).user.id);
    if (!orgId) {
      return reply.code(403).send({
        success: false,
        error: { code: 'NO_ORG', message: 'No organization found' },
      });
    }

    // Try to enqueue via BullMQ, fallback to direct execution
    try {
      const { enqueueJournalistEnrichBatch } = await import('../../queue/bullmqQueue');
      await enqueueJournalistEnrichBatch(orgId);
      return reply.send({ success: true, data: { queued: true } });
    } catch {
      const { enrichBatch } = await import('../../services/journalists/hunterEnrichmentService');
      const result = await enrichBatch(supabase, orgId);
      return reply.send({ success: true, data: result });
    }
  });

  // ========================================================================
  // GET /discover — Discover new journalists by topic
  // ========================================================================
  server.get<{ Querystring: { topics?: string } }>(
    '/discover',
    async (request, reply) => {
      if (!FLAGS.ENABLE_JOURNALIST_ENRICHMENT) {
        return reply.code(404).send({
          success: false,
          error: { code: 'FEATURE_DISABLED', message: 'Journalist enrichment not enabled' },
        });
      }

      if (!(request as any).user) {
        return reply.code(401).send({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        });
      }

      const orgId = await getUserOrgId((request as any).user.id);
      if (!orgId) {
        return reply.code(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'No organization found' },
        });
      }

      const topicsParam = request.query.topics;
      if (!topicsParam) {
        return reply.code(400).send({
          success: false,
          error: { code: 'MISSING_TOPICS', message: 'Query parameter "topics" is required (comma-separated)' },
        });
      }

      const topics = topicsParam.split(',').map((t) => t.trim()).filter(Boolean);

      const { discoverByTopics } = await import(
        '../../services/journalists/journalistDiscoveryService'
      );
      const result = await discoverByTopics(supabase, orgId, topics);

      return reply.send({
        success: true,
        data: {
          discovered: result.discovered,
          saved: result.saved,
          already_exists: result.already_exists,
        },
      });
    }
  );
}
