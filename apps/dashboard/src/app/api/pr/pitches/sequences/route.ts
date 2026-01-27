/**
 * Pitch Sequences API Route Handler
 * Sprint S100.1: Direct Supabase queries with runtime flag support
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
      console.log(`[API /api/pr/pitches/sequences] Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);

    const { searchParams } = new URL(request.url);
    const status = searchParams.getAll('status');
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');
    const sortBy = searchParams.get('sortBy') || undefined;
    const sortOrder = searchParams.get('sortOrder') as 'asc' | 'desc' | undefined;

    const result = await prService.listPitchSequences({
      status: status.length > 0 ? status : undefined,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      sortBy,
      sortOrder,
    });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences] GET: ${result.sequences.length}/${result.total} sequences`);
    }

    const response = NextResponse.json({
      sequences: result.sequences,
      total: result.total,
    });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/pitches/sequences] GET Error:', message);

    if (!config.allowMockFallback) {
      const response = NextResponse.json(
        { error: message, code: 'DB_ERROR' },
        { status: 500 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    const response = NextResponse.json({
      sequences: [],
      total: 0,
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

  if (auth.status !== 'ok' || !auth.client || !auth.orgId || !auth.userId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences] POST Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const body = await request.json();

    const sequence = await prService.createPitchSequence(auth.userId, {
      name: body.name,
      defaultSubject: body.defaultSubject || body.default_subject,
      defaultPreviewText: body.defaultPreviewText || body.default_preview_text,
      settings: body.settings,
    });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences] POST: Created sequence ${sequence.id}`);
    }

    const response = NextResponse.json(sequence, { status: 201 });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/pitches/sequences] POST Error:', message);
    const response = NextResponse.json(
      { error: message, code: 'CREATE_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}
