/**
 * Deliverability Summary API Route (Sprint S99.2)
 */

import { NextResponse } from 'next/server';
import { fetchDeliverabilitySummary } from '@/server/prDataServer';

export async function GET() {
  try {
    const data = await fetchDeliverabilitySummary();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    if (message.includes('AUTH_MISSING') || message.includes('AUTH_SESSION_ERROR')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    console.error('[API Route /api/pr/deliverability/summary] Error:', message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
