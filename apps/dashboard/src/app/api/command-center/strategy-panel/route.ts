/**
 * Strategy Panel API Route
 * Returns mock strategy panel data from contract examples.
 */

import { NextResponse } from 'next/server';
import strategyPanel from '../../../../../../../contracts/examples/strategy-panel.json';

export async function GET() {
  return NextResponse.json({
    ...strategyPanel,
    generated_at: new Date().toISOString(),
  });
}
