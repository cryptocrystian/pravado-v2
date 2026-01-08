/**
 * App Layout - Conditional Shell
 *
 * This layout conditionally renders either:
 * - Legacy sidebar shell (for most routes)
 * - Passthrough (for command-center, calendar which have their own topbar shell)
 *
 * The AppShellWrapper client component handles the routing logic.
 */

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';
import { AppShellWrapper } from '@/components/layout/AppShellWrapper';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  if (!session.activeOrg) {
    redirect('/onboarding');
  }

  return (
    <AppShellWrapper
      currentOrg={session.activeOrg}
      allOrgs={session.orgs}
      user={{
        fullName: session.user.fullName,
        avatarUrl: session.user.avatarUrl,
      }}
    >
      {children}
    </AppShellWrapper>
  );
}
