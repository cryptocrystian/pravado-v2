/**
 * Deliverability Summary API Route Handler
 * Sprint S100: Route handler is the ONLY way to get deliverability stats
 */

import { NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export async function GET() {
  try {
    const data = await prBackendFetch('/api/v1/pr-outreach-deliverability/stats/deliverability');
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/deliverability/summary] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
