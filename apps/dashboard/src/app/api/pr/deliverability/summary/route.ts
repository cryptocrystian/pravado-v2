/**
 * Deliverability Summary API Route Handler
 * Sprint S100.1: Route handler is the ONLY way to get deliverability stats
 */

import { NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
