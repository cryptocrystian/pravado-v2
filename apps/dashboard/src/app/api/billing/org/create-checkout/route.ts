import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = await backendFetch('/api/v1/billing/org/create-checkout', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
