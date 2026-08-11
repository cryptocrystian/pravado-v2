/**
 * Analytics-SEO API Route Handler
 * Gate 1A: Network invariant — the client calls /api/analytics/seo, not the
 * backend directly.
 *
 * HONEST DATA: forwards to /api/v1/analytics/seo, which aggregates four panels
 * from REAL stored sources, each independently honest-empty (no new paid calls):
 *   1. Engine breakdown  → CiteMind citation_summaries.by_engine + citation_monitor_results
 *   2. Own-rank summary  → seo_keywords.current_position + seo_keyword_metrics (GSC/DataForSEO)
 *   3. Competitive movement → seo_snapshots.position over captured_at (empty until >= 2 snapshots)
 *   4. Topic performance → persisted seo_keyword_clusters (real score/position/volume/trend)
 *
 * A brand-new org resolves to all-empty panels — an honest empty state, not an
 * error. Upstream status codes are preserved and never swallowed into a fake
 * success.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days');
    const qs = days ? `?days=${encodeURIComponent(days)}` : '';

    const data = await backendFetch(`/api/v1/analytics/seo${qs}`);

    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/analytics/seo] GET Error:', {
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
