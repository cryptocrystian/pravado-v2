/**
 * CiteMind Score API Route (Sprint S-INT-04)
 * GET  — Get latest score: proxies to GET /api/v1/citemind/score/:id
 * POST — Trigger scoring: proxies to POST /api/v1/citemind/score/:id
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await backendFetch(`/api/v1/citemind/score/${id}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await backendFetch(`/api/v1/citemind/score/${id}`, { method: 'POST' });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
