/**
 * Outreach Sequences API Route Handler
 * Sprint S100.1: Route handler for outreach sequences
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    // Forward query params
    const status = searchParams.get('status');
    const isActive = searchParams.get('isActive');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (status) params.set('status', status);
    if (isActive) params.set('isActive', isActive);
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const queryString = params.toString();
    const path = `/api/v1/pr-outreach/sequences${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/sequences] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await prBackendFetch('/api/v1/pr-outreach/sequences', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/sequences] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
