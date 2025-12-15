/**
 * Outreach Run Stop API Route Handler
 * Sprint S100.1: Route handler for stopping a run
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await prBackendFetch(`/api/v1/pr-outreach/runs/${id}/stop`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/runs/[id]/stop] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
