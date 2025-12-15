/**
 * Pitch Contact Queue API Route Handler
 * Sprint S100.1: Route handler to queue a pitch for a contact
 */

import { NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await prBackendFetch(`/api/v1/pr/pitches/contacts/${id}/queue`, {
      method: 'POST',
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/pitches/contacts/[id]/queue] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
