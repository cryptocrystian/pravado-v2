/**
 * PR Outreach Reviews — pending queue proxy.
 * Gate: the client calls /api/pr/reviews, never the backend directly.
 *
 * Forwards to the real, role-gated backend endpoint:
 *   GET /api/v1/pr/reviews → pending review queue (org-scoped; any org member may read)
 *
 * HONEST DATA: this is the human-in-the-loop gate before any real send. Upstream
 * status codes are preserved (a 403 for a user with no org, etc.) and there is NO
 * fake-success fallback — if the backend fails we surface its real status/message.
 * An empty queue is the expected honest state until outreach egress is provisioned.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ReviewsResponse {
  items?: unknown[];
}

export async function GET() {
  try {
    // backendFetch unwraps the backend's { success, data } envelope → { items }.
    const data = await backendFetch<ReviewsResponse>('/api/v1/pr/reviews');
    return NextResponse.json({
      success: true,
      data: { items: data?.items ?? [] },
    });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/reviews] GET Error:', {
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
