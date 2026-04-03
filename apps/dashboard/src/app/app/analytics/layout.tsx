/**
 * Analytics Layout
 *
 * DS v3.1 shell for Analytics. Delegates to AnalyticsShell (client) which
 * renders: CommandCenterTopbar → AnalyticsChromeBar (with tabs) → children
 */

import { getCurrentUser } from '@/lib/getCurrentUser';
import { AnalyticsShell } from '@/components/analytics/AnalyticsShell';
import { MSWProvider } from '@/mocks/MSWProvider';

export const dynamic = 'force-dynamic';

export default async function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  return (
    <AnalyticsShell
      orgName={session?.activeOrg?.name ?? 'Workspace'}
      userName={session?.user.fullName || 'User'}
      userAvatarUrl={session?.user.avatarUrl || undefined}
    >
      <MSWProvider>
        {children}
      </MSWProvider>
    </AnalyticsShell>
  );
}
