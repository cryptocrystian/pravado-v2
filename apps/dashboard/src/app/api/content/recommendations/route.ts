/**
 * Content Recommendations API Route Handler
 *
 * HONEST DATA: forwards to the real SAGE action-stream endpoint, filtered to the
 * Content pillar server-side.
 *  - /api/v1/sage/action-stream?pillar=content → active + recently-executed SAGE
 *    proposals whose `pillar = 'Content'` (normalized backend-side), already mapped
 *    to the ActionItem shape.
 *
 * The Content pillar filter is applied by the backend (`sage_proposals.pillar =
 * 'Content'`), NOT reconstructed here, so this surface only ever shows genuine
 * Content-pillar SAGE proposals. This is pure SAGE intelligence — it does NOT route
 * through the content publish handler, any brief-execution, or any send/publish path.
 *
 * READ-ONLY: this route only reads SAGE proposals. It never triggers an execution,
 * approval, brief creation, or publish. Upstream status codes are preserved (incl.
 * 403 NO_ORG for a user without an org). There is NO fake-success fallback: a backend
 * failure surfaces the real error status rather than being swallowed into fabricated
 * recommendations.
 *
 * Mirrors /api/seo/recommendations and /api/pr/action-queue exactly, with
 * `pillar=content`.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pillar is pinned to Content — this surface is Content-only by definition.
    const params = new URLSearchParams({ pillar: 'content' });

    // Optional priority passthrough (critical|high|medium|low) if a caller narrows.
    const priority = searchParams.get('priority');
    if (priority) params.set('priority', priority);

    const path = `/api/v1/sage/action-stream?${params.toString()}`;

    const data = await backendFetch(path);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/content/recommendations] GET Error:', {
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
