/**
 * GSC Disconnect Proxy Route (Sprint S-INT-06)
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const data = await backendFetch('/api/v1/integrations/gsc/disconnect', { method: 'DELETE' });
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    return NextResponse.json({ success: false, error: { message, code } }, { status });
  }
}
