'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * CommandCenterTopbar v2.0 - UX Pilot Reference Match
 *
 * AI-native, topbar-centric navigation with polished styling:
 *
 * GROUPING (per UX Pilot):
 * - Left cluster: Pravado wordmark + AI status dot, Org selector
 * - Middle cluster: Surface navigation (prominent, with glow active states)
 * - Center-right: Omni-Tray trigger (ONLY search-like affordance)
 * - Right cluster: AI Active indicator, context chips, notifications, user menu
 *
 * NAVIGATION PROMINENCE:
 * - Nav items use text-sm font (not xs)
 * - Inactive: text-white/70 (lighter than before)
 * - Active: text-white + bg-brand-cyan/15 + border + glow + underline
 * - Consistent spacing between items
 *
 * IMPORTANT: Only ONE search-like element exists (Omni-Tray trigger).
 * Do NOT add additional search inputs.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface CommandCenterTopbarProps {
  orgName?: string;
  userName?: string;
  userAvatarUrl?: string;
}

// Surface navigation items - order matches reference
const surfaceNavItems = [
  { name: 'Command Center', href: '/app/command-center', shortName: 'Command' },
  { name: 'PR', href: '/app/pr', shortName: 'PR' },
  { name: 'Content', href: '/app/content', shortName: 'Content' },
  { name: 'SEO', href: '/app/seo', shortName: 'SEO' },
  { name: 'Playbooks', href: '/app/playbooks', shortName: 'Playbooks' },
  { name: 'Agents', href: '/app/agents', shortName: 'Agents' },
  { name: 'Analytics', href: '/app/analytics', shortName: 'Analytics' },
];

