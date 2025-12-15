/**
 * Press Release Generate API Route Handler (Sprint S99.2)
 */

import { NextRequest, NextResponse } from 'next/server';
import { authedApiFetch } from '@/server/prDataServer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

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

    console.error('[API Route /api/pr/releases/generate] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
