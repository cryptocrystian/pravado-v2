'use client';

/**
 * PR Surface Shell
 *
 * Client wrapper that provides PRModeContext to the entire PR surface.
 * Receives session props from the server layout, renders PRChromeBar + children.
 *
 * Layout hierarchy:
 *   layout.tsx (server) → PRShell (client) → PRChromeBar + {children}
 */

import type { ReactNode } from 'react';
import { CommandCenterTopbar } from '@/components/command-center/CommandCenterTopbar';
import { PRModeProvider } from './PRModeContext';
import { PRChromeBar } from './PRChromeBar';

interface PRShellProps {
  children: ReactNode;
  orgName: string;
  userName?: string;
  userEmail?: string;
  userAvatarUrl?: string;
}

export function PRShell({ children, orgName, userName, userEmail, userAvatarUrl }: PRShellProps) {
  return (
    <PRModeProvider>
      <div className="min-h-screen bg-slate-0 flex flex-col">
        <CommandCenterTopbar
          orgName={orgName}
          userName={userName}
          userEmail={userEmail}
          userAvatarUrl={userAvatarUrl}
        />
        <PRChromeBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </PRModeProvider>
  );
}
