'use client';

/**
 * CalendarShell — Client wrapper for the Calendar surface.
 *
 * Provides CalendarModeProvider → CommandCenterTopbar → CalendarChromeBar → children
 * Same structural pattern as PRShell / SEOShell.
 */

import type { ReactNode } from 'react';
import { CommandCenterTopbar } from '@/components/command-center/CommandCenterTopbar';
import { CalendarModeProvider } from './CalendarModeContext';
import { CalendarChromeBar } from './CalendarChromeBar';

interface CalendarShellProps {
  orgName: string;
  userName: string;
  userAvatarUrl?: string;
  children: ReactNode;
}

export function CalendarShell({ orgName, userName, userAvatarUrl, children }: CalendarShellProps) {
  return (
    <CalendarModeProvider>
      <div className="min-h-screen bg-slate-0 flex flex-col">
        <CommandCenterTopbar
          orgName={orgName}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
        />
        <CalendarChromeBar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </CalendarModeProvider>
  );
}
