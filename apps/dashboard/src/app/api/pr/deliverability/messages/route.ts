/**
 * Email Messages API Route Handler
 * Sprint S100.1: Route handler is the ONLY way to get email messages
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();

    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const queryString = params.toString();
    const path = `/api/v1/pr-outreach-deliverability/messages${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch(path);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/deliverability/messages] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
