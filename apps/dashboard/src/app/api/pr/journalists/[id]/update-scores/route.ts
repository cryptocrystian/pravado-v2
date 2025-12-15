/**
 * Update Journalist Scores API Route Handler
 * Sprint S100.1: Route handler for updating journalist scores
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await prBackendFetch(`/api/v1/journalist-graph/profiles/${id}/update-scores`, {
      method: 'POST',
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/journalists/[id]/update-scores] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
