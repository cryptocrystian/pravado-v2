/**
 * Sequence Contacts API Route Handler
 * Sprint S100.1: Route handler for sequence contact operations
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const queryParams = new URLSearchParams();

    // Forward query params
    const status = searchParams.getAll('status');
    status.forEach(s => queryParams.append('status', s));

    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');

    if (search) queryParams.set('search', search);
    if (limit) queryParams.set('limit', limit);
    if (offset) queryParams.set('offset', offset);
    if (sortBy) queryParams.set('sortBy', sortBy);
    if (sortOrder) queryParams.set('sortOrder', sortOrder);

    const queryString = queryParams.toString();
    const path = `/api/v1/pr/pitches/sequences/${id}/contacts${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/pitches/sequences/[id]/contacts] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await prBackendFetch(`/api/v1/pr/pitches/sequences/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/pitches/sequences/[id]/contacts] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
