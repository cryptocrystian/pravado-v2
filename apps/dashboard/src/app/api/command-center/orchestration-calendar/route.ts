/**
 * Orchestration Calendar API Route (Sprint S-INT-03)
 * Proxies to backend: GET /api/v1/sage/orchestration-calendar
 * Falls back to contract examples if backend unavailable.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const params = new URLSearchParams();
  for (const key of ['view', 'start', 'end', 'pillar', 'status']) {
    const val = searchParams.get(key);
    if (val) params.set(key, val);
  }
  const qs = params.toString();
  const path = `/api/v1/sage/orchestration-calendar${qs ? `?${qs}` : ''}`;

  try {
    const data = await backendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/command-center/orchestration-calendar] Proxy error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
