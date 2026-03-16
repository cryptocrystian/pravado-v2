/**
 * EVI History API Route (Sprint S-INT-01)
 * Proxies to backend: GET /api/v1/evi/history?days=N
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '90';
    const data = await backendFetch(`/api/v1/evi/history?days=${days}`);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/evi/history] GET Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
