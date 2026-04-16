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
import { AnalyticsDateProvider } from './AnalyticsDateContext';

interface AnalyticsShellProps {
  orgName: string;
  userName: string;
  userEmail?: string;
  userAvatarUrl?: string;
  children: ReactNode;
}

export function AnalyticsShell({ orgName, userName, userEmail, userAvatarUrl, children }: AnalyticsShellProps) {
  return (
    <AnalyticsModeProvider>
    <AnalyticsDateProvider>
      <div className="min-h-screen bg-slate-0 flex flex-col">
        <CommandCenterTopbar
          orgName={orgName}
          userName={userName}
          userEmail={userEmail}
          userAvatarUrl={userAvatarUrl}
        />
        <AnalyticsChromeBar />
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </AnalyticsDateProvider>
    </AnalyticsModeProvider>
  );
}
