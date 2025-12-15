/**
 * Outreach Stats API Route Handler
 * Sprint S100.1: Route handler is the ONLY way to get outreach stats
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sequenceId = searchParams.get('sequenceId');

    const params = new URLSearchParams();
    if (sequenceId) params.set('sequenceId', sequenceId);

    const queryString = params.toString();
    const path = `/api/v1/pr-outreach/stats${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/stats] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
