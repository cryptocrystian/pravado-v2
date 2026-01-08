/**
 * Command Center Layout
 *
 * DS v3 topbar-first shell that bypasses the legacy sidebar layout.
 * This layout is scoped ONLY to /app/command-center routes.
 *
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * IMPORTANT: This layout intentionally does NOT render the legacy sidebar.
 * Command Center is AI-native and topbar-centric per canon.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';
import { CommandCenterTopbar } from '@/components/command-center';
import { MSWProvider } from '@/mocks/MSWProvider';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

export default async function CommandCenterLayout({
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
      {/* DS v3 Topbar - AI-native, no sidebar */}
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
