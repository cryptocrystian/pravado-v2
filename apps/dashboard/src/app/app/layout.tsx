/**
 * App shell layout with sidebar navigation
 * Styled according to Pravado Design System v2
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

// Navigation Icons (simple SVG icons matching DS style)
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
    </svg>
  ),
  pr: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
    </svg>
  ),
  content: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  seo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  playbooks: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  agents: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  analytics: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  team: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// AI Presence Dot
const AIPresenceDot = () => (
  <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ai-pulse" aria-label="AI Active" />
);

export default async function AppLayout({
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

  const navItems = [
    { name: 'Dashboard', href: '/app', icon: icons.dashboard },
    { name: 'PR', href: '/app/pr', icon: icons.pr },
    { name: 'Content', href: '/app/content', icon: icons.content },
    { name: 'SEO', href: '/app/seo', icon: icons.seo },
    { name: 'Playbooks', href: '/app/playbooks', icon: icons.playbooks },
    { name: 'Agents', href: '/app/agents', icon: icons.agents },
    { name: 'Analytics', href: '/app/analytics', icon: icons.analytics },
  ];

  const settingsItems = [
    { name: 'Team', href: '/app/team', icon: icons.team },
    { name: 'Settings', href: '/app/settings', icon: icons.settings },
  ];

  return (
    <div className="min-h-screen bg-page flex">
      {/* Sidebar - 72px as per DS App Shell spec */}
      <aside className="w-72 bg-slate-1 border-r border-border-subtle flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-gradient-hero">Pravado</span>
            <AIPresenceDot />
          </div>
        </div>

        {/* Organization Selector */}
        <div className="px-4 py-4 border-b border-border-subtle">
          <div className="flex items-center space-x-3 p-2 rounded-lg bg-slate-3/50 hover:bg-slate-3 transition-colors duration-sm cursor-pointer">
            <div className="w-8 h-8 bg-brand-iris rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {session.activeOrg.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.activeOrg.name}
              </p>
              <p className="text-xs text-muted truncate">
                Organization
              </p>
            </div>
            <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-6 hover:text-white hover:bg-slate-4/50 transition-all duration-sm group"
            >
              <span className="text-muted group-hover:text-brand-cyan transition-colors duration-sm">
                {item.icon}
              </span>
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Settings Section */}
          <div className="pt-4 mt-4 border-t border-border-subtle">
            <p className="px-3 mb-2 text-xs font-medium text-muted uppercase tracking-wider">
              Settings
            </p>
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-6 hover:text-white hover:bg-slate-4/50 transition-all duration-sm group"
              >
                <span className="text-muted group-hover:text-brand-cyan transition-colors duration-sm">
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="px-4 py-4 border-t border-border-subtle">
          <div className="flex items-center space-x-3">
            {session.user.avatarUrl ? (
              <img
                src={session.user.avatarUrl}
                alt={session.user.fullName || 'User'}
                className="w-9 h-9 rounded-full ring-2 ring-slate-4"
              />
            ) : (
              <div className="w-9 h-9 bg-slate-4 rounded-full flex items-center justify-center text-muted text-sm font-medium ring-2 ring-slate-5">
                {session.user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {session.user.fullName || 'User'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-slate-1 border-b border-border-subtle flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            {/* Search (placeholder) */}
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-page">
          {children}
        </main>
      </div>
    </div>
  );
}
