/**
 * Pitch Sequences API Route Handler
 * Sprint S100.1: Route handler for pitch sequences list and create
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
    const status = searchParams.getAll('status');
    status.forEach(s => params.append('status', s));

    const pressReleaseId = searchParams.get('pressReleaseId');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const isActive = searchParams.get('isActive');

    if (pressReleaseId) params.set('pressReleaseId', pressReleaseId);
    if (search) params.set('search', search);
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    if (isActive) params.set('isActive', isActive);

    const queryString = params.toString();
    const path = `/api/v1/pr/pitches/sequences${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/pitches/sequences] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await prBackendFetch('/api/v1/pr/pitches/sequences', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/pitches/sequences] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
