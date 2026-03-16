/**
 * PR Surface Layout — /app/pr/*
 * Server component — handles auth, passes session props to PRShell.
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/getCurrentUser';
import { MSWProvider } from '@/mocks/MSWProvider';
import { PRShell } from '@/components/pr/PRShell';

export const dynamic = 'force-dynamic';

export default async function PRLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect('/login');
  if (!session.activeOrg) redirect('/onboarding');

  return (
    <PRShell
      orgName={session.activeOrg.name}
      userName={session.user.fullName || 'User'}
      userAvatarUrl={session.user.avatarUrl || undefined}
    >
      <MSWProvider>{children}</MSWProvider>
    </PRShell>
  );
}
