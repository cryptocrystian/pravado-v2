/**
 * Press Release by ID API Route Handler (Sprint S99.2)
 */

import { NextResponse } from 'next/server';
import { fetchPressRelease } from '@/server/prDataServer';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await fetchPressRelease(id);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('[API Route /api/pr/releases/[id]] Error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
