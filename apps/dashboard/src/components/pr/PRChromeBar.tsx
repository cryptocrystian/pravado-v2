'use client';

/**
 * PR Chrome Bar — DS v3.1
 *
 * Unified surface header for the PR pillar.
 * Row 1: Pillar indicator · EVI metric · SAGE tag · Mode switcher
 * Row 2: Tab navigation (Action Queue / Journalists / Pitches / Coverage / Intelligence)
 *
 * Pillar accent: brand-magenta
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 */

import { Lightning, TrendUp } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { ModeSwitcher } from '@/components/shared/ModeSwitcher';

// ============================================
// TAB CONFIG
// ============================================

const TABS = [
  { label: 'Action Queue', href: '/app/pr' },
  { label: 'Journalists', href: '/app/pr/journalists' },
  { label: 'Pitches', href: '/app/pr/pitches' },
  { label: 'Coverage', href: '/app/pr/coverage' },
  { label: 'Intelligence', href: '/app/pr/intelligence' },
];

// ============================================
// MAIN CHROME BAR
// ============================================

export function PRChromeBar() {
  const pathname = usePathname();
  const [evi, setEvi] = useState<{ score: number; delta: number } | null>(null);

  useEffect(() => {
    fetch('/api/command-center/strategy-panel')
      .then((r) => r.json())
      .then((d) => {
        if (d.success !== false && d.evi) {
          setEvi({ score: d.evi.score, delta: d.evi.delta_7d });
        }
      })
      .catch(() => {});
  }, []);

  function isActive(href: string) {
    if (!pathname) return false;
    if (href === '/app/pr') return pathname === '/app/pr';
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-slate-4 bg-slate-0 shrink-0">
      {/* ── Row 1: Chrome Bar ───────────────────────── */}
      <div className="flex items-center justify-between px-8 h-12 border-b border-slate-4/60">
        {/* Left: Pillar indicator + SAGE tag */}
        <div className="flex items-center gap-3">
          {/* Pillar dot + label */}
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-magenta" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/40">
              PR
            </span>
          </div>

          {/* Divider */}
          <div className="w-px h-3.5 bg-white/10" />

          {/* SAGE tag — contextual trigger */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-magenta/8 border border-brand-magenta/15">
            <Lightning
              className="w-3 h-3 text-brand-magenta/70"
              weight="fill"
            />
            <span className="text-[11px] font-semibold text-brand-magenta/80 tracking-wide">
              SAGE&trade; ACTIVE
            </span>
          </div>
        </div>

        {/* Center: EVI metric */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/35">
              EVI
            </span>
            <span className="text-[15px] font-bold text-white/90">
              {(evi?.score ?? 0).toFixed(1)}
            </span>
            <div className="flex items-center gap-1 text-semantic-success">
              <TrendUp className="w-3 h-3" weight="bold" />
              <span className="text-[12px] font-semibold">
                {(evi?.delta ?? 0) >= 0 ? '+' : ''}
                {(evi?.delta ?? 0).toFixed(1)}
              </span>
            </div>
          </div>
          <InfoTooltip
            content="EVI (Earned Visibility Index) measures your brand's presence in AI-generated answers. PR placements that get cited by AI engines directly increase your EVI score."
            size={14}
          />
        </div>

        {/* Right: Mode switcher (canonical, pillar-scoped) */}
        <ModeSwitcher pillar="pr" compact />
      </div>

      {/* ── Row 2: Tab navigation ───────────────────── */}
      <div className="flex items-center gap-1 px-8">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-3 text-[14px] font-medium transition-all duration-150 border-b-2 whitespace-nowrap ${
                active
                  ? 'border-brand-magenta text-white'
                  : 'border-transparent text-white/45 hover:text-white/75 hover:border-white/20'
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
