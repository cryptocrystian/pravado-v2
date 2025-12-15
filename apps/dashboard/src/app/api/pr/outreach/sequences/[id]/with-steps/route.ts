/**
 * Outreach Sequence with Steps API Route Handler
 * Sprint S100.1: Route handler for getting sequence with steps
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
    const data = await prBackendFetch(`/api/v1/pr-outreach/sequences/${id}/with-steps`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/sequences/[id]/with-steps] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
