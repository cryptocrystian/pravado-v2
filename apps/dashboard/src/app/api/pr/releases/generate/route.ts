/**
 * Press Release Generate API Route Handler
 * Sprint S100: Route handler is the ONLY way to generate press releases
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = await prBackendFetch('/api/v1/pr/releases/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/releases/generate] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
