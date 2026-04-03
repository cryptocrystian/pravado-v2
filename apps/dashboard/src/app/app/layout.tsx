/**
 * App Layout - Conditional Shell
 *
 * This layout conditionally renders either:
 * - Legacy sidebar shell (for most routes)
 * - Passthrough (for command-center, calendar which have their own topbar shell)
 *
 * The AppShellWrapper client component handles the routing logic.
 */

import { getCurrentUser } from '@/lib/getCurrentUser';
import { AppShellWrapper } from '@/components/layout/AppShellWrapper';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Fallback org/user for when session is unavailable (middleware handles auth gate)
const FALLBACK_ORG = { id: '', name: 'Workspace', createdAt: '', updatedAt: '' };
const FALLBACK_USER = { fullName: 'User', avatarUrl: null };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware guarantees auth — this fetch is for display props only
  const session = await getCurrentUser();

  return (
    <AppShellWrapper
      currentOrg={session?.activeOrg ?? FALLBACK_ORG}
      allOrgs={session?.orgs ?? []}
      user={{
        fullName: session?.user.fullName ?? FALLBACK_USER.fullName,
        avatarUrl: session?.user.avatarUrl ?? FALLBACK_USER.avatarUrl,
      }}
    >
      {children}
    </AppShellWrapper>
  );
}
