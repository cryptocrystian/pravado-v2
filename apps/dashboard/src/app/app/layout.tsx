/**
 * App Layout - Conditional Shell
 *
 * This layout conditionally renders either:
 * - Legacy sidebar shell (for most routes)
 * - Passthrough (for command-center, calendar which have their own topbar shell)
 *
 * The AppShellWrapper client component handles the routing logic.
 */

import { AppShellWrapper } from '@/components/layout/AppShellWrapper';
import { getCurrentUser } from '@/lib/getCurrentUser';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Fallback org/user for when session is unavailable (middleware handles auth gate).
// Track 0C item 10: do NOT default fullName to literal "User" here — the topbar
// renders an email-prefix fallback or the literal "You" if no identity at all.
// Defaulting here would short-circuit the topbar's honest fallback chain.
const FALLBACK_ORG = {
  id: '',
  name: 'Workspace',
  createdAt: '',
  updatedAt: '',
};
const FALLBACK_USER: {
  fullName: string | null;
  email: string | null;
  avatarUrl: string | null;
} = { fullName: null, email: null, avatarUrl: null };

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
        email: session?.user.email ?? FALLBACK_USER.email,
        avatarUrl: session?.user.avatarUrl ?? FALLBACK_USER.avatarUrl,
      }}
    >
      {children}
    </AppShellWrapper>
  );
}
