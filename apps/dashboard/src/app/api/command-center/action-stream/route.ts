/**
 * Action Stream API Route
 * Returns mock action stream data from contract examples.
 */

import { NextResponse } from 'next/server';
import actionStream from '../../../../../../../contracts/examples/action-stream.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pillar = searchParams.get('pillar');
  const priority = searchParams.get('priority');

  let items = [...actionStream.items];

  // Filter by pillar if specified
  if (pillar) {
    items = items.filter((item) => item.pillar === pillar);
  }

  // Filter by priority if specified
  if (priority) {
    items = items.filter((item) => item.priority === priority);
  }

  return NextResponse.json({
    ...actionStream,
    items,
    generated_at: new Date().toISOString(),
  });
}
