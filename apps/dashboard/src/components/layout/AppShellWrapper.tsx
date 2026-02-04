'use client';

/**
 * AppShellWrapper - Conditional Layout Wrapper
 *
 * Determines whether to render the legacy sidebar shell or
 * let the route handle its own layout (command-center, calendar).
 *
 * Routes with custom shells (no sidebar):
 * - /app/command-center - DS v3 topbar shell
 * - /app/calendar - DS v3 topbar shell (same as command-center)
 */

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { AppSidebar } from './AppSidebar';
import { AIOrchestrationBar } from '@/components/orchestration';
import { MSWProvider } from '@/mocks/MSWProvider';
import { ModeProvider } from '@/lib/ModeContext';

interface Org {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface User {
  fullName: string | null;
  avatarUrl: string | null;
}

interface AppShellWrapperProps {
  children: ReactNode;
  currentOrg: Org;
  allOrgs: Org[];
  user: User;
}

// Routes that use their own shell (no sidebar, no legacy header)
// These routes render with DS v3 topbar work surface pattern
const CUSTOM_SHELL_ROUTES = ['/app/command-center', '/app/calendar', '/app/pr', '/app/content'];

// Routes that redirect immediately - show nothing to avoid flash
const REDIRECT_ROUTES = ['/app'];

// AI Presence Dot
const AIPresenceDot = () => (
  <span
    className="w-2 h-2 rounded-full bg-brand-cyan animate-ai-pulse"
    aria-label="AI Active"
  />
);

export function AppShellWrapper({
  children,
  currentOrg,
  allOrgs,
  user,
}: AppShellWrapperProps) {
  const pathname = usePathname();

  // Check if current route is a redirect route - show nothing to prevent flash
  const isRedirectRoute = REDIRECT_ROUTES.some((route) => pathname === route);

  if (isRedirectRoute) {
    // Route will redirect - show minimal loading state to prevent old DS flash
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-cyan/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  // Check if current route uses a custom shell
  const usesCustomShell = CUSTOM_SHELL_ROUTES.some((route) =>
    pathname?.startsWith(route)
  );

  if (usesCustomShell) {
    // Route handles its own layout (topbar shell) - render children directly
    // MSWProvider is handled by the route's own layout
    return <ModeProvider>{children}</ModeProvider>;
  }

  // Default: render with sidebar + header + orchestration bar
  return (
    <ModeProvider>
      <div className="min-h-screen bg-page flex">
        <AppSidebar currentOrg={currentOrg} allOrgs={allOrgs} user={user} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-slate-1 border-b border-border-subtle flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {/* Search (placeholder) */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 bg-slate-3 border border-border-subtle rounded-lg text-sm text-white placeholder-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan/20 transition-all duration-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* AI Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-3/50 rounded-full">
              <AIPresenceDot />
              <span className="text-xs text-muted">AI Active</span>
            </div>

            {/* Notifications (placeholder) */}
            <button className="p-2 text-muted hover:text-white hover:bg-slate-4/50 rounded-lg transition-colors duration-sm">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* AI Orchestration Bar - Global visibility layer */}
        <AIOrchestrationBar />

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-page">
          <MSWProvider>{children}</MSWProvider>
        </main>
      </div>
      </div>
    </ModeProvider>
  );
}
