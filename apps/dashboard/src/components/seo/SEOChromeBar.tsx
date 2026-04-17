'use client';

/**
 * SEO Chrome Bar — Row 1: pillar + SAGE + EVI + mode switcher
 *                  Row 2: five-tab navigation
 * Pillar accent: brand-teal. DS v3.1 tokens.
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lightning, TrendUp, CaretDown, User, Robot, Cpu } from '@phosphor-icons/react';
import { useSEOMode, type AutomationMode } from './SEOModeContext';
import { InfoTooltip } from '@/components/shared/InfoTooltip';

const TABS = [
  { label: 'Overview',        href: '/app/seo' },
  { label: 'Topics',          href: '/app/seo/topics' },
  { label: 'Competitors',     href: '/app/seo/competitors' },
  { label: 'Citations',       href: '/app/seo/citations' },
  { label: 'Recommendations', href: '/app/seo/recommendations' },
];

function tabActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/app/seo') return pathname === '/app/seo';
  return pathname.startsWith(href);
}

const MODE_CONFIG: Record<AutomationMode, { label: string; description: string; Icon: React.ElementType; iconClass: string; badge: string }> = {
  manual:    { label: 'Manual',    description: 'You control every action',              Icon: User,  iconClass: 'text-white/50',   badge: 'bg-slate-4 text-white/70' },
  copilot:   { label: 'Copilot',   description: 'AI suggests, you approve',              Icon: Robot, iconClass: 'text-brand-teal', badge: 'bg-brand-teal/15 text-brand-teal' },
  autopilot: { label: 'Autopilot', description: 'AI executes, you review exceptions',    Icon: Cpu,   iconClass: 'text-brand-iris', badge: 'bg-brand-iris/15 text-brand-iris' },
};

function ModeSwitcher() {
  const { mode, setMode } = useSEOMode();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cfg = MODE_CONFIG[mode];
  const ModeIcon = cfg.Icon;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-3 border border-slate-4 hover:border-slate-5 transition-colors"
      >
        <ModeIcon size={14} className={cfg.iconClass} />
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>{cfg.label}</span>
        <CaretDown size={12} className={`text-white/40 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-slate-2 border border-slate-4 rounded-2xl shadow-elev-3 z-50 overflow-hidden" style={{ maxWidth: 'calc(100vw - 2rem)' }}>
          {(Object.entries(MODE_CONFIG) as [AutomationMode, typeof MODE_CONFIG[AutomationMode]][]).map(([key, c]) => {
            const Icon = c.Icon;
            const active = mode === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setMode(key); setOpen(false); }}
                className={`w-full flex items-start gap-3 px-4 py-3 transition-colors text-left ${active ? 'bg-slate-3' : 'hover:bg-slate-3/50'}`}
              >
                <Icon size={16} className={`mt-0.5 flex-shrink-0 ${c.iconClass}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{c.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />}
                  </div>
                  <p className="text-xs text-white/45 mt-0.5">{c.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const RANGES = ['7d', '30d', '60d', '90d'] as const;
type Range = typeof RANGES[number];

export function SEOChromeBar() {
  const pathname = usePathname();
  const { mode } = useSEOMode();
  const [range, setRange] = useState<Range>('30d');
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
    <div className="border-b border-slate-4 bg-slate-1 flex-shrink-0">
      {/* Row 1 */}
      <div className="flex items-center justify-between px-6 h-12 gap-4">
        {/* Pillar + SAGE */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-teal shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">SEO / AEO</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/25">
            <Lightning size={10} weight="fill" className="text-brand-teal" />
            <span className="text-[11px] font-bold tracking-wider text-brand-teal uppercase">SAGE&trade; ACTIVE</span>
          </div>
        </div>

        {/* EVI */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">EVI</span>
          <span className="text-[15px] font-bold text-white tabular-nums">{(evi?.score ?? 0).toFixed(1)}</span>
          <span className="flex items-center gap-0.5 text-[12px] font-semibold text-semantic-success">
            <TrendUp size={12} weight="bold" />
            {(evi?.delta ?? 0) >= 0 ? '+' : ''}{(evi?.delta ?? 0).toFixed(1)}
          </span>
          <InfoTooltip content="EVI measures your brand's visibility in AI-generated answers. SEO/AEO directly impacts this through content optimization, citation building, and Share of Voice across AI engines." size={13} />
        </div>

        {/* Right side: date range (non-autopilot) + mode switcher */}
        <div className="flex items-center gap-3">
          {mode !== 'autopilot' && (
            <div className="flex bg-slate-3 rounded-xl p-0.5">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                    range === r ? 'bg-slate-4 text-white' : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <ModeSwitcher />
        </div>
      </div>

      {/* Row 2: tabs */}
      <div className="flex items-end gap-1 px-6">
        {TABS.map((tab) => {
          const active = tabActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative px-3 pb-2.5 pt-1.5 text-[13px] font-medium transition-colors whitespace-nowrap ${
                active ? 'text-white' : 'text-white/45 hover:text-white/70'
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-brand-teal shadow-[0_0_6px_rgba(0,217,255,0.5)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
