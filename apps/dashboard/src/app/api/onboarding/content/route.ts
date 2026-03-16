/**
 * Onboarding Content API Route (Sprint S-INT-07)
 * Proxies to backend: POST /api/v1/onboarding/content
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await backendFetch('/api/v1/onboarding/content', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
