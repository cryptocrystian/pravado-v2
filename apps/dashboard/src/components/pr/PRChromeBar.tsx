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

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import {
  Lightning,
  Lock,
  User,
  CaretDown,
  TrendUp,
} from '@phosphor-icons/react';
import { usePRMode, type AutomationMode } from './PRModeContext';
import { InfoTooltip } from '@/components/shared/InfoTooltip';

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
    description: 'You pitch, track, and manage',
    icon: <Lock className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-slate-4 border-slate-5 text-white/70',
    dot: 'bg-white/40',
  },
  copilot: {
    label: 'Copilot',
    description: 'SAGE recommends, you decide',
    icon: <User className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-brand-magenta/10 border-brand-magenta/30 text-brand-magenta',
    dot: 'bg-brand-magenta',
  },
  autopilot: {
    label: 'Autopilot',
    description: 'SAGE executes within constraints',
    icon: <Lightning className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-brand-iris/10 border-brand-iris/30 text-brand-iris',
    dot: 'bg-brand-iris',
  },
};

// ============================================
// MODE SWITCHER
// ============================================

function ModeSwitcher() {
  const { mode, setMode } = usePRMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = MODE_CONFIG[mode];

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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
        <div className="absolute right-0 top-full mt-1.5 w-[260px] bg-slate-2 border border-slate-4 rounded-xl shadow-elev-3 z-50 overflow-hidden">
          {(Object.entries(MODE_CONFIG) as [AutomationMode, typeof MODE_CONFIG[AutomationMode]][]).map(
            ([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setOpen(false); }}
                className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-3 transition-colors ${
                  mode === key ? 'bg-slate-3' : ''
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border ${cfg.pill}`}>
                  {cfg.icon}
                </div>
                <div>
                  <div className="text-[13px] font-semibold text-white/90">{cfg.label}</div>
                  <div className="text-[12px] text-white/50 mt-0.5">{cfg.description}</div>
                </div>
                {mode === key && (
                  <div className={`ml-auto mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${cfg.dot}`} />
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
// MAIN CHROME BAR
// ============================================

export function PRChromeBar() {
  const pathname = usePathname();
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
            <Lightning className="w-3 h-3 text-brand-magenta/70" weight="fill" />
            <span className="text-[11px] font-semibold text-brand-magenta/80 tracking-wide">
              SAGE&trade; ACTIVE
            </span>
          </div>
        </div>

        {/* Center: EVI metric */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/35">EVI</span>
            <span className="text-[15px] font-bold text-white/90">{(evi?.score ?? 0).toFixed(1)}</span>
            <div className="flex items-center gap-1 text-semantic-success">
              <TrendUp className="w-3 h-3" weight="bold" />
              <span className="text-[12px] font-semibold">{(evi?.delta ?? 0) >= 0 ? '+' : ''}{(evi?.delta ?? 0).toFixed(1)}</span>
            </div>
          </div>
          <InfoTooltip content="EVI (Earned Visibility Index) measures your brand's presence in AI-generated answers. PR placements that get cited by AI engines directly increase your EVI score." size={14} />
        </div>

        {/* Right: Mode switcher */}
        <ModeSwitcher />
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
