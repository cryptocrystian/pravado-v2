import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://pravado-api.onrender.com';
    const res = await fetch(`${apiUrl}/api/v1/silo-tax/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 });
  }
}
