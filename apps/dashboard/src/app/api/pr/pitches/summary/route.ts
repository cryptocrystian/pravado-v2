/**
 * PR Pitch Pipeline Summary
 *
 * HONEST DATA: there is no real pitch-pipeline aggregation reachable from the
 * dashboard without a dedicated backend endpoint (the counts live in
 * `pr_pitches` / outreach tables behind the gated pitches + send surfaces, which
 * are explicitly out of scope for this read-only SAGE slice). Rather than emit a
 * hardcoded `0` that would read as an authoritative "you have zero drafts", this
 * route reports the pipeline as NOT YET AVAILABLE so the surface can render an
 * honest "—" placeholder instead of fake data.
 *
 * When a real pipeline-count endpoint exists, wire it here and return
 * `available: true` with a populated `pipeline`.
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    success: true,
    available: false,
    pipeline: null,
    reason: 'Pitch pipeline tracking is not yet connected.',
  });
}
