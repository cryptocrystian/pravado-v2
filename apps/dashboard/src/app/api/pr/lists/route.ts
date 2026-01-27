/**
 * PR Lists API Route Handler
 * Sprint S100.1: Direct Supabase queries with runtime flag support
 */

import { NextRequest, NextResponse } from 'next/server';

import { getPRConfig } from '@/lib/env/pr-config';
import { authenticatePRRequest, createAuthErrorResponse, addPRAuthHeader } from '@/server/pr/prAuth';
import { createPRService } from '@/server/pr/prService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const config = getPRConfig();

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/lists] Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const result = await prService.listMediaLists();

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/lists] GET: ${result.lists.length} lists`);
    }

    const response = NextResponse.json({
      items: result.lists,
      total: result.total,
    });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/lists] GET Error:', message);

    if (!config.allowMockFallback) {
      const response = NextResponse.json(
        { error: message, code: 'DB_ERROR' },
        { status: 500 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    const response = NextResponse.json({
      items: [],
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

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/lists] POST Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const body = await request.json();

    // Insert directly into media_lists table
    const { data, error } = await auth.client
      .from('media_lists')
      .insert({
        org_id: auth.orgId,
        name: body.name,
        description: body.description,
        input_topic: body.inputTopic || body.input_topic || '',
        input_keywords: body.inputKeywords || body.input_keywords || [],
        input_market: body.inputMarket || body.input_market,
        input_geography: body.inputGeography || body.input_geography,
        input_product: body.inputProduct || body.input_product,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create list: ${error.message}`);
    }

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/lists] POST: Created list ${data.id}`);
    }

    const response = NextResponse.json(data, { status: 201 });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/lists] POST Error:', message);
    const response = NextResponse.json(
      { error: message, code: 'CREATE_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}
