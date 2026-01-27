/**
 * PR Inbox API Route Handler
 * Sprint S100.1: Aggregated work queue from DB entities
 *
 * Aggregates inbox items from:
 * - Follow-ups due (from pitch tracking)
 * - Relationship decay (from journalist engagement scores)
 * - Approval queue (from draft pitches)
 * - Data hygiene (from contact verification status)
 *
 * NON-NEGOTIABLE: All pitch actions remain Manual-only
 * NON-NEGOTIABLE: Follow-ups require human review
 *
 * @see /docs/canon/PR_INBOX_CONTRACT.md
 */

import { NextResponse } from 'next/server';

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
    // Log for debugging
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/inbox] Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const result = await prService.getInboxItems();

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/inbox] GET: ${result.total} inbox items`);
      console.log(`  - Follow-ups: ${result.byType.follow_up_due || 0}`);
      console.log(`  - Decay: ${result.byType.relationship_decay || 0}`);
      console.log(`  - Approvals: ${result.byType.approval_queue || 0}`);
    }

    const response = NextResponse.json(result);
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/inbox] GET Error:', message);

    if (!config.allowMockFallback) {
      const response = NextResponse.json(
        { error: message, code: 'DB_ERROR' },
        { status: 500 }
      );
      return addPRAuthHeader(response, 'ok'); // Auth was ok, DB failed
    }

    // Demo mode fallback (only when PRAVADO_DEMO_MODE=1 and not STRICT)
    const response = NextResponse.json({
      items: [],
      total: 0,
      byType: {
        all: 0,
        inquiry: 0,
        follow_up_due: 0,
        coverage_triage: 0,
        relationship_decay: 0,
        approval_queue: 0,
        data_hygiene: 0,
      },
      _mock: true,
      _error: message,
    });
    return addPRAuthHeader(response, 'ok');
  }
}
