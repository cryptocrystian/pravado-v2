/**
 * SEO Competitors API Route Handler
 * Gate 1A: Network invariant — client calls /api/seo/competitors, not the backend
 * directly.
 *
 * HONEST DATA: forwards to the real DataForSEO-backed competitor analysis endpoint.
 *  - /api/v1/seo/competitors → Share-of-Voice + per-keyword competitor positions,
 *    computed from CACHED SERP data (read-only, free — no provider call).
 *
 * A brand-new org (or one without DataForSEO credentials + a completed refresh) has
 * no cached SERP rows yet; that resolves to `{ shareOfVoice: [], competitorPositions:
 * [] }`, which is an honest empty state, not an error. Upstream status codes are
 * preserved and never swallowed into a fake success.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

interface CompetitorAnalysis {
  shareOfVoice?: unknown[];
  competitorPositions?: unknown[];
}

export async function GET(_request: NextRequest) {
  try {
    const data = await backendFetch<CompetitorAnalysis>(
      '/api/v1/seo/competitors'
    );

    return NextResponse.json({
      success: true,
      data: {
        shareOfVoice: data?.shareOfVoice ?? [],
        competitorPositions: data?.competitorPositions ?? [],
      },
    });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/seo/competitors] GET Error:', {
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
