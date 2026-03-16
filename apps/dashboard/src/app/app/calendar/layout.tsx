/**
 * Calendar Layout
 *
 * DS v3.1 shell for Calendar. Delegates to CalendarShell (client) which
 * renders: CalendarModeProvider → CommandCenterTopbar → CalendarChromeBar → children
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { CalendarShell } from '@/components/calendar/CalendarShell';
import { MSWProvider } from '@/mocks/MSWProvider';

export const dynamic = 'force-dynamic';

export default async function CalendarLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/login');
  if (!session.activeOrg) redirect('/onboarding');

  return (
    <CalendarShell
      orgName={session.activeOrg.name}
      userName={session.user.fullName || 'User'}
      userAvatarUrl={session.user.avatarUrl || undefined}
    >
      <MSWProvider>
        {children}
      </MSWProvider>
    </CalendarShell>
  );
}
