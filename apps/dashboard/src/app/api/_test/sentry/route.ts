/**
 * Sentry verification route — TEMPORARY (Phase 0.5 Plan 01).
 *
 * Purpose: a once-off probe to confirm the Sentry wiring catches errors
 * thrown from a server-side Route Handler and that the PII scrubber in
 * `sentry.scrub.ts` redacts the user's identifying data before the event
 * leaves the process. The route is gated to `@saipienlabs.com` emails so
 * an opportunistic external GET cannot trigger Sentry traffic.
 *
 * Lifecycle:
 *   1. Ship through CI green so source-map upload + init are exercised
 *      on the Vercel preview.
 *   2. Architect authenticates with a @saipienlabs.com session and hits
 *      GET /api/_test/sentry on the Vercel preview URL → confirms the
 *      event lands in Sentry with PII scrubbed (no email, no cookies).
 *   3. **Delete this file in a follow-up commit on the same branch
 *      BEFORE marking PR #26 ready-for-review.**
 *
 * The architect-mandated lifecycle prevents the test route from ever
 * being live on production — but the file must exist in git history at
 * least long enough for one verified CI run.
 *
 * Spec: docs/sprints/PHASE-0-5-OBSERVABILITY/01-sentry.md
 */

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/getCurrentUser';

// Force the Node.js runtime — the verification needs to exercise
// sentry.server.config.ts (Node-side), not the edge config.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_EMAIL_SUFFIX = '@saipienlabs.com';

export async function GET() {
  const session = await getCurrentUser();
  const email = session?.user.email ?? null;
  if (!email || !email.endsWith(ALLOWED_EMAIL_SUFFIX)) {
    // 404 instead of 401/403 so the route is indistinguishable from a
    // non-existent path to an unauthenticated probe.
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  // Throw a deliberately-tagged error so Sentry's PII scrubber has
  // recognizable input to redact: the message embeds the calling email
  // (which the scrubber should redact in event.extra via the recursive
  // email-walk path).
  throw new Error(
    `[sentry-test] verification throw for ${email} — should be redacted in Sentry`
  );
}
