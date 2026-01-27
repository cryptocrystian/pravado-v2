/**
 * Journalist Search API Route Handler
 * Sprint S100.1: Direct Supabase queries with runtime flag support
 *
 * NON-NEGOTIABLE: Uses direct DB queries in strict mode
 */

import { NextRequest, NextResponse } from 'next/server';

import { getPRConfig } from '@/lib/env/pr-config';
import { authenticatePRRequest, createAuthErrorResponse, addPRAuthHeader } from '@/server/pr/prAuth';
import { createPRService } from '@/server/pr/prService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const config = getPRConfig();

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/journalists] Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || undefined;
    const outlet = searchParams.get('outlet') || undefined;
    const beat = searchParams.get('beat') || undefined;
    const minEngagementScore = searchParams.get('minEngagementScore');
    const minRelevanceScore = searchParams.get('minRelevanceScore');
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const result = await prService.listJournalists({
      q,
      outlet,
      beat,
      minEngagementScore: minEngagementScore ? parseFloat(minEngagementScore) : undefined,
      minRelevanceScore: minRelevanceScore ? parseFloat(minRelevanceScore) : undefined,
      sortBy,
      sortOrder,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/journalists] GET: ${result.profiles.length}/${result.total} profiles`);
    }

    const response = NextResponse.json({
      profiles: result.profiles,
      total: result.total,
      limit: limit ? parseInt(limit, 10) : 20,
      offset: offset ? parseInt(offset, 10) : 0,
    });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/journalists] GET Error:', message);

    if (!config.allowMockFallback) {
      const response = NextResponse.json(
        { error: message, code: 'DB_ERROR' },
        { status: 500 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    // Demo mode fallback
    const response = NextResponse.json({
      profiles: [],
      total: 0,
      limit: 20,
      offset: 0,
      _mock: true,
      _error: message,
    });
    return addPRAuthHeader(response, 'ok');
  }
}

export async function POST(request: NextRequest) {
  const config = getPRConfig();

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/journalists] POST Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const body = await request.json();

    const journalist = await prService.createJournalist({
      fullName: body.fullName || body.full_name,
      primaryEmail: body.primaryEmail || body.primary_email,
      primaryOutlet: body.primaryOutlet || body.primary_outlet,
      beat: body.beat,
      twitterHandle: body.twitterHandle || body.twitter_handle,
      linkedinUrl: body.linkedinUrl || body.linkedin_url,
      metadata: body.metadata,
    });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/journalists] POST: Created journalist ${journalist.id}`);
    }

    const response = NextResponse.json(journalist, { status: 201 });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/journalists] POST Error:', message);
    const response = NextResponse.json(
      { error: message, code: 'CREATE_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}
