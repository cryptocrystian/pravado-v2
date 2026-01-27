/**
 * Journalist Profile [id] API Route Handler
 * Sprint S100.1: Individual journalist CRUD operations
 *
 * Supports:
 * - GET: Retrieve a single journalist profile
 * - PATCH: Update journalist profile fields
 * - DELETE: Soft-delete (archive) a journalist profile
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
      console.log(`[API /api/pr/journalists/${id}] GET Auth failed: ${auth.status}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const journalist = await prService.getJournalist(id);

    if (!journalist) {
      const response = NextResponse.json(
        { error: 'Journalist not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/journalists/${id}] GET: ${journalist.fullName}`);
    }

    const response = NextResponse.json(journalist);
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API /api/pr/journalists/${id}] GET Error:`, message);

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
      console.log(`[API /api/pr/journalists/${id}] PATCH Auth failed: ${auth.status}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    const prService = createPRService(auth.client, auth.orgId);
    const body = await request.json();

    // Map request body to service input (support both camelCase and snake_case)
    const updateInput: Parameters<typeof prService.updateJournalist>[1] = {};

    if (body.fullName !== undefined || body.full_name !== undefined) {
      updateInput.fullName = body.fullName || body.full_name;
    }
    if (body.primaryEmail !== undefined || body.primary_email !== undefined) {
      updateInput.primaryEmail = body.primaryEmail || body.primary_email;
    }
    if (body.primaryOutlet !== undefined || body.primary_outlet !== undefined) {
      updateInput.primaryOutlet = body.primaryOutlet || body.primary_outlet;
    }
    if (body.beat !== undefined) {
      updateInput.beat = body.beat;
    }
    if (body.twitterHandle !== undefined || body.twitter_handle !== undefined) {
      updateInput.twitterHandle = body.twitterHandle || body.twitter_handle;
    }
    if (body.linkedinUrl !== undefined || body.linkedin_url !== undefined) {
      updateInput.linkedinUrl = body.linkedinUrl || body.linkedin_url;
    }
    if (body.engagementScore !== undefined || body.engagement_score !== undefined) {
      updateInput.engagementScore = body.engagementScore ?? body.engagement_score;
    }
    if (body.responsivenessScore !== undefined || body.responsiveness_score !== undefined) {
      updateInput.responsivenessScore = body.responsivenessScore ?? body.responsiveness_score;
    }
    if (body.relevanceScore !== undefined || body.relevance_score !== undefined) {
      updateInput.relevanceScore = body.relevanceScore ?? body.relevance_score;
    }
    if (body.metadata !== undefined) {
      updateInput.metadata = body.metadata;
    }

    const journalist = await prService.updateJournalist(id, updateInput);

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/journalists/${id}] PATCH: Updated ${journalist.fullName}`);
    }

    const response = NextResponse.json(journalist);
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API /api/pr/journalists/${id}] PATCH Error:`, message);

    // Handle not found case
    if (message.includes('not found') || message.includes('No rows')) {
      const response = NextResponse.json(
        { error: 'Journalist not found', code: 'NOT_FOUND' },
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
      console.log(`[API /api/pr/journalists/${id}] DELETE Auth failed: ${auth.status}`);
    }
    return createAuthErrorResponse(auth);
  }

  try {
    // Soft delete by setting metadata.archived = true
    // This preserves data for audit trail while hiding from UI
    const prService = createPRService(auth.client, auth.orgId);

    // First get the current journalist to preserve existing metadata
    const current = await prService.getJournalist(id);
    if (!current) {
      const response = NextResponse.json(
        { error: 'Journalist not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
      return addPRAuthHeader(response, 'ok');
    }

    // Soft delete by updating metadata
    await prService.updateJournalist(id, {
      metadata: {
        ...(current.metadata || {}),
        archived: true,
        archivedAt: new Date().toISOString(),
      },
    });

    if (config.showBackendStatus) {
      console.log(`[API /api/pr/journalists/${id}] DELETE: Archived ${current.fullName}`);
    }

    const response = NextResponse.json({ success: true, archived: true });
    return addPRAuthHeader(response, 'ok');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[API /api/pr/journalists/${id}] DELETE Error:`, message);

    const response = NextResponse.json(
      { error: message, code: 'DELETE_ERROR' },
      { status: 500 }
    );
    return addPRAuthHeader(response, 'ok');
  }
}
