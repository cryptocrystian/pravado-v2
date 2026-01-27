/**
 * Playbook Branch Switch API Route Handler
 * Gate 1A: Network invariant - client calls /api/playbooks/[id]/branches/[branchId]/switch
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; branchId: string }> }
) {
  const { id, branchId } = await params;

  try {
    const data = await backendFetch(`/api/v1/playbooks/${id}/branches/${branchId}/switch`, {
      method: 'POST',
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/playbooks/[id]/branches/[branchId]/switch] POST Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
