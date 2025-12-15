/**
 * Find Duplicates API Route Handler
 * Sprint S100.1: Route handler for finding duplicate journalists
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(_request: NextRequest) {
  try {
    const data = await prBackendFetch('/api/v1/journalist-graph/find-duplicates', {
      method: 'POST',
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/journalists/find-duplicates] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
