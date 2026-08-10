/**
 * Content Signals API Route Handler (W2 — Content Insights, D038)
 * Gate 1A: Network invariant — the client calls /api/content/signals, not the
 * backend directly. Preserves upstream status (no fake-success fallback).
 *
 * Read-only. The backend serves these signals from the persisted
 * content_authority_signals table; nothing here (or upstream) writes any table.
 */

import { NextResponse } from 'next/server';

import { backendFetch, getErrorResponse } from '@/server/backendProxy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await backendFetch('/api/v1/content/signals');
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/content/signals] GET Error:', {
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
