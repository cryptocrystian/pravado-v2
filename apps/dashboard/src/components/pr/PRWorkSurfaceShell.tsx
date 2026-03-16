'use client';

/**
 * PR Work Surface Shell — DS v3.1
 *
 * Chrome bar + ModeSwitcher for the PR pillar.
 * Replaces the old PRTabBar with a full 48px chrome bar
 * matching the Content surface pattern.
 *
 * Differences from ContentWorkSurfaceShell:
 * - Route-based tabs (Next.js file-system routing, not view state)
 * - Pillar accent: brand-cyan (PR) vs brand-iris (Content)
 * - Provides PRModeContext so child pages can read mode state
 * - No creation overlay (pitch creation lives in /pitches/new)
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tray,
  Users,
  PaperPlaneTilt,
  Newspaper,
  Brain,
  Lock,
  User,
  Lightning,
  CaretDown,
  CheckCircle,
  TrendUp,
  ClockCounterClockwise,
  MegaphoneSimple,
  Plus,
} from '@phosphor-icons/react';

import { PRModeContext, type AutomationMode as PRAutomationMode } from './PRModeContext';
import { modeTokens } from '@/components/content/tokens';

// ============================================
// TAB CONFIG
// ============================================

interface PRTabConfig {
  key: string;
  label: string;
  autopilotLabel?: string;
  href: string;
  icon: ReactNode;
  /** Hide in autopilot mode */
  hideInAutopilot?: boolean;
}

const PR_TABS: PRTabConfig[] = [
  {
    key: 'action-queue',
    label: 'Action Queue',
    autopilotLabel: 'Exceptions',
    href: '/app/pr',
    icon: <Tray className="w-4 h-4" weight="regular" />,
  },
  {
    key: 'journalists',
    label: 'Journalists',
    href: '/app/pr/journalists',
    icon: <Users className="w-4 h-4" weight="regular" />,
  },
  {
    key: 'pitches',
    label: 'Pitches',
    href: '/app/pr/pitches',
    icon: <PaperPlaneTilt className="w-4 h-4" weight="regular" />,
    hideInAutopilot: true,
  },
  {
    key: 'coverage',
    label: 'Coverage',
    href: '/app/pr/coverage',
    icon: <Newspaper className="w-4 h-4" weight="regular" />,
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    href: '/app/pr/intelligence',
    icon: <Brain className="w-4 h-4" weight="regular" />,
  },
];

// ============================================
// MODE ICON
// ============================================

function ModeIcon({ mode }: { mode: PRAutomationMode }) {
  if (mode === 'manual') return <Lock className="w-3.5 h-3.5" weight="regular" />;
  if (mode === 'copilot') return <User className="w-3.5 h-3.5" weight="regular" />;
  return <Lightning className="w-3.5 h-3.5" weight="regular" />;
}

// ============================================
// SHELL COMPONENT
// ============================================

interface PRWorkSurfaceShellProps {
  children: ReactNode;
}

