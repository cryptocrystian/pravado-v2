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
 * CommandCenterTopbar - DS v3 Topbar for Command Center
 *
 * AI-native, topbar-centric navigation replacing legacy sidebar.
 * Features:
 * - Left: Pravado wordmark + status dot, Org selector
 * - Center: Search input (pill style, subtle glow on focus)
 * - Right: AI Active indicator, context toggle chips, notifications, user menu
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useState } from 'react';
import Link from 'next/link';

interface CommandCenterTopbarProps {
  orgName?: string;
  userName?: string;
  userAvatarUrl?: string;
}

export function CommandCenterTopbar({
  orgName = 'Pravado Test 01',
  userName = 'User',
  userAvatarUrl,
}: CommandCenterTopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
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

  return (
    <header className="sticky top-0 z-50 h-16 bg-[#0A0A0F]/95 backdrop-blur-xl border-b border-[#1A1A24] flex items-center px-4 gap-4">
      {/* Left Cluster: Logo + Org Selector */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Pravado Wordmark + AI Status */}
        <Link href="/app/command-center" className="flex items-center gap-2 flex-shrink-0">
          <span className="text-lg font-bold bg-gradient-to-r from-brand-cyan via-brand-iris to-brand-magenta bg-clip-text text-transparent">
            Pravado
          </span>
          <span className="w-2 h-2 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_8px_rgba(0,217,255,0.6)]" />
        </Link>

        {/* Org Selector (compact topbar variant) */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#13131A] border border-[#1A1A24] hover:border-[#2A2A36] transition-colors group">
          <div className="w-5 h-5 rounded bg-brand-iris/20 flex items-center justify-center text-brand-iris text-[10px] font-bold">
            {orgName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs font-medium text-slate-5 group-hover:text-white transition-colors truncate max-w-[120px]">
            {orgName}
          </span>
          <svg className="w-3 h-3 text-slate-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Center: Search Input */}
      <div className="flex-1 max-w-md mx-auto">
        <div
          className={`
            relative flex items-center px-4 py-2 rounded-full
            bg-[#13131A] border transition-all duration-200
            ${searchFocused
              ? 'border-brand-cyan/50 shadow-[0_0_20px_rgba(0,217,255,0.15)]'
              : 'border-[#1A1A24] hover:border-[#2A2A36]'
            }
          `}
        >
          <svg className="w-4 h-4 text-slate-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent border-none text-sm text-white placeholder-slate-5 focus:outline-none ml-3"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-[10px] text-slate-5 bg-[#1A1A24] rounded">
            <span>⌘</span>
            <span>K</span>
          </kbd>
        </div>
      </div>

      {/* Right Cluster: AI Status + Chips + Notifications + User */}
      <div className="flex items-center gap-3">
        {/* AI Active Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse shadow-[0_0_6px_rgba(0,217,255,0.8)]" />
          <span className="text-[10px] font-medium text-brand-cyan uppercase tracking-wide">AI Active</span>
        </div>

        {/* Context Toggle Chips */}
        <div className="hidden lg:flex items-center gap-1.5">
          {contextChips.map((chip) => {
            const isActive = activeChips.has(chip.id);
            return (
              <button
                key={chip.id}
                onClick={() => toggleChip(chip.id)}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium
                  transition-all duration-200 border
                  ${isActive
                    ? chip.color === 'brand-magenta'
                      ? 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30'
                      : 'bg-brand-iris/15 text-brand-iris border-brand-iris/30'
                    : 'bg-transparent text-slate-5 border-[#1A1A24] hover:border-[#2A2A36] hover:text-white'
                  }
                `}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isActive
                      ? chip.color === 'brand-magenta'
                        ? 'bg-brand-magenta'
                        : 'bg-brand-iris'
                      : 'bg-slate-5'
                  }`}
                />
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-slate-5 hover:text-white hover:bg-[#1A1A24] rounded-lg transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {/* Notification badge */}
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-magenta" />
        </button>

        {/* User Menu */}
        <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#1A1A24] transition-colors">
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
          <svg className="w-3 h-3 text-slate-5 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
    </header>
  );
}

export default CommandCenterTopbar;
