/**
 * Journalist Discover Proxy Route (Sprint S-INT-06)
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const topics = searchParams.get('topics') || '';
    const data = await backendFetch(`/api/v1/journalists/discover?topics=${encodeURIComponent(topics)}`);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
