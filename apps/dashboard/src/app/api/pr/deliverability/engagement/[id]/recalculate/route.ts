/**
 * Recalculate Engagement Metrics API Route Handler
 * Sprint S100.1: Route handler for recalculating engagement
 */

import { NextRequest, NextResponse } from 'next/server';

import { prBackendFetch, getErrorResponse } from '@/server/prBackendProxy';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const data = await prBackendFetch(`/api/v1/pr-outreach-deliverability/engagement/${id}/recalculate`, {
      method: 'POST',
    });
    return NextResponse.json(data);
  } catch (error: unknown) {
    const { status, message, code } = getErrorResponse(error);
    console.error('[API /api/pr/deliverability/engagement/[id]/recalculate] POST Error:', { status, message, code });
    return NextResponse.json({ error: message, code }, { status });
  }
}