export function PRWorkSurfaceShell({ children }: PRWorkSurfaceShellProps) {
  const pathname = usePathname();
  const [mode, setMode] = useState<PRAutomationMode>('copilot');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const modeDropdownRef = useRef<HTMLDivElement>(null);

  const currentModeTokens = modeTokens[mode];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modeDropdownRef.current && !modeDropdownRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === '/app/pr') return pathname === '/app/pr';
    return pathname.startsWith(href);
  }

  const visibleTabs = PR_TABS.filter(
    (tab) => !(mode === 'autopilot' && tab.hideInAutopilot)
  );

  return (
    <PRModeContext.Provider value={{ mode, setMode }}>
      {/* Chrome bar — 48px, DS v3.1 */}
      <div className="flex items-center h-12 px-4 border-b border-border-subtle bg-slate-1 shrink-0 relative z-[60]">

        {/* Left cluster: pillar icon + title + divider + tabs */}
        <MegaphoneSimple className="w-5 h-5 text-brand-cyan shrink-0" weight="regular" />
        <span className="text-sm font-semibold text-white/80 ml-2 shrink-0">PR Hub</span>
        <div className="w-px h-4 bg-white/10 mx-3 shrink-0" />

        {/* Route-based tabs */}
        {visibleTabs.map((tab) => {
          const active = isActive(tab.href);
          const label = mode === 'autopilot' && tab.autopilotLabel
            ? tab.autopilotLabel
            : tab.label;

          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`group flex items-center gap-1.5 px-3 h-full text-sm font-medium transition-all relative ${
                active
                  ? 'text-white/95'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <span className={active ? 'text-brand-cyan' : 'text-white/40 group-hover:text-white/60'}>
                {tab.icon}
              </span>
              {label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-t shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
              )}
            </Link>
          );
        })}

        {/* Activity Log tab — Autopilot only */}
        {mode === 'autopilot' && (() => {
          const active = pathname?.startsWith('/app/pr/activity');
          return (
            <Link
              href="/app/pr/activity"
              className={`group flex items-center gap-1.5 px-3 h-full text-sm font-medium transition-all relative ${
                active ? 'text-white/95' : 'text-white/50 hover:text-white/80'
              }`}
            >
              <span className={active ? 'text-brand-cyan' : 'text-white/40 group-hover:text-white/60'}>
                <ClockCounterClockwise className="w-4 h-4" weight="regular" />
              </span>
              Activity Log
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-cyan rounded-t shadow-[0_0_8px_rgba(0,212,255,0.4)]" />
              )}
            </Link>
          );
        })()}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right cluster: SAGE tag + EVI + Mode + Create */}
        <div className="flex items-center gap-2 shrink-0">

          {/* SAGE opportunity tag */}
          <div className="flex items-center gap-1.5">
            <Lightning className="w-3.5 h-3.5 text-brand-cyan shrink-0" weight="fill" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan max-w-[220px] truncate">
              Earned media opportunity: AI citation coverage
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />

          {/* EVI indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mr-1">EVI</span>
            <span className="text-sm font-bold tabular-nums text-brand-cyan">42.7</span>
            <span className="text-xs text-semantic-success flex items-center gap-0.5">
              <TrendUp className="w-3 h-3" weight="bold" />
              +2.4
            </span>
          </div>
          <div className="w-px h-4 bg-white/10" />

          {/* Mode switcher */}
          <div className="relative" ref={modeDropdownRef}>
            <button
              type="button"
              onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-bold uppercase tracking-wider transition-colors ${currentModeTokens.bg} ${currentModeTokens.text} ${currentModeTokens.border}`}
            >
              <ModeIcon mode={mode} />
              {currentModeTokens.label}
              <CaretDown className="w-3 h-3" weight="regular" />
            </button>

            {isModeDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-2 border border-slate-4 rounded-lg shadow-elev-3 py-1 z-[200]">
                {(['manual', 'copilot', 'autopilot'] as PRAutomationMode[]).map((m) => {
                  const tokens = modeTokens[m];
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => {
                        setMode(m);
                        setIsModeDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-white/5 transition-colors ${
                        m === mode ? tokens.text : 'text-white/70'
                      }`}
                    >
                      <ModeIcon mode={m} />
                      <span className="font-medium">{tokens.label}</span>
                      {m === mode && (
                        <CheckCircle className="w-4 h-4 ml-auto" weight="fill" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create pitch — Manual always, Copilot outside action-queue */}
          {(mode === 'manual' || (mode === 'copilot' && !isActive('/app/pr') )) && (
            <Link
              href="/app/pr/pitches/new"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-lg transition-all duration-150 ${
                mode === 'manual'
                  ? 'bg-brand-cyan text-slate-0 hover:bg-brand-cyan/90 shadow-[0_0_14px_rgba(0,212,255,0.3)]'
                  : 'border border-white/15 text-white/60 hover:border-white/25 hover:bg-white/5'
              }`}
            >
              <Plus className="w-3.5 h-3.5" weight="regular" />
              New Pitch
            </Link>
          )}
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        {children}
      </div>
    </PRModeContext.Provider>
  );
}
