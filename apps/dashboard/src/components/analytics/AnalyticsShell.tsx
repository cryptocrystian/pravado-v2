'use client';

/**
 * AnalyticsShell — Client wrapper for the Analytics surface.
 *
 * Renders: CommandCenterTopbar → AnalyticsChromeBar → children
 */

import type { ReactNode } from 'react';
import { CommandCenterTopbar } from '@/components/command-center/CommandCenterTopbar';
import { AnalyticsChromeBar } from './AnalyticsChromeBar';
import { AnalyticsModeProvider } from './AnalyticsModeContext';

interface AnalyticsShellProps {
  orgName: string;
  userName: string;
  userAvatarUrl?: string;
  children: ReactNode;
}

export function AnalyticsShell({ orgName, userName, userAvatarUrl, children }: AnalyticsShellProps) {
  return (
    <AnalyticsModeProvider>
      <div className="min-h-screen bg-slate-0 flex flex-col">
        <CommandCenterTopbar
          orgName={orgName}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
        />
        <AnalyticsChromeBar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </AnalyticsModeProvider>
  );
}
