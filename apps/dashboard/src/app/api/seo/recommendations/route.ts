/**
 * SEO Recommendations API Route Handler
 * Gate 1A: Network invariant — client calls /api/seo/recommendations, not backend directly.
 *
 * HONEST DATA: forwards to the real SAGE action-stream endpoint, filtered to the
 * SEO pillar server-side.
 *  - /api/v1/sage/action-stream?pillar=seo → active + recently-executed SAGE
 *    proposals whose `pillar = 'SEO'`, already mapped to ActionItem shape.
 *
 * The SEO pillar filter is applied by the backend (`sage_proposals.pillar = 'SEO'`),
 * NOT reconstructed here, so this surface only ever shows genuine SEO-pillar SAGE
 * proposals. No DataForSEO / seo_serp_results dependency — this is pure SAGE
 * intelligence, honest for orgs without a SERP provider.
 *
 * Upstream status codes are preserved (incl. 403 NO_ORG for a user without an org).
 * There is NO fake-success fallback: a backend failure surfaces the real error status
 * rather than being swallowed into fabricated recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Pillar is pinned to SEO — this surface is SEO-only by definition.
    const params = new URLSearchParams({ pillar: 'seo' });

    // Optional priority passthrough (critical|high|medium|low) if a caller narrows.
    const priority = searchParams.get('priority');
    if (priority) params.set('priority', priority);

    const path = `/api/v1/sage/action-stream?${params.toString()}`;

    const data = await backendFetch(path);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/seo/recommendations] GET Error:', {
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
