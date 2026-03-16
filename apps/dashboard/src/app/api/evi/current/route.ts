/**
 * EVI Current Score API Route (Sprint S-INT-01)
 * Proxies to backend: GET /api/v1/evi/current
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await backendFetch('/api/v1/evi/current');
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/evi/current] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
