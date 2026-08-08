/**
 * Media Monitoring Mentions API Route (Wave-2 Analytics)
 * Proxies to backend: GET /api/v1/media-monitoring/mentions
 *
 * Real earned brand mentions (with joined article), used by the PR analytics
 * tab coverage timeline. Query params are forwarded verbatim.
 */

import { NextRequest, NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = new URLSearchParams();
    searchParams.forEach((value, key) => {
      params.set(key, value);
    });

    const queryString = params.toString();
    const path = `/api/v1/media-monitoring/mentions${queryString ? `?${queryString}` : ''}`;

    const data = await backendFetch(path);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/media-monitoring/mentions] GET Error:', {
      status,
      message,
      code,
    });
    return NextResponse.json(
      { success: false, error: { message, code } },
      { status }
    );
  }
}
