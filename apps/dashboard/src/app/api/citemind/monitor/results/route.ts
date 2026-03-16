/**
 * CiteMind Monitor Results API Route (Sprint S-INT-05)
 * GET — Get citation results: proxies to GET /api/v1/citemind/monitor/results
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    if (searchParams.get('engine')) params.set('engine', searchParams.get('engine')!);
    if (searchParams.get('days')) params.set('days', searchParams.get('days')!);
    if (searchParams.get('mentioned_only')) params.set('mentioned_only', searchParams.get('mentioned_only')!);
    if (searchParams.get('limit')) params.set('limit', searchParams.get('limit')!);
    if (searchParams.get('offset')) params.set('offset', searchParams.get('offset')!);

    const qs = params.toString();
    const url = `/api/v1/citemind/monitor/results${qs ? `?${qs}` : ''}`;
    const data = await backendFetch(url);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
