/**
 * Press Release by ID API Route Handler
 * Sprint S100.1: Route handler is the ONLY way to get a single press release
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
    const data = await prBackendFetch(`/api/v1/pr/releases/${id}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/releases/[id]] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
