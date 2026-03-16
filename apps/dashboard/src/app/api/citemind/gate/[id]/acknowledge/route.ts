/**
 * CiteMind Gate Acknowledge API Route (Sprint S-INT-04)
 * POST — Override warning gate: proxies to POST /api/v1/citemind/gate/:id/acknowledge
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await backendFetch(`/api/v1/citemind/gate/${id}/acknowledge`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
