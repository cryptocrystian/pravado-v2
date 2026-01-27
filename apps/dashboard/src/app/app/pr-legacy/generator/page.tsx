/**
 * PR Generator Page (Sprint S100)
 * Pure client rendering - data loaded via route handlers only
 *
 * INVARIANT: This page does NOT import from prDataServer.
 * All data flows through /api/pr/* route handlers.
 */

import GeneratorClient from './GeneratorClient';

export default function PRGeneratorPage() {
  // S100: No server-side data fetching. Client component loads via /api/pr/releases
  return <GeneratorClient initialReleases={[]} />;
}
