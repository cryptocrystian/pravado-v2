/**
 * Share of Model API Route Handler
 * Gate 1A: Network invariant — client calls /api/seo/share-of-model, not the
 * backend directly.
 *
 * HONEST DATA: forwards to /api/v1/citemind/share-of-model, which computes
 * Brand / (Brand + Competitors) × 100 across the org's monitored AI-answer
 * citations (CiteMind Engine 3, SEO_AEO_PILLAR_CANON §4). An org whose citation
 * monitor has not run yet resolves to `{ available: false, shareOfModel: null }`
 * — an honest empty state, never a fabricated number. Upstream status codes are
 * preserved and never swallowed into a fake success.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

interface ShareOfModelResponse {
  available: boolean;
  shareOfModel: number | null;
  trendDelta: number | null;
  periodDays: number;
  brandCitations: number;
  competitorCitations: number;
  sampledQueries: number;
  topics: Array<{
    topic: string;
    shareOfModel: number;
    brandCitations: number;
    competitorCitations: number;
  }>;
}

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get('days');
  const qs = days ? `?days=${encodeURIComponent(days)}` : '';
  try {
    const data = await backendFetch<ShareOfModelResponse>(
      `/api/v1/citemind/share-of-model${qs}`
    );
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/seo/share-of-model] GET Error:', {
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
