'use client';

/**
 * CalendarChromeBar — DS v3.1
 *
 * Row 1: Calendar pillar indicator · SAGE ACTIVE tag · EVI metric ·
 *        Day/Week/Month view toggle · Mode switcher
 *
 * Calendar is cross-pillar — accent: brand-cyan (Command Center orbit)
 * No tab row 2 — Calendar is a single-surface view.
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 * @see /docs/canon/UX_CONTINUITY_CANON.md
 */

import { Lightning, TrendUp, Info } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

import { useCalendarMode } from './CalendarModeContext';
import type { CalendarViewMode } from './types';

// Calendar is MODE-AGNOSTIC (per-item mode badges only, no pillar mode switcher)
// per ORCHESTRATION_CALENDAR_CONTRACT — the former mode switcher was drift and
// has been removed. Only the Day/Week/Month view toggle remains.

const VIEW_MODES: { key: CalendarViewMode; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

// ============================================
// VIEW MODE TOGGLE
// ============================================

function ViewToggle() {
  const { viewMode, setViewMode } = useCalendarMode();
  return (
    <div className="flex items-center bg-slate-3 rounded-lg border border-slate-4 p-0.5">
      {VIEW_MODES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => setViewMode(key)}
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all duration-150 ${
            viewMode === key
              ? 'bg-slate-2 text-white/90 shadow-sm'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// MAIN CHROME BAR
// ============================================

export function CalendarChromeBar() {
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

  return (
    <div className="border-b border-slate-4 bg-slate-0 shrink-0">
      <div className="flex items-center justify-between px-8 h-12">
        {/* Left: Pillar indicator + SAGE tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/40">
              Calendar
            </span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-cyan/8 border border-brand-cyan/15">
            <Lightning className="w-3 h-3 text-brand-cyan/70" weight="fill" />
            <span className="text-[11px] font-semibold text-brand-cyan/80 tracking-wide">
              SAGE&trade; ACTIVE
            </span>
          </div>
        </div>

        {/* Center: EVI metric + info */}
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
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-3 transition-colors"
            title="About Calendar"
          >
            <Info
              className="w-4 h-4 text-white/35 hover:text-white/60 transition-colors"
              weight="regular"
            />
          </button>
        </div>

        {/* Right: View toggle (Calendar is mode-agnostic — no ModeSwitcher) */}
        <div className="flex items-center gap-3">
          <ViewToggle />
        </div>
      </div>
    </div>
  );
}
