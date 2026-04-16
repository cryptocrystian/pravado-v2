'use client';

/**
 * Settings Shell — DS v3 topbar shell for Settings, Team, Billing, Playbooks
 *
 * Renders CommandCenterTopbar + children with no ChromeBar.
 * These surfaces have their own internal navigation (tabs, sidebar, etc.)
 */

import type { ReactNode } from 'react';
import { CommandCenterTopbar } from '@/components/command-center/CommandCenterTopbar';

interface SettingsShellProps {
  children: ReactNode;
  orgName: string;
  userName: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

export function SettingsShell({ children, orgName, userName, userEmail, userAvatarUrl }: SettingsShellProps) {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <CommandCenterTopbar
        orgName={orgName}
        userName={userName}
        userEmail={userEmail}
        userAvatarUrl={userAvatarUrl}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
