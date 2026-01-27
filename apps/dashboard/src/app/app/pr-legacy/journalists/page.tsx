/**
 * Journalist Intelligence Dashboard (Sprint S100)
 * Pure client rendering - data loaded via route handlers only
 *
 * INVARIANT: This page does NOT import from prDataServer.
 * All data flows through /api/pr/* route handlers.
 */

import JournalistsClient from './JournalistsClient';

export default function JournalistsPage() {
  // S100: No server-side data fetching. Client component loads via /api/pr/journalists
  return <JournalistsClient initialProfiles={[]} initialTotal={0} />;
}
