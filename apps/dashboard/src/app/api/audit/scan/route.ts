import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pravado-api.onrender.com';
    const res = await fetch(`${apiUrl}/api/v1/silo-tax/scan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('[audit/scan proxy] upstream fetch failed', {
      name: (error as Error)?.name ?? 'UnknownError',
    });
    return NextResponse.json(
      { error: 'Scan service unreachable' },
      { status: 502 },
    );
  }
}
