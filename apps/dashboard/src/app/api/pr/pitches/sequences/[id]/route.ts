/**
 * Pitch Sequence [id] API Route Handler
 * Sprint S100.1: Individual sequence CRUD operations
 *
 * Supports:
 * - GET: Retrieve a single pitch sequence
 * - PATCH: Update sequence fields (name, status, settings)
 * - DELETE: Archive a sequence
 */

import { NextRequest, NextResponse } from 'next/server';

import { getPRConfig } from '@/lib/env/pr-config';
import { authenticatePRRequest, createAuthErrorResponse, addPRAuthHeader } from '@/server/pr/prAuth';
import { createPRService } from '@/server/pr/prService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const config = getPRConfig();
  const { id } = await context.params;

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences/${id}] GET Auth failed: ${auth.status}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const sequence = await prService.getSequence(id);

    if (!sequence) {
      const response = NextResponse.json(
        { error: 'Sequence not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences/${id}] GET: ${sequence.name}`);
    }

    const response = NextResponse.json(sequence);
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API /api/pr/pitches/sequences/${id}] GET Error:`, message);

    const response = NextResponse.json(
      { error: message, code: 'DB_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const config = getPRConfig();
  const { id } = await context.params;

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences/${id}] PATCH Auth failed: ${auth.status}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const body = await request.json();

    // Map request body to service input (support both camelCase and snake_case)
    const updateInput: Parameters<typeof prService.updatePitchSequence>[1] = {};

    if (body.name !== undefined) {
      updateInput.name = body.name;
    }
    if (body.status !== undefined) {
      updateInput.status = body.status;
    }
    if (body.defaultSubject !== undefined || body.default_subject !== undefined) {
      updateInput.defaultSubject = body.defaultSubject || body.default_subject;
    }
    if (body.defaultPreviewText !== undefined || body.default_preview_text !== undefined) {
      updateInput.defaultPreviewText = body.defaultPreviewText || body.default_preview_text;
    }
    if (body.settings !== undefined) {
      updateInput.settings = body.settings;
    }

    const sequence = await prService.updatePitchSequence(id, updateInput);

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences/${id}] PATCH: Updated ${sequence.name} to status ${sequence.status}`);
    }

    const response = NextResponse.json(sequence);
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API /api/pr/pitches/sequences/${id}] PATCH Error:`, message);

    // Handle not found case
    if (message.includes('not found') || message.includes('No rows')) {
      const response = NextResponse.json(
        { error: 'Sequence not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    const response = NextResponse.json(
      { error: message, code: 'UPDATE_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const config = getPRConfig();
  const { id } = await context.params;

  // Authenticate request
  const auth = await authenticatePRRequest();

  if (auth.status !== 'ok' || !auth.client || !auth.orgId) {
    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences/${id}] DELETE Auth failed: ${auth.status}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);

    // Archive the sequence (soft delete)
    const sequence = await prService.updatePitchSequence(id, { status: 'archived' });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/pitches/sequences/${id}] DELETE: Archived ${sequence.name}`);
    }

    const response = NextResponse.json({ success: true, archived: true });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API /api/pr/pitches/sequences/${id}] DELETE Error:`, message);

    const response = NextResponse.json(
      { error: message, code: 'DELETE_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}
