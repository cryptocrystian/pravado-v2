/**
 * Join Demo Org API Route Handler
 * Gate 1A: Network invariant - client calls /api/orgs/join-demo, not backend directly
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const data = await backendFetch('/api/v1/orgs/join-demo', {
      method: 'POST',
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/orgs/join-demo] POST Error:', { status, message, code });
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
