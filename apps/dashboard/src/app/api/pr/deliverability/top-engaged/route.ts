/**
 * Top Engaged Journalists API Route (Sprint S99.2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchTopEngagedJournalists } from '@/server/prDataServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? Number(searchParams.get('limit')) : 10;

    const data = await fetchTopEngagedJournalists(limit);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('[API Route /api/pr/deliverability/top-engaged] Error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
