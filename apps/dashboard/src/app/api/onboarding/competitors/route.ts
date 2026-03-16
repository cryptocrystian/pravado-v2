/**
 * Onboarding Competitors API Route (Sprint S-INT-07)
 * Proxies to backend: GET/POST /api/v1/onboarding/competitors
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await backendFetch('/api/v1/onboarding/competitors');
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await backendFetch('/api/v1/onboarding/competitors', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
