/**
 * Calendar Layout
 *
 * DS v3 topbar-first shell for Calendar routes.
 * Uses the same CommandCenterTopbar as Command Center.
 * This layout is scoped ONLY to /app/calendar routes.
 *
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * IMPORTANT: This layout intentionally does NOT render the legacy sidebar.
 * Calendar is part of the Command Center orbit and uses the same topbar.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';
import { CommandCenterTopbar } from '@/components/command-center';
import { MSWProvider } from '@/mocks/MSWProvider';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

export default async function CalendarLayout({
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
    <div className="min-h-screen bg-[#050508] flex flex-col">
      {/* DS v3 Topbar - Same as Command Center */}
      <CommandCenterTopbar
        orgName={session.activeOrg.name}
        userName={session.user.fullName || 'User'}
        userAvatarUrl={session.user.avatarUrl || undefined}
      />

      {/* Main Content - Full width beneath topbar */}
      <main className="flex-1 overflow-hidden">
        <MSWProvider>
          {children}
        </MSWProvider>
      </main>
    </div>
  );
}
