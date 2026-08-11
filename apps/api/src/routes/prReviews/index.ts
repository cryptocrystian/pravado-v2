/**
 * PR outreach review/approval routes (Wave-2 — the human-in-the-loop gate surface).
 *
 * Mounted under /api/v1/pr:
 *   GET  /api/v1/pr/reviews            → pending review queue (org-scoped; any member)
 *   POST /api/v1/pr/reviews/:id/approve → approve + run the approved-send (owner/admin)
 *   POST /api/v1/pr/reviews/:id/reject  → reject (owner/admin)
 *
 * Approve does NOT send directly — it re-invokes the pitch executor with the exact
 * approved text, which routes through the `sendGuardedEmail` chokepoint (all CAN-SPAM
 * governors run). Role-gating + org-scope live in the service; routes map the service's
 * discriminated results onto real HTTP status codes (no fake-success).
 */

import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import {
  approveReview,
  createSupabaseOutreachReviewStore,
  listPendingReviews,
  rejectReview,
  sendApprovedPitch,
  type PrPitchReviewRow,
} from '../../services/pr/outreachReviewService';

export default async function prReviewsRoutes(fastify: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );
  const store = createSupabaseOutreachReviewStore(supabase);

  /** Resolve the caller's org id (org-scope for the queue read). */
  async function getUserOrgId(userId: string): Promise<string | null> {
    const { data } = await supabase
      .from('org_members')
      .select('org_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    return data?.org_id ?? null;
  }

  // GET /api/v1/pr/reviews — pending queue (org-scoped)
  fastify.get(
    '/reviews',
    { onRequest: [requireUser] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const reviews = await listPendingReviews(store, orgId);
      return reply.send({ success: true, data: { items: reviews } });
    }
  );

  // POST /api/v1/pr/reviews/:id/approve — owner/admin only; then approved-send
  fastify.post<{ Params: { id: string } }>(
    '/reviews/:id/approve',
    { onRequest: [requireUser] },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const result = await approveReview({
        store,
        orgId,
        userId: user.id,
        reviewId: request.params.id,
        send: (review: PrPitchReviewRow) => sendApprovedPitch(supabase, review),
      });

      if (!result.ok) {
        const status = result.code === 'FORBIDDEN' ? 403 : 404;
        return reply.status(status).send({
          success: false,
          error: { code: result.code, message: result.message },
        });
      }

      return reply.send({
        success: true,
        data: {
          review: result.review,
          send: { result: result.send.result, detail: result.send.detail },
        },
      });
    }
  );

  // POST /api/v1/pr/reviews/:id/reject — owner/admin only
  fastify.post<{ Params: { id: string } }>(
    '/reviews/:id/reject',
    { onRequest: [requireUser] },
    async (request, reply) => {
      const user = request.user!;
      const orgId = await getUserOrgId(user.id);
      if (!orgId) {
        return reply.status(403).send({
          success: false,
          error: { code: 'NO_ORG', message: 'User has no organization' },
        });
      }

      const result = await rejectReview({
        store,
        orgId,
        userId: user.id,
        reviewId: request.params.id,
      });

      if (!result.ok) {
        const status = result.code === 'FORBIDDEN' ? 403 : 404;
        return reply.status(status).send({
          success: false,
          error: { code: result.code, message: result.message },
        });
      }

      return reply.send({ success: true, data: { review: result.review } });
    }
  );
}
