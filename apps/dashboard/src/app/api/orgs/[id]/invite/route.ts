/**
 * Create org invite API route
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  getServerAccessToken,
  ServerAuthError,
} from '@/server/supabaseServerAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let authToken: string;
  try {
    authToken = await getServerAccessToken();
  } catch (err) {
    const code = err instanceof ServerAuthError ? err.code : 'AUTH_MISSING';
    return NextResponse.json(
      {
        success: false,
        error: { code, message: 'Authentication required' },
      },
      { status: 401 }
    );
  }

  const body = await request.json();

  const response = await fetch(`${API_URL}/api/v1/orgs/${id}/invite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, { status: response.status });
}
