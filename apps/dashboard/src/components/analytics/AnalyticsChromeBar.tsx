'use client';

/**
 * AnalyticsChromeBar — DS v3.1
 *
 * Row 1: Analytics pillar indicator · SAGE ACTIVE tag · EVI metric · ModeSwitcher · date range · info
 * Row 2: Tab navigation (Overview / Content / PR / SEO / Reports)
 *
 * Analytics accent: brand-cyan (Command Center orbit).
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 * @see /docs/canon/ANALYTICS_CONTRACT.md
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Lightning, TrendUp, Info, Lock, User, CaretDown } from '@phosphor-icons/react';
import { useAnalyticsMode, type AnalyticsMode } from './AnalyticsModeContext';
import { useAnalyticsDate, DATE_RANGES } from './AnalyticsDateContext';

// ============================================
// TAB CONFIG
// ============================================

const TABS = [
  { label: 'Overview',  href: '/app/analytics' },
  { label: 'Content',   href: '/app/analytics/content' },
  { label: 'PR',        href: '/app/analytics/pr' },
  { label: 'SEO',       href: '/app/analytics/seo' },
  { label: 'Reports',   href: '/app/analytics/reports' },
];

// ============================================
// MODE CONFIG
// ============================================

const MODE_CONFIG: Record<AnalyticsMode, {
  label: string;
  description: string;
  icon: React.ReactNode;
  pill: string;
  dot: string;
}> = {
  manual: {
    label: 'Manual',
    description: 'Pull reports yourself',
    icon: <Lock className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-slate-4 border-slate-5 text-white/70',
    dot: 'bg-white/40',
  },
  copilot: {
    label: 'Copilot',
    description: 'SAGE surfaces insights',
    icon: <User className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan',
    dot: 'bg-brand-cyan',
  },
  autopilot: {
    label: 'Autopilot',
    description: 'Auto-generated reports',
    icon: <Lightning className="w-3.5 h-3.5" weight="regular" />,
    pill: 'bg-brand-iris/10 border-brand-iris/30 text-brand-iris',
    dot: 'bg-brand-iris',
  },
};

// ============================================
// MODE SWITCHER
// ============================================

function ModeSwitcher() {
  const { mode, setMode } = useAnalyticsMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = MODE_CONFIG[mode];

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
        <div className="absolute right-0 top-full mt-1.5 w-[240px] bg-slate-2 border border-slate-4 rounded-xl shadow-elev-3 z-50 overflow-hidden">
          {(Object.entries(MODE_CONFIG) as [AnalyticsMode, typeof MODE_CONFIG[AnalyticsMode]][]).map(
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

export function AnalyticsChromeBar() {
  const pathname = usePathname();
  const { range, setRange, comparisonEnabled, setComparisonEnabled } = useAnalyticsDate();
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
    if (href === '/app/analytics') return pathname === '/app/analytics';
    return pathname.startsWith(href);
  }

  return (
    <div className="border-b border-slate-4 bg-slate-0 shrink-0">

      {/* ── Row 1: Chrome bar ─────────────────────── */}
      <div className="flex items-center justify-between px-8 h-12 border-b border-slate-4/60">

        {/* Left: Pillar indicator + SAGE tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
            <span className="text-[12px] font-bold uppercase tracking-widest text-white/40">
              Analytics
            </span>
          </div>
          <div className="w-px h-3.5 bg-white/10" />
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-brand-cyan/8 border border-brand-cyan/15">
            <Lightning className="w-3 h-3 text-brand-cyan/70" weight="fill" />
            <span className="text-[11px] font-semibold text-brand-cyan/80 tracking-wide">
              SAGE ACTIVE
            </span>
          </div>
        </div>

        {/* Center: EVI metric */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/35">EVI</span>
            <span className="text-[15px] font-bold text-white/90">{(evi?.score ?? 0).toFixed(1)}</span>
            <div className={`flex items-center gap-1 ${(evi?.delta ?? 0) >= 0 ? 'text-semantic-success' : 'text-semantic-danger'}`}>
              <TrendUp className="w-3 h-3" weight="bold" />
              <span className="text-[12px] font-semibold">{(evi?.delta ?? 0) >= 0 ? '+' : ''}{(evi?.delta ?? 0).toFixed(1)}</span>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg hover:bg-slate-3 transition-colors"
            title="About Analytics"
          >
            <Info className="w-4 h-4 text-white/35 hover:text-white/60 transition-colors" weight="regular" />
          </button>
        </div>

        {/* Right: Mode switcher + Date range */}
        <div className="flex items-center gap-3">
          <ModeSwitcher />
          <div className="w-px h-5 bg-white/10" />
          <div className="flex items-center gap-1.5 bg-slate-3 rounded-lg border border-slate-4 p-0.5">
            {DATE_RANGES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all duration-150 ${
                  range === r
                    ? 'bg-slate-2 text-white/90 shadow-sm'
                    : 'text-white/45 hover:text-white/70'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setComparisonEnabled(!comparisonEnabled)}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all duration-150 ${
              comparisonEnabled
                ? 'bg-brand-cyan/10 border-brand-cyan/30 text-brand-cyan'
                : 'bg-slate-3 border-slate-4 text-white/40 hover:text-white/60'
            }`}
          >
            vs prior
          </button>
        </div>
      </div>

      {/* ── Row 2: Tab navigation ─────────────────── */}
      <div className="flex items-center gap-1 px-8">
        {TABS.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-3 py-3 text-[14px] font-medium transition-all duration-150 border-b-2 whitespace-nowrap ${
                active
                  ? 'border-brand-cyan text-white shadow-[0_1px_0_0_rgba(0,217,255,0.4)]'
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
