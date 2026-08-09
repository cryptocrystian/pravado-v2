/**
 * PR Action Queue API Route Handler
 *
 * HONEST DATA: forwards to the real SAGE action-stream endpoint, filtered to the
 * PR pillar server-side.
 *  - /api/v1/sage/action-stream?pillar=pr → active + recently-executed SAGE
 *    proposals whose `pillar = 'PR'` (normalized backend-side), already mapped to
 *    the ActionItem shape.
 *
 * The PR pillar filter is applied by the backend (`sage_proposals.pillar = 'PR'`),
 * NOT reconstructed here, so this surface only ever shows genuine PR-pillar SAGE
 * proposals. This is pure SAGE intelligence — it does NOT touch the journalists
 * surface, any journalist contact/email, or any outreach/send path.
 *
 * READ-ONLY: this route only reads SAGE proposals. It never triggers an execution,
 * approval, or send. Upstream status codes are preserved (incl. 403 NO_ORG for a
 * user without an org). There is NO fake-success fallback: a backend failure
 * surfaces the real error status rather than being swallowed into fabricated items.
 *
 * Mirrors /api/seo/recommendations exactly, with `pillar=pr`.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pillar is pinned to PR — this surface is PR-only by definition.
    const params = new URLSearchParams({ pillar: 'pr' });

    // Optional priority passthrough (critical|high|medium|low) if a caller narrows.
    const priority = searchParams.get('priority');
    if (priority) params.set('priority', priority);

    const path = `/api/v1/sage/action-stream?${params.toString()}`;

    const data = await backendFetch(path);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/action-queue] GET Error:', {
      status,
      message,
      code,
    });
    return NextResponse.json(
      { success: false, error: { message, code } },
      { status }
    );
  }
}
