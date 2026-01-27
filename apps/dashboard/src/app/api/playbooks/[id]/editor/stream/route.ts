/**
 * Playbook Editor Stream URL API Route Handler
 * Gate 1A: Returns stream URL with auth token for EventSource connection
 */

import { NextRequest, NextResponse } from 'next/server';

import { getStreamUrl, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const streamUrl = await getStreamUrl(`/api/v1/playbooks/${id}/editor/stream`);
    return NextResponse.json({ success: true, data: { streamUrl } });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/playbooks/[id]/editor/stream] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
