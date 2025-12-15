/**
 * Journalist Activities API Route Handler
 * Sprint S100.1: Route handler for journalist activities
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    // Forward all query params
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    const queryString = params.toString();
    const path = `/api/v1/journalist-graph/activities${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/journalists/activities] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await prBackendFetch('/api/v1/journalist-graph/activities', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/journalists/activities] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
