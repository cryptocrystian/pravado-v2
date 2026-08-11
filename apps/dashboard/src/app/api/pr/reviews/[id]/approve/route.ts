/**
 * PR Outreach Reviews — approve proxy.
 *
 * Forwards to the real owner/admin-gated backend endpoint:
 *   POST /api/v1/pr/reviews/:id/approve
 *
 * Approve does NOT send directly — the backend re-invokes the pitch executor with the
 * EXACT approved subject/body, routing the send through the `sendGuardedEmail` chokepoint
 * (all CAN-SPAM governors run). This proxy is a thin pass-through.
 *
 * Upstream status codes are preserved verbatim — a non-owner/admin caller receives the
 * backend's real 403, a missing/already-actioned review receives 404. There is NO
 * fake-success: authorization is the backend's decision, never faked here.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // backendFetch unwraps { success, data } → { review, send } on success.
    const data = await backendFetch(
      `/api/v1/pr/reviews/${encodeURIComponent(id)}/approve`,
      { method: 'POST' }
    );
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/reviews/[id]/approve] POST Error:', {
      status,
      message,
      code,
    });
    return NextResponse.json(
      { success: false, error: { message, code } },
      { status }
    );
  }
}
