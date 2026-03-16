/**
 * Analytics Layout
 *
 * DS v3.1 shell for Analytics. Delegates to AnalyticsShell (client) which
 * renders: CommandCenterTopbar → AnalyticsChromeBar (with tabs) → children
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { AnalyticsShell } from '@/components/analytics/AnalyticsShell';
import { MSWProvider } from '@/mocks/MSWProvider';

export const dynamic = 'force-dynamic';

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/login');
  if (!session.activeOrg) redirect('/onboarding');

  return (
    <AnalyticsShell
      orgName={session.activeOrg.name}
      userName={session.user.fullName || 'User'}
      userAvatarUrl={session.user.avatarUrl || undefined}
    >
      <MSWProvider>
        {children}
      </MSWProvider>
    </AnalyticsShell>
  );
}
