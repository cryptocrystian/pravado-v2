/**
 * PR-1 Keystone — per-pillar mode proxy.
 *
 * Same-origin proxy so the client `ModeContext` never handles the access token:
 *   GET   /api/orgs/:id/mode  → backend GET  /api/v1/orgs/:id/mode
 *   PATCH /api/orgs/:id/mode  → backend PATCH /api/v1/orgs/:id/mode
 * Mirrors the existing app/api/orgs/[id]/invite proxy.
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  getServerAccessToken,
  ServerAuthError,
} from '@/server/supabaseServerAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function token(): Promise<
  { ok: true; token: string } | { ok: false; res: NextResponse }
> {
  try {
    return { ok: true, token: await getServerAccessToken() };
  } catch (err) {
    const code = err instanceof ServerAuthError ? err.code : 'AUTH_MISSING';
    return {
      ok: false,
      res: NextResponse.json(
        { success: false, error: { code, message: 'Authentication required' } },
        { status: 401 }
      ),
    };
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await token();
  if (!auth.ok) return auth.res;

  const response = await fetch(`${API_URL}/api/v1/orgs/${id}/mode`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${auth.token}` },
    cache: 'no-store',
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await token();
  if (!auth.ok) return auth.res;

  const body = await request.json();
  const response = await fetch(`${API_URL}/api/v1/orgs/${id}/mode`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}
