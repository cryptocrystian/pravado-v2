/**
 * Content Briefs API Route Handler
 * Gate 1A: Network invariant - client calls /api/content/briefs, not backend directly
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '20';

    const data = await backendFetch(`/api/v1/content/briefs?limit=${limit}`);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/content/briefs] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
