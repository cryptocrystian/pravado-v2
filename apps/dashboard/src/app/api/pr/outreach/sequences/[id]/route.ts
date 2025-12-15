/**
 * Outreach Sequence by ID API Route Handler
 * Sprint S100.1: Route handler for single sequence operations
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await prBackendFetch(`/api/v1/pr-outreach/sequences/${id}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/sequences/[id]] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await prBackendFetch(`/api/v1/pr-outreach/sequences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/sequences/[id]] PATCH Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prBackendFetch(`/api/v1/pr-outreach/sequences/${id}`, {
      method: 'DELETE',
    });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/sequences/[id]] DELETE Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
