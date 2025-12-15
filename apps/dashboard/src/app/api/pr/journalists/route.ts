/**
 * Journalist Search API Route Handler (Sprint S99.2)
 * Proxies authenticated requests to backend via prDataServer
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchJournalistProfiles } from '@/server/prDataServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      q: searchParams.get('q') || undefined,
      outlet: searchParams.get('outlet') || undefined,
      beat: searchParams.get('beat') || undefined,
      minEngagementScore: searchParams.get('minEngagementScore')
        ? Number(searchParams.get('minEngagementScore'))
        : undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const data = await fetchJournalistProfiles(params);

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Auth errors should return 401
    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // API errors
    if (message.includes('API_ERROR')) {
      return NextResponse.json(
        { error: message.replace('API_ERROR: ', '') },
        { status: 502 }
      );
    }

    // Unknown errors
    console.error('[API Route /api/pr/journalists] Error:', message);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
