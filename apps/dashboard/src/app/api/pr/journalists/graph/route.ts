/**
 * Journalist Graph API Route Handler
 * Sprint S100.1: Route handler for building journalist graph
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await prBackendFetch('/api/v1/journalist-graph/graph', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/journalists/graph] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
