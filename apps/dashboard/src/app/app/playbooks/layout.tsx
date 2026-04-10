/**
 * Playbooks Layout — /app/playbooks/*
 * DS v3 topbar shell (no legacy sidebar)
 */

import { getCurrentUser } from '@/lib/getCurrentUser';
import { SettingsShell } from '@/components/settings/SettingsShell';
import { MSWProvider } from '@/mocks/MSWProvider';

export const dynamic = 'force-dynamic';

export default async function PlaybooksLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();

  return (
    <SettingsShell
      orgName={session?.activeOrg?.name ?? 'Workspace'}
      userName={session?.user.fullName || 'User'}
      userAvatarUrl={session?.user.avatarUrl || undefined}
    >
      <MSWProvider>{children}</MSWProvider>
    </SettingsShell>
  );
}
