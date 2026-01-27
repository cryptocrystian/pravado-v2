/**
 * Content Items API Route Handler
 * Gate 1A: Network invariant - client calls /api/content/items, not backend directly
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    // Forward all query params
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    const queryString = params.toString();
    const path = `/api/v1/content/items${queryString ? `?${queryString}` : ''}`;

    const data = await backendFetch(path);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/content/items] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
