/**
 * SEO SERP API Route Handler
 * Gate 1A: Network invariant - client calls /api/seo/serp, not backend directly
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const keywordId = searchParams.get('keywordId');

    if (!keywordId) {
      return NextResponse.json(
        { success: false, error: { message: 'keywordId is required' } },
        { status: 400 }
      );
    }

    const data = await backendFetch(`/api/v1/seo/serp?keywordId=${keywordId}`);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/seo/serp] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
