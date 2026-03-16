/**
 * Beta Request API Route (Sprint S-INT-09)
 * Proxies to backend: POST /api/v1/beta/request
 * Public — no auth required.
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:3001';

    const res = await fetch(`${apiUrl}/api/v1/beta/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: 'Failed to reach API' } },
      { status: 502 }
    );
  }
}
