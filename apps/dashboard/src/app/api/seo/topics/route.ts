/**
 * SEO Topics API Route Handler
 * Gate 1A: Network invariant — client calls /api/seo/topics, not the backend
 * directly.
 *
 * HONEST DATA: forwards to /api/v1/seo/topics, which clusters the org's tracked
 * keywords by SERP-result overlap using ONLY the cached DataForSEO SERP data the
 * competitor refresh already stored (no new paid API calls). Every cluster field
 * (score, avg position, total volume, trend) is derived from real data, or null
 * when its real source is absent.
 *
 * A brand-new org (or one without cached SERP rows) resolves to `{ clusters: [] }`
 * — an honest empty state, not an error. Upstream status codes are preserved and
 * never swallowed into a fake success.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

interface TopicsResponse {
  clusters?: unknown[];
}

export async function GET(_request: NextRequest) {
  try {
    const data = await backendFetch<TopicsResponse>('/api/v1/seo/topics');

    return NextResponse.json({
      success: true,
      data: {
        clusters: data?.clusters ?? [],
      },
    });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/seo/topics] GET Error:', {
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
