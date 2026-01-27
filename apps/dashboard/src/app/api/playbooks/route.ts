/**
 * Playbooks API Route Handler
 * Gate 1A: Network invariant - client calls /api/playbooks
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    const queryString = params.toString();
    const path = `/api/v1/playbooks${queryString ? `?${queryString}` : ''}`;

    const data = await backendFetch(path);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/playbooks] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await backendFetch('/api/v1/playbooks', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/playbooks] POST Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
