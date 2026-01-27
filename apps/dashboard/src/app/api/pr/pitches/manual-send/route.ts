/**
 * PR Manual Send API Route Handler
 * Sprint S100.1: Manual pitch sending (system-enforced)
 *
 * NON-NEGOTIABLE: Pitch sending is MANUAL-ONLY.
 * - No bulk operations - individual send only
 * - Each pitch requires explicit human action
 * - Creates pitch_event and transitions contact state
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
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
      console.log(`[API /api/pr/pitches/manual-send] Auth failed: ${auth.status} - ${auth.error}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.sequenceId) {
      const response = NextResponse.json(
        { error: 'sequenceId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
      return addPRAuthHeader(response, 'ok');
    }
    if (!body.contactId) {
      const response = NextResponse.json(
        { error: 'contactId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    const prService = createPRService(auth.client, auth.orgId);
    const result = await prService.manualSendPitch({
      sequenceId: body.sequenceId,
      contactId: body.contactId,
      stepPosition: body.stepPosition || 1,
    });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/manual-send] POST: Sent pitch, event ${result.eventId}, status -> ${result.newStatus}`);
      console.log(`[API /api/pr/pitches/manual-send] EVI Attribution: ${result.eviAttribution.driver} +${result.eviAttribution.delta}`);
    }

    const response = NextResponse.json({
      success: true,
      eventId: result.eventId,
      newStatus: result.newStatus,
      sequenceId: body.sequenceId,
      contactId: body.contactId,
      message: 'Pitch manually sent. Contact status updated to "sent".',
      // EVI attribution for Command Center integration
      eviAttribution: result.eviAttribution,
    }, { status: 200 });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API /api/pr/pitches/manual-send] POST Error:', message);

    // Return appropriate error status based on error type
    const isValidationError = message.includes('not found') || message.includes('Cannot send');
    const response = NextResponse.json(
      { error: message, code: isValidationError ? 'VALIDATION_ERROR' : 'SEND_ERROR' },
      { status: isValidationError ? 400 : 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}
