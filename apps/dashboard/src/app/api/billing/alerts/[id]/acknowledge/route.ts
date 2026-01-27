/**
 * Billing Alert Acknowledge API Route Handler
 * Gate 1A: Network invariant - client calls /api/billing/alerts/[id]/acknowledge
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await backendFetch(`/api/v1/billing/alerts/${id}/acknowledge`, {
      method: 'POST',
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/billing/alerts/acknowledge] POST Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
