/**
 * Intelligence Canvas API Route (Sprint S-INT-03)
 * Proxies to backend: GET /api/v1/sage/intelligence-canvas
 * Falls back to contract examples if backend unavailable.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const params = new URLSearchParams();
  const nodeKind = searchParams.get('node_kind');
  if (nodeKind) params.set('node_kind', nodeKind);
  const qs = params.toString();
  const path = `/api/v1/sage/intelligence-canvas${qs ? `?${qs}` : ''}`;

  try {
    const data = await backendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/command-center/intelligence-canvas] Proxy error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
