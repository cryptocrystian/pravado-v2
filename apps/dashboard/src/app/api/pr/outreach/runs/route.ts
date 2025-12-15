/**
 * Outreach Runs API Route Handler
 * Sprint S100.1: Route handler for listing outreach runs
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
    const sequenceId = searchParams.get('sequenceId');
    const journalistId = searchParams.get('journalistId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (sequenceId) params.set('sequenceId', sequenceId);
    if (journalistId) params.set('journalistId', journalistId);
    if (status) params.set('status', status);
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const queryString = params.toString();
    const path = `/api/v1/pr-outreach/runs${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/outreach/runs] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
