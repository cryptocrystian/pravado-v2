/**
 * Admin Beta Approve API Route
 * Proxies to backend: POST /api/v1/admin/beta/approve
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await backendFetch('/api/v1/admin/beta/approve', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ error: { message, code } }, { status });
  }
}
