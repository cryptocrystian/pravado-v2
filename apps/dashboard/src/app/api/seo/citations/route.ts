/**
 * SEO Citations API Route Handler
 * Gate 1A: Network invariant — client calls /api/seo/citations, not backend directly.
 *
 * HONEST DATA: forwards to the real CiteMind citation monitor endpoints.
 *  - /api/v1/citemind/monitor/results  → individual LLM polling results (real rows)
 *  - /api/v1/citemind/monitor/summary  → aggregated 30-day totals (may be null for a
 *                                        brand-new org — that is an honest empty, not an error)
 *
 * Upstream status codes are preserved. The `results` call is authoritative: if it
 * fails, we surface the real error status rather than swallowing it into a fake
 * success. The `summary` call is best-effort (a missing summary row is expected for
 * new orgs) and never fabricates data.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

interface CitationResultsResponse {
  items?: unknown[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    // Forward only the params the backend understands.
    for (const key of ['engine', 'days', 'mentioned_only', 'limit', 'offset']) {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    }
    if (!params.has('days')) params.set('days', '30');

    const queryString = params.toString();
    const resultsPath = `/api/v1/citemind/monitor/results${
      queryString ? `?${queryString}` : ''
    }`;

    // Authoritative call — a failure here surfaces as a real error status.
    const results = await backendFetch<CitationResultsResponse>(resultsPath);

    // Best-effort aggregate. A missing summary (new org) resolves to null and is
    // rendered as an honest empty header, never fabricated.
    const summary = await backendFetch<unknown>(
      '/api/v1/citemind/monitor/summary'
    ).catch(() => null);

    return NextResponse.json({
      success: true,
      data: {
        items: results?.items ?? [],
        summary,
      },
    });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/seo/citations] GET Error:', {
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
