/**
 * PR Touches API Route Handler
 * Sprint S100.1: Log relationship touches and update state
 *
 * A "touch" is any interaction with a journalist:
 * - Email sent/received
 * - Phone call
 * - Meeting
 * - Social interaction
 * - Note added
 *
 * Each touch updates the journalist's last_activity_at timestamp.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getPRConfig } from '@/lib/env/pr-config';
import { authenticatePRRequest, createAuthErrorResponse, addPRAuthHeader } from '@/server/pr/prAuth';
import { createPRService } from '@/server/pr/prService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const config = getPRConfig();

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/touches] POST Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.journalistId) {
      const response = NextResponse.json(
        { error: 'journalistId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
      return addPRAuthHeader(response, 'ok');
    }
    if (!body.activityType) {
      const response = NextResponse.json(
        { error: 'activityType is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    const prService = createPRService(auth.client, auth.orgId);
    const result = await prService.logTouch({
      journalistId: body.journalistId,
      activityType: body.activityType,
      activityData: body.activityData || body.activity_data,
      sentiment: body.sentiment,
    });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/touches] POST: Logged touch ${result.id} for journalist ${body.journalistId}`);
    }

    const response = NextResponse.json({
      success: true,
      touchId: result.id,
      journalistId: body.journalistId,
      activityType: body.activityType,
    }, { status: 201 });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/touches] POST Error:', message);
    const response = NextResponse.json(
      { error: message, code: 'CREATE_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}

export async function GET(request: NextRequest) {
  const config = getPRConfig();

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/touches] GET Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const { searchParams } = new URL(request.url);
    const journalistId = searchParams.get('journalistId');
    const limit = searchParams.get('limit');

    let query = auth.client
      .from('journalist_activity_log')
      .select('*')
      .eq('org_id', auth.orgId)
      .order('occurred_at', { ascending: false });

    if (journalistId) {
      query = query.eq('journalist_id', journalistId);
    }

    if (limit) {
      query = query.limit(parseInt(limit, 10));
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get touches: ${error.message}`);
    }

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/touches] GET: ${data?.length || 0} touches`);
    }

    const response = NextResponse.json({
      touches: data || [],
      total: data?.length || 0,
    });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/touches] GET Error:', message);

    if (!config.allowMockFallback) {
      const response = NextResponse.json(
        { error: message, code: 'DB_ERROR' },
        { status: 500 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    const response = NextResponse.json({
      touches: [],
      total: 0,
      _mock: true,
      _error: message,
    });
    return addPRAuthHeader(response, 'ok');
  }
}
