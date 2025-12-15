/**
 * PR List by ID API Route Handler
 * Sprint S100.1: Route handler for single list operations
 */

import { NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await prBackendFetch(`/api/v1/pr/lists/${id}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/lists/[id]] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
