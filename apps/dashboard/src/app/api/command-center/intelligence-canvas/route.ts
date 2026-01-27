/**
 * Intelligence Canvas API Route
 * Returns mock intelligence canvas data from contract examples.
 */

import { NextResponse } from 'next/server';
import intelligenceCanvas from '../../../../../../../contracts/examples/intelligence-canvas.json';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nodeKind = searchParams.get('node_kind');

  let response = { ...intelligenceCanvas };

  // Filter nodes by kind if specified
  if (nodeKind) {
    response = {
      ...response,
      nodes: response.nodes.filter((node) => node.kind === nodeKind),
    };
  }

  return NextResponse.json({
    ...response,
    generated_at: new Date().toISOString(),
  });
}
