/**
 * Playbook Run Stream URL API Route Handler
 * Gate 1A: Returns stream URL with auth token for EventSource connection
 *
 * Note: EventSource cannot set custom headers, so we need to pass the token
 * as a query parameter. This route handler securely retrieves the token
 * and provides the full stream URL to the client.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getStreamUrl, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  try {
    const streamUrl = await getStreamUrl(`/api/v1/playbook-runs/${runId}/stream`);
    return NextResponse.json({ success: true, data: { streamUrl } });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/playbook-runs/[runId]/stream] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
