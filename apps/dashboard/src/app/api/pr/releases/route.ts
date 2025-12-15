/**
 * Press Releases API Route Handler (Sprint S99.2)
 * Proxies authenticated requests to backend via prDataServer
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPressReleases, authedApiFetch } from '@/server/prDataServer';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = {
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      offset: searchParams.get('offset') ? Number(searchParams.get('offset')) : undefined,
    };

    const data = await fetchPressReleases(params);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('[API Route /api/pr/releases] Error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Forward to backend generate endpoint
    const data = await authedApiFetch('/api/v1/pr/releases/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('[API Route /api/pr/releases POST] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
