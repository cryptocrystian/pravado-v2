/**
 * Media Monitoring Stats API Route (Wave-2 Analytics)
 * Proxies to backend: GET /api/v1/media-monitoring/stats
 *
 * Real earned-media statistics (earned_mentions counts) used by the Analytics
 * Overview "Earned Placements" headline metric and the PR analytics tab.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await backendFetch('/api/v1/media-monitoring/stats');
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/media-monitoring/stats] GET Error:', {
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
