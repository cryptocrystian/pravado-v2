/**
 * Legacy Dashboard Redirect
 *
 * DEPRECATED: This surface has been replaced by the Command Center.
 * All traffic to /app is redirected to /app/command-center.
 *
 * @see /docs/canon/UX_SURFACES.md - Surface Authority section
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { redirect } from 'next/navigation';

export default function AppPage() {
  redirect('/app/command-center');
}
