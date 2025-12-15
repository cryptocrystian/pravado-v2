/**
 * Press Releases API Route Handler
 * Sprint S100: Route handler is the ONLY way to get/create press releases
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

interface PressRelease {
  id: string;
  headline: string;
  subHeadline: string | null;
  body: string;
  boilerplate: string | null;
  status: string;
  seoScore: number | null;
  readabilityScore: number | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface PressReleasesResponse {
  releases: PressRelease[];
  total: number;
  limit: number;
  offset: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const params = new URLSearchParams();
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const queryString = params.toString();
    const path = `/api/v1/pr/releases${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch<PressReleasesResponse>(path);

    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/releases GET] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const data = await prBackendFetch('/api/v1/pr/releases', {
      method: 'POST',
      body: JSON.stringify(body),
    });

    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/releases POST] Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
