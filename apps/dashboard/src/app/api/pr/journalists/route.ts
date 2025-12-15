/**
 * Journalist Search API Route Handler
 * Sprint S100.1: Route handler is the ONLY way to get journalist data
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface JournalistProfile {
  id: string;
  fullName: string;
  primaryEmail: string;
  secondaryEmails: string[];
  primaryOutlet: string | null;
  beat: string | null;
  twitterHandle: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  engagementScore: number;
  responsivenessScore: number;
  relevanceScore: number;
  lastActivityAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface JournalistProfilesResponse {
  profiles: JournalistProfile[];
  total: number;
  limit: number;
  offset: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query string for backend API
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    const outlet = searchParams.get('outlet');
    const beat = searchParams.get('beat');
    const minEngagementScore = searchParams.get('minEngagementScore');
    const minRelevanceScore = searchParams.get('minRelevanceScore');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    if (q) params.set('q', q);
    if (outlet) params.set('outlet', outlet);
    if (beat) params.set('beat', beat);
    if (minEngagementScore) params.set('minEngagementScore', minEngagementScore);
    if (minRelevanceScore) params.set('minRelevanceScore', minRelevanceScore);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);
    if (limit) params.set('limit', limit);
    if (offset) params.set('offset', offset);

    const queryString = params.toString();
    const path = `/api/v1/journalist-graph/profiles${queryString ? `?${queryString}` : ''}`;

    const data = await prBackendFetch<JournalistProfilesResponse>(path);

    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/journalists] GET Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = await prBackendFetch('/api/v1/journalist-graph/profiles', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/journalists] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
