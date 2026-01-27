/**
 * Entity Map API Route
 * Returns SAGE-native entity map data from contract examples.
 *
 * @see /docs/canon/ENTITY-MAP-SAGE.md
 */

import { NextResponse } from 'next/server';
import entityMap from '../../../../../../../contracts/examples/entity-map.json';

export async function GET() {
  return NextResponse.json({
    ...entityMap,
    generated_at: new Date().toISOString(),
  });
}
