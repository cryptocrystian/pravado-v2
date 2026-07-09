'use client';

/**
 * SEO Chrome Bar — Row 1: pillar + SAGE + EVI + mode switcher
 *                  Row 2: five-tab navigation
 * Pillar accent: brand-teal. DS v3.1 tokens.
 */

import { Lightning, TrendUp } from '@phosphor-icons/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

import { InfoTooltip } from '@/components/shared/InfoTooltip';
import { ModeSwitcher } from '@/components/shared/ModeSwitcher';
import { useMode } from '@/lib/ModeContext';

const TABS = [
  { label: 'Overview', href: '/app/seo' },
  { label: 'Topics', href: '/app/seo/topics' },
  { label: 'Competitors', href: '/app/seo/competitors' },
  { label: 'Citations', href: '/app/seo/citations' },
  { label: 'Recommendations', href: '/app/seo/recommendations' },
];

function tabActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  if (href === '/app/seo') return pathname === '/app/seo';
  return pathname.startsWith(href);
}

const RANGES = ['7d', '30d', '60d', '90d'] as const;
type Range = (typeof RANGES)[number];

export function SEOChromeBar() {
  const pathname = usePathname();
  const { mode } = useMode('seo');
  const [range, setRange] = useState<Range>('30d');
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
    <div className="border-b border-slate-4 bg-slate-1 flex-shrink-0">
      {/* Row 1 */}
      <div className="flex items-center justify-between px-6 h-12 gap-4">
        {/* Pillar + SAGE */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-teal shadow-[0_0_6px_rgba(0,217,255,0.6)]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              SEO / AEO
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-brand-teal/10 border border-brand-teal/25">
            <Lightning size={10} weight="fill" className="text-brand-teal" />
            <span className="text-[11px] font-bold tracking-wider text-brand-teal uppercase">
              SAGE&trade; ACTIVE
            </span>
          </div>
        </div>

        {/* EVI */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            EVI
          </span>
          <span className="text-[15px] font-bold text-white tabular-nums">
            {(evi?.score ?? 0).toFixed(1)}
          </span>
          <span className="flex items-center gap-0.5 text-[12px] font-semibold text-semantic-success">
            <TrendUp size={12} weight="bold" />
            {(evi?.delta ?? 0) >= 0 ? '+' : ''}
            {(evi?.delta ?? 0).toFixed(1)}
          </span>
          <InfoTooltip
            content="EVI measures your brand's visibility in AI-generated answers. SEO/AEO directly impacts this through content optimization, citation building, and Share of Voice across AI engines."
            size={13}
          />
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
                    range === r
                      ? 'bg-slate-4 text-white'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}
          <ModeSwitcher pillar="seo" compact />
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
