/**
 * PR Intelligence — /app/pr/intelligence (retired)
 *
 * The standalone PR "Intelligence" surface was a drift artifact promising
 * "weekly intelligence briefings" that contradicted the canonical, daily
 * SAGE Daily Brief now shipping in the Command Center (D039). The tab has
 * been removed from PR navigation; this route is preserved only to redirect
 * old bookmarks to the Command Center where the real brief lives.
 *
 * @see /docs/canon/COMMAND_CENTER_CONTRACT.md
 */

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function IntelligencePage() {
  redirect('/app/command-center');
}
