/**
 * Top Engaged Journalists API Route Handler
 * Sprint S100.1: Route handler is the ONLY way to get top engaged journalists
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const path = `/api/v1/pr-outreach-deliverability/stats/top-engaged?limit=${limit}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/deliverability/top-engaged] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
