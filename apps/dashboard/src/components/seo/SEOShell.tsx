'use client';

/**
 * SEOShell — client wrapper for the SEO surface.
 *
 * Provides SEOModeProvider + renders CommandCenterTopbar + SEOChromeBar + children.
 * Same pattern as PRShell. Layout.tsx renders this as the root client boundary.
 */

import { CommandCenterTopbar } from '@/components/command-center';
import { SEOModeProvider } from './SEOModeContext';
import { SEOChromeBar } from './SEOChromeBar';

interface SEOShellProps {
  children: React.ReactNode;
  orgName: string;
  userName: string;
  userAvatarUrl?: string;
}

export function SEOShell({ children, orgName, userName, userAvatarUrl }: SEOShellProps) {
  return (
    <SEOModeProvider>
      <div className="min-h-screen bg-slate-0 flex flex-col">
        <CommandCenterTopbar
          orgName={orgName}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
        />
        <SEOChromeBar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SEOModeProvider>
  );
}
