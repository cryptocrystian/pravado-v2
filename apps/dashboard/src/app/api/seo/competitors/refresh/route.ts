/**
 * SEO Competitors Refresh API Route Handler
 * Gate 1A: Network invariant — client calls /api/seo/competitors/refresh, not the
 * backend directly.
 *
 * DELIBERATE, COSTED action: forwards to /api/v1/seo/competitors/refresh, which
 * fetches live SERPs per tracked keyword via the DataForSEO SERP provider and caches
 * the resulting positions. Each processed keyword spends one DataForSEO SERP call
 * (~$0.002). With NO DataForSEO credentials the backend selects the Null provider and
 * this is an honest no-op (nothing fetched, nothing written) — never a fake success.
 *
 * Upstream status codes are preserved. This must NEVER be called on a read path.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

interface RefreshBody {
  maxKeywords?: number;
  locationCode?: number;
  languageCode?: string;
  depth?: number;
}

interface RefreshResult {
  keywordsProcessed?: number;
  positionsStored?: number;
  competitorsUpserted?: number;
  snapshotsCreated?: number;
}

export async function POST(request: NextRequest) {
  try {
    // Forward only the cost-control params the backend understands. A missing/empty
    // body is valid — the backend applies its own defaults.
    const body = (await request.json().catch(() => ({}))) as RefreshBody;
    const payload: RefreshBody = {};
    if (typeof body.maxKeywords === 'number')
      payload.maxKeywords = body.maxKeywords;
    if (typeof body.locationCode === 'number')
      payload.locationCode = body.locationCode;
    if (typeof body.languageCode === 'string')
      payload.languageCode = body.languageCode;
    if (typeof body.depth === 'number') payload.depth = body.depth;

    const data = await backendFetch<RefreshResult>(
      '/api/v1/seo/competitors/refresh',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/seo/competitors/refresh] POST Error:', {
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
