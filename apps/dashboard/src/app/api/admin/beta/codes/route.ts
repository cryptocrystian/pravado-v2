/**
 * Admin Beta Codes API Route
 * Proxies to backend: GET /api/v1/admin/beta/codes
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await backendFetch('/api/v1/admin/beta/codes');
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ error: { message, code } }, { status });
  }
}
