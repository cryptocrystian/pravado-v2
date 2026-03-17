/**
 * Admin Orgs API Route
 * Proxies to backend: GET /api/v1/admin/orgs
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await backendFetch(`/api/v1/admin/orgs?${searchParams.toString()}`);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ error: { message, code } }, { status });
  }
}
