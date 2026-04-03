/**
 * PR Surface Layout — /app/pr/*
 * Server component — handles auth, passes session props to PRShell.
 */

import { getCurrentUser } from '@/lib/getCurrentUser';
import { MSWProvider } from '@/mocks/MSWProvider';
import { PRShell } from '@/components/pr/PRShell';

export const dynamic = 'force-dynamic';

export default async function PRLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  return (
    <PRShell
      orgName={session?.activeOrg?.name ?? 'Workspace'}
      userName={session?.user.fullName || 'User'}
      userAvatarUrl={session?.user.avatarUrl || undefined}
    >
      <MSWProvider>{children}</MSWProvider>
    </PRShell>
  );
}
