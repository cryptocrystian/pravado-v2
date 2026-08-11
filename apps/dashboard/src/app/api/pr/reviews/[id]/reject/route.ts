/**
 * PR Outreach Reviews — reject proxy.
 *
 * Forwards to the real owner/admin-gated backend endpoint:
 *   POST /api/v1/pr/reviews/:id/reject
 *
 * Reject transitions a pending review to rejected. No send occurs. Upstream status
 * codes are preserved verbatim — a non-owner/admin caller receives the backend's real
 * 403, a missing/already-actioned review receives 404. No fake-success.
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
    const data = await backendFetch(
      `/api/v1/pr/reviews/${encodeURIComponent(id)}/reject`,
      { method: 'POST' }
    );
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/reviews/[id]/reject] POST Error:', {
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
