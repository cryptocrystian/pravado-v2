import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    pipeline: {
      drafts: 0,
      awaiting_send: 0,
      sent: 0,
      coverage: 0,
    },
    total: 0,
  });
}
