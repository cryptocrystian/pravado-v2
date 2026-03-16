/**
 * Action Stream API Route (Sprint S-INT-03)
 * Proxies to backend: GET /api/v1/sage/action-stream
 * Falls back to contract examples if backend unavailable.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pillar = searchParams.get('pillar');
  const priority = searchParams.get('priority');

  const params = new URLSearchParams();
  if (pillar) params.set('pillar', pillar);
  if (priority) params.set('priority', priority);
  const qs = params.toString();
  const path = `/api/v1/sage/action-stream${qs ? `?${qs}` : ''}`;

  try {
    const data = await backendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/command-center/action-stream] Proxy error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