export function CommandCenterTopbar({
  orgName = 'Pravado Test 01',
  userName = 'User',
  userAvatarUrl,
}: CommandCenterTopbarProps) {
  const pathname = usePathname();
  const [omniTrayOpen, setOmniTrayOpen] = useState(false);
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set(['media-monitoring']));

  const toggleChip = (chipId: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(chipId)) {
        next.delete(chipId);
      } else {
        next.add(chipId);
      }
      return next;
    });
  };

  const contextChips = [
    { id: 'media-monitoring', label: 'Media Monitoring', color: 'brand-magenta' },
    { id: 'content-quality', label: 'Content Quality', color: 'brand-iris' },
  ];

  // Check if a nav item is active
  const isActive = (href: string) => {
    if (href === '/app/command-center') {
      return pathname === '/app/command-center' || pathname?.startsWith('/app/command-center/');
    }
    return pathname?.startsWith(href);
  };

  return (
    <>
      <header className="sticky top-0 z-50 h-14 bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-[#1A1A24] flex items-center px-3 gap-2">
        {/* ============================================
            LEFT CLUSTER: Logo + Org Selector
            ============================================ */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {/* Pravado Wordmark + AI Status */}
          <Link href="/app/command-center" className="flex items-center gap-2 group">
            <span className="text-lg font-bold bg-gradient-to-r from-brand-cyan via-brand-iris to-brand-magenta bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
              Pravado
            </span>
            <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.7)]" />
          </Link>

          {/* Org Selector - Compact */}
          <button className="hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#13131A] border border-[#1A1A24] hover:border-[#2A2A36] transition-colors group">
            <div className="w-5 h-5 rounded bg-brand-iris/20 flex items-center justify-center text-brand-iris text-[11px] font-bold">
              {orgName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-medium text-white/75 group-hover:text-white/95 transition-colors truncate max-w-[90px]">
              {orgName}
            </span>
            <svg className="w-3 h-3 text-white/45 group-hover:text-white/70 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Vertical Divider */}
        <div className="hidden md:block w-px h-7 bg-[#1A1A24] mx-1" />

        {/* ============================================
            MIDDLE CLUSTER: Surface Navigation (PROMINENT)
            ============================================ */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {surfaceNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                  ${active
                    ? 'bg-brand-cyan/12 text-white border border-brand-cyan/25 shadow-[0_0_14px_rgba(0,217,255,0.18)]'
                    : 'text-white/70 hover:text-white hover:bg-[#13131A]'
                  }
                `}
              >
                <span className="hidden lg:inline">{item.name}</span>
                <span className="lg:hidden">{item.shortName}</span>
                {/* Active underline glow */}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-brand-cyan rounded-full shadow-[0_0_8px_rgba(0,217,255,0.7)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ============================================
            CENTER-RIGHT: Omni-Tray Trigger (ONLY search affordance)
            ============================================ */}
        <div className="flex-shrink-0 w-64 xl:w-72">
          <button
            onClick={() => setOmniTrayOpen(true)}
            className="w-full flex items-center px-3 py-1.5 rounded-full bg-[#13131A] border border-[#1A1A24] hover:border-[#2A2A36] hover:bg-[#16161F] transition-all duration-200 group"
            aria-label="Open Omni-Tray"
          >
            {/* AI chat icon (not a search magnifier) */}
            <svg className="w-4 h-4 text-white/50 flex-shrink-0 group-hover:text-brand-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="flex-1 text-left text-sm text-white/55 group-hover:text-white/75 ml-2.5 truncate">
              Ask Pravado…
            </span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-white/45 bg-[#1A1A24] rounded group-hover:bg-[#22222D] group-hover:text-white/65">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          </button>
        </div>

        {/* ============================================
            RIGHT CLUSTER: AI Status + Chips + Notif + User
            ============================================ */}
        <div className="flex items-center gap-1.5">
          {/* AI Active Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_6px_rgba(0,217,255,0.8)]" />
            <span className="text-[11px] font-semibold text-brand-cyan uppercase tracking-wide">AI Active</span>
          </div>

          {/* Context Toggle Chips */}
          <div className="hidden xl:flex items-center gap-1">
            {contextChips.map((chip) => {
              const isChipActive = activeChips.has(chip.id);
              return (
                <button
                  key={chip.id}
                  onClick={() => toggleChip(chip.id)}
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium
                    transition-all duration-200 border
                    ${isChipActive
                      ? chip.color === 'brand-magenta'
                        ? 'bg-brand-magenta/12 text-brand-magenta border-brand-magenta/25 shadow-[0_0_8px_rgba(232,121,249,0.12)]'
                        : 'bg-brand-iris/12 text-brand-iris border-brand-iris/25 shadow-[0_0_8px_rgba(168,85,247,0.12)]'
                      : 'bg-transparent text-white/55 border-[#1A1A24] hover:border-[#2A2A36] hover:text-white/80'
                    }
                  `}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isChipActive
                        ? chip.color === 'brand-magenta'
                          ? 'bg-brand-magenta'
                          : 'bg-brand-iris'
                        : 'bg-white/35'
                    }`}
                  />
                  {chip.label}
                </button>
              );
            })}
          </div>

          {/* Notifications */}
          <button className="relative p-1.5 text-white/55 hover:text-white hover:bg-[#1A1A24] rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {/* Notification badge */}
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-magenta shadow-[0_0_4px_rgba(232,121,249,0.6)]" />
          </button>

          {/* User Menu */}
          <button className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-[#1A1A24] transition-colors group">
            {userAvatarUrl ? (
              <img
                src={userAvatarUrl}
                alt={userName}
                className="w-7 h-7 rounded-full ring-2 ring-[#1A1A24]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-iris to-brand-magenta flex items-center justify-center text-white text-xs font-bold ring-2 ring-[#1A1A24]">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
            <svg className="w-3 h-3 text-white/45 group-hover:text-white/75 hidden sm:block transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </header>

      {/* ============================================
          Omni-Tray Modal
          ============================================ */}
      {omniTrayOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setOmniTrayOpen(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-xl mx-4 bg-[#0D0D12] border border-[#1A1A24] rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1A1A24]">
              <div className="w-8 h-8 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-semibold text-white/95">Omni-Tray</h2>
                <p className="text-xs text-white/50">AI-powered command interface</p>
              </div>
              <button
                onClick={() => setOmniTrayOpen(false)}
                className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-brand-cyan/20 to-brand-iris/20 border border-brand-cyan/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white/95 mb-2">Omni-Tray (Coming Next)</h3>
              <p className="text-sm text-white/55 max-w-sm mx-auto">
                Your AI-powered command interface for search, navigation, and intelligent actions across all Pravado surfaces.
              </p>
            </div>

            {/* Footer hint */}
            <div className="px-4 py-3 border-t border-[#1A1A24] bg-[#0A0A0F]">
              <p className="text-xs text-white/35 text-center">
                Press <kbd className="px-1 py-0.5 bg-[#1A1A24] rounded text-white/50">Esc</kbd> to close
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CommandCenterTopbar;
