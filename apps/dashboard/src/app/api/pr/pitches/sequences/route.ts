/**
 * Pitch Sequences API Route Handler
 * Sprint S100: Route handler is the ONLY way to get pitch sequences
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const isActive = searchParams.get('isActive');

    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);
    if (isActive) params.set('isActive', isActive);

    const queryString = params.toString();
    const path = `/api/v1/pr-outreach/sequences${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/pitches/sequences] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
