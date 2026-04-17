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

import { useRef, useState, useEffect } from 'react';
import {
  Lightning,
  Lock,
  Robot,
  Cpu,
  CaretDown,
  TrendUp,
  Info,
} from '@phosphor-icons/react';
import { useCalendarMode, type AutomationMode } from './CalendarModeContext';
import type { CalendarViewMode } from './types';

// ============================================
// MODE CONFIG
// ============================================

const MODE_CONFIG: Record<AutomationMode, {
  label: string;
  description: string;
  icon: React.ReactNode;
  pill: string;
  dot: string;
}> = {
  manual: {
    label: 'Manual',
    description: 'You control every action',
    icon: <Lock className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-slate-4 border-slate-5 text-white/70',
    dot: 'bg-white/40',
  },
  copilot: {
    label: 'Copilot',
    description: 'AI suggests, you approve',
    icon: <Robot className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan',
    dot: 'bg-brand-cyan',
  },
  autopilot: {
    label: 'Autopilot',
    description: 'AI executes, you review exceptions',
    icon: <Cpu className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-brand-iris/10 border-brand-iris/30 text-brand-iris',
    dot: 'bg-brand-iris',
  },
};

const VIEW_MODES: { key: CalendarViewMode; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
];

// ============================================
// MODE SWITCHER
// ============================================

function ModeSwitcher() {
  const { mode, setMode } = useCalendarMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = MODE_CONFIG[mode];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[13px] font-medium transition-all duration-150 ${cfg.pill}`}
      >
        {cfg.icon}
        <span>{cfg.label}</span>
        <CaretDown className="w-3 h-3 opacity-60" weight="bold" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 bg-slate-2 border border-slate-4 rounded-xl shadow-elev-3 z-50 overflow-hidden"
          style={{ width: 260, maxWidth: 'calc(100vw - 2rem)' }}
        >
          {(Object.entries(MODE_CONFIG) as [AutomationMode, typeof MODE_CONFIG[AutomationMode]][]).map(
            ([key, c]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setOpen(false); }}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-3 transition-colors ${
                  mode === key ? 'bg-slate-3' : ''
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border ${c.pill}`}>
                  {c.icon}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white/90">{c.label}</div>
                  <div className="text-[12px] text-white/50 mt-0.5">{c.description}</div>
                </div>
                {mode === key && (
                  <div className={`ml-auto mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${c.dot}`} />
                )}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

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
      .then(r => r.json())
      .then(d => {
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/35">EVI</span>
            <span className="text-[15px] font-bold text-white/90">{(evi?.score ?? 0).toFixed(1)}</span>
            <div className="flex items-center gap-1 text-semantic-success">
              <TrendUp className="w-3 h-3" weight="bold" />
              <span className="text-[12px] font-semibold">{(evi?.delta ?? 0) >= 0 ? '+' : ''}{(evi?.delta ?? 0).toFixed(1)}</span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-3 transition-colors"
            title="About Calendar"
          >
            <Info className="w-4 h-4 text-white/35 hover:text-white/60 transition-colors" weight="regular" />
          </button>
        </div>

        {/* Right: View toggle + Mode switcher */}
        <div className="flex items-center gap-3">
          <ViewToggle />
          <ModeSwitcher />
        </div>
      </div>
    </div>
  );
}
