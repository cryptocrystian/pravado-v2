/**
 * Strategy Panel API Route (Sprint S-INT-03)
 * Proxies to backend: GET /api/v1/sage/strategy-panel
 * Falls back to contract examples if backend unavailable.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await backendFetch('/api/v1/sage/strategy-panel');
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/command-center/strategy-panel] Proxy error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
