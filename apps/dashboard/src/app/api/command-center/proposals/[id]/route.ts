/**
 * Proposal Action API Route (PR-5b).
 * Proxies to backend: PATCH /api/v1/sage/proposals/:id  body { action: 'execute' | 'dismiss' }
 *
 * Uses backendFetchRaw (NOT backendFetch) so the backend's response shape
 * `{ success, proposal, previous_status }` is forwarded verbatim — backendFetch
 * unwraps `{ success, data }` and would drop these top-level fields.
 */

import { NextResponse } from 'next/server';

import { backendFetchRaw, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const res = await backendFetchRaw(
      `/api/v1/sage/proposals/${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/command-center/proposals/:id] Proxy error:', {
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
