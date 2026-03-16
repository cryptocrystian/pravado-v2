import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Calendar events API — returns empty until Fastify backend route exists
  return NextResponse.json({
    success: true,
    events: [],
    message: 'No scheduled events yet',
  });
}
