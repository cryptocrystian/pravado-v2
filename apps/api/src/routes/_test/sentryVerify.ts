/**
 * Phase 0.5 close-out item 1 — Sentry verification route (TEMPORARY).
 *
 * Throws a deliberately-tagged 5xx so we can confirm the api-side Sentry
 * wiring is capturing events with org_id + route tags after the new
 * `SENTRY_DSN` env value lands on Render.
 *
 * Lifecycle:
 *   1. Ship through CI green.
 *   2. Architect (or anyone authenticated as a @saipienlabs.com user)
 *      hits `GET /api/v1/_test/sentry-verify` on staging.
 *   3. Confirm event arrives in the `pravado-api` Sentry project with
 *      tags { org_id, route } and PII-scrubbed payload.
 *   4. **DELETE this file** in a follow-up PR (see Step E of the
 *      close-out plan).
 *
 * Gating: protected by `requireUser` (existing middleware — 401 if no
 * session) + an email-suffix check (404 if the authenticated user is
 * not `@saipienlabs.com`, so the route is indistinguishable from a
 * non-existent path to a hostile probe).
 *
 * Spec: architect-directed; see Phase 0.5 close-out item 1 DECISIONS_LOG entry.
 */

import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';

const ALLOWED_EMAIL_SUFFIX = '@saipienlabs.com';

export async function sentryVerifyRoutes(server: FastifyInstance) {
  server.get(
    '/sentry-verify',
    { preHandler: requireUser },
    async (request, reply) => {
      const email = request.user?.email ?? '';
      if (!email.endsWith(ALLOWED_EMAIL_SUFFIX)) {
        // 404 instead of 401/403 so an unauthorized caller can't even
        // confirm this route exists.
        return reply.code(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Not found' },
        });
      }
      // Deliberate 5xx — the global error handler at server.ts:489-515
      // calls Sentry.captureException with org_id + route tags.
      throw new Error(
        `Phase 0.5 Sentry verification — deliberate 5xx — ${new Date().toISOString()}`
      );
    }
  );
}
