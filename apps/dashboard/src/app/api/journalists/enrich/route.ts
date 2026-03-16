/**
 * Journalist Enrich Batch Proxy Route (Sprint S-INT-06)
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const data = await backendFetch('/api/v1/journalists/enrich-batch', { method: 'POST' });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
