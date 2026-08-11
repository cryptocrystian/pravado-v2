'use client';

/**
 * CompetitorComparison — real DataForSEO-backed competitive intelligence.
 *
 * HONEST DATA: reads /api/seo/competitors (proxying /api/v1/seo/competitors). Only
 * two things are genuinely computed from SERP data and therefore rendered here:
 *   1. Share-of-Voice — each ranking domain's share of tracked-keyword visibility,
 *      the org's own domain highlighted.
 *   2. Competitor positions / topic-delta — per tracked keyword, our best organic
 *      rank vs each competitor's rank, and the delta between them.
 *
 * DELIBERATELY REMOVED (were mock, NOT DataForSEO data, no real source):
 *   - EVI head-to-head cards (per-competitor EVI / best-engine / clusters)
 *   - "competitor content cited more than yours" (per-engine citation counts)
 * These are internal EVI/CiteMind signals computed per competitor, which we do not
 * produce. They are omitted rather than invented — see the honest note below.
 *
 * A new org (or one without DataForSEO credentials + a completed refresh) has no
 * cached SERP rows yet; that renders as an honest empty state, not a bug.
 */

import {
  ChartBar,
  WarningCircle,
  ArrowClockwise,
  Info,
} from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

import { useSeoCompetitors } from '@/hooks/useSeoCompetitors';
import type {
  ShareOfVoiceEntry,
  CompetitorPositionEntry,
} from '@/hooks/useSeoCompetitors';

// Neutral shades for non-owned domains in the Share-of-Voice bar. Deliberately
// meaning-free (no color implies rank/quality) — the org's own domain is the only
// emphasized segment (brand-cyan).
const COMPETITOR_SHADES = [
  'rgba(255,255,255,0.28)',
  'rgba(255,255,255,0.22)',
  'rgba(255,255,255,0.16)',
  'rgba(255,255,255,0.12)',
  'rgba(255,255,255,0.09)',
];

function formatPct(pct: number): string {
  if (!Number.isFinite(pct)) return '0%';
  return `${pct >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10}%`;
}

function rankLabel(rank: number | null): string {
  return rank === null ? 'Not ranking' : `#${rank}`;
}

// ============================================================================
// Share-of-Voice
// ============================================================================

function ShareOfVoiceSection({ entries }: { entries: ShareOfVoiceEntry[] }) {
  // Backend already sorts by score; guard anyway for a stable visual order.
  const sorted = [...entries].sort((a, b) => b.sharePct - a.sharePct);
  let shadeIdx = 0;

  const colored = sorted.map((e) => {
    const fill = e.isOwned
      ? 'var(--brand-cyan)'
      : COMPETITOR_SHADES[shadeIdx++ % COMPETITOR_SHADES.length];
    return { ...e, fill };
  });

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/55 mb-3">
        Share of Voice
      </h3>
      <p className="text-[13px] text-white/50 mb-4 max-w-2xl">
        Each domain&rsquo;s share of your tracked keywords&rsquo; organic
        visibility, weighted by rank position (from cached DataForSEO SERPs).
      </p>

      {/* Segmented share bar */}
      <div className="flex w-full h-3 rounded-full overflow-hidden bg-white/5 mb-5">
        {colored.map((e) => (
          <div
            key={e.domain}
            style={{
              width: `${Math.max(e.sharePct, 0)}%`,
              backgroundColor: e.fill,
            }}
            title={`${e.domain} — ${formatPct(e.sharePct)}`}
          />
        ))}
      </div>

      {/* Legend / list */}
      <div className="bg-panel border border-border-subtle rounded-xl divide-y divide-border-subtle">
        {colored.map((e) => (
          <div
            key={e.domain}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: e.fill }}
              />
              <span className="text-sm text-white/85 font-mono truncate">
                {e.domain}
              </span>
              {e.isOwned && (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 shrink-0">
                  You
                </span>
              )}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <span className="text-xs text-white/45 tabular-nums hidden sm:inline">
                {e.appearances} position{e.appearances === 1 ? '' : 's'}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  e.isOwned ? 'text-brand-cyan' : 'text-white/80'
                }`}
              >
                {formatPct(e.sharePct)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ============================================================================
// Competitor positions / topic-delta
// ============================================================================

interface FlatRow {
  key: string;
  keyword: string;
  showKeyword: boolean;
  ourRank: number | null;
  competitorDomain: string;
  competitorRank: number;
  delta: number | null;
}

function flattenPositions(positions: CompetitorPositionEntry[]): FlatRow[] {
  const rows: FlatRow[] = [];
  for (const pos of positions) {
    if (pos.competitors.length === 0) {
      rows.push({
        key: `${pos.keywordId}-none`,
        keyword: pos.keyword,
        showKeyword: true,
        ourRank: pos.ourRank,
        competitorDomain: '—',
        competitorRank: 0,
        delta: null,
      });
      continue;
    }
    // Best (lowest rank) competitor first.
    const comps = [...pos.competitors].sort((a, b) => a.rank - b.rank);
    comps.forEach((c, i) => {
      rows.push({
        key: `${pos.keywordId}-${c.domain}`,
        keyword: pos.keyword,
        showKeyword: i === 0,
        ourRank: pos.ourRank,
        competitorDomain: c.domain,
        competitorRank: c.rank,
        delta: c.delta,
      });
    });
  }
  return rows;
}

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span className="text-white/30">—</span>;
  }
  if (delta === 0) {
    return <span className="text-white/60 tabular-nums">Tied</span>;
  }
  // delta = ourRank - competitorRank; positive => competitor ranks ahead of us (bad).
  const competitorAhead = delta > 0;
  return (
    <span
      className={`font-semibold tabular-nums ${
        competitorAhead ? 'text-semantic-danger' : 'text-semantic-success'
      }`}
    >
      {competitorAhead ? `${delta} behind` : `${Math.abs(delta)} ahead`}
    </span>
  );
}

function PositionsSection({
  positions,
}: {
  positions: CompetitorPositionEntry[];
}) {
  const rows = flattenPositions(positions);

  return (
    <section>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-white/55 mb-3">
        Competitor Positions
      </h3>
      <p className="text-[13px] text-white/50 mb-4 max-w-2xl">
        For each tracked keyword, your best organic rank vs each competing
        domain&rsquo;s rank, and the gap between them.
      </p>

      <div className="bg-panel border border-border-subtle rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                  Keyword
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                  Your Rank
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                  Competitor
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                  Their Rank
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-white/55 uppercase tracking-wide">
                  Gap
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-border-subtle last:border-0"
                >
                  <td className="px-4 py-3 text-white/85 max-w-[240px] truncate">
                    {row.showKeyword ? row.keyword : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`tabular-nums ${
                        row.ourRank === null
                          ? 'text-white/40'
                          : 'text-brand-cyan font-semibold'
                      }`}
                    >
                      {rankLabel(row.ourRank)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 font-mono text-[13px] max-w-[220px] truncate">
                    {row.competitorDomain}
                  </td>
                  <td className="px-4 py-3 text-white/70 tabular-nums">
                    {row.competitorDomain === '—'
                      ? '—'
                      : `#${row.competitorRank}`}
                  </td>
                  <td className="px-4 py-3">
                    <DeltaCell delta={row.delta} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Refresh control (admin-gated, costed)
// ============================================================================

function RefreshControl({
  isAdmin,
  isRefreshing,
  onRefresh,
}: {
  isAdmin: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
}) {
  if (!isAdmin) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-white/40 hidden md:inline">
        Uses DataForSEO credits (~$0.002 per tracked keyword)
      </span>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium border bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30 hover:bg-brand-cyan/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ArrowClockwise
          size={14}
          className={isRefreshing ? 'animate-spin' : ''}
          weight="bold"
        />
        {isRefreshing ? 'Refreshing…' : 'Refresh competitor data'}
      </button>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export function CompetitorComparison() {
  const {
    shareOfVoice,
    competitorPositions,
    isLoading,
    error,
    isRefreshing,
    refreshError,
    refresh,
  } = useSeoCompetitors();

  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch('/api/admin/overview')
      .then((r) => {
        if (r.ok) setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  const hasData = shareOfVoice.length > 0 || competitorPositions.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white/95 tracking-tight">
            Competitors
          </h2>
          <p className="text-[13px] text-white/55 mt-0.5">
            {isLoading
              ? 'Loading competitor analysis…'
              : 'Share-of-Voice and rank-by-rank positions from tracked-keyword SERPs.'}
          </p>
        </div>
        <RefreshControl
          isAdmin={isAdmin}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
        />
      </div>

      {/* Refresh error (real upstream message) */}
      {refreshError && (
        <div className="bg-panel border border-semantic-danger/20 rounded-xl px-4 py-3 flex items-start gap-2">
          <WarningCircle
            size={16}
            className="text-semantic-danger mt-0.5 shrink-0"
            weight="fill"
          />
          <p className="text-[13px] text-white/70">{refreshError}</p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <div className="h-3 w-full bg-white/5 rounded-full animate-pulse" />
          <div className="bg-panel border border-border-subtle rounded-xl p-4 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-10 w-full bg-white/5 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error — honest, no fake fallback */}
      {!isLoading && error && (
        <div className="bg-panel border border-semantic-danger/20 rounded-xl p-8 flex flex-col items-center justify-center text-center">
          <WarningCircle
            size={26}
            className="text-semantic-danger mb-3"
            weight="fill"
          />
          <p className="text-sm text-white/85 leading-relaxed max-w-md">
            Couldn&rsquo;t load competitor data.
          </p>
          <p className="text-[13px] text-white/50 leading-relaxed max-w-md mt-1">
            {error instanceof Error
              ? error.message
              : 'Please try again shortly.'}
          </p>
        </div>
      )}

      {/* Empty — a new org / no cached SERPs genuinely has nothing yet */}
      {!isLoading && !error && !hasData && (
        <div className="bg-panel border border-border-subtle rounded-xl p-10 flex flex-col items-center justify-center text-center">
          <ChartBar size={28} className="text-white/25 mb-3" weight="fill" />
          <p className="text-sm text-white/85 leading-relaxed max-w-md">
            No competitor data yet.
          </p>
          <p className="text-[13px] text-white/55 leading-relaxed max-w-md mt-1.5">
            Share-of-Voice and competitor positions are built from live SERPs
            for your tracked keywords. Run a refresh, or connect a data source
            (DataForSEO), and results will appear here.
          </p>
          {isAdmin && (
            <div className="mt-5">
              <RefreshControl
                isAdmin={isAdmin}
                isRefreshing={isRefreshing}
                onRefresh={refresh}
              />
            </div>
          )}
        </div>
      )}

      {/* Populated */}
      {!isLoading && !error && hasData && (
        <>
          {shareOfVoice.length > 0 && (
            <ShareOfVoiceSection entries={shareOfVoice} />
          )}
          {competitorPositions.length > 0 && (
            <PositionsSection positions={competitorPositions} />
          )}
        </>
      )}

      {/* Honest note on removed capability — no fabricated numbers */}
      {!isLoading && !error && (
        <div className="flex items-start gap-2 border-t border-border-subtle pt-5">
          <Info size={15} className="text-white/35 mt-0.5 shrink-0" />
          <p className="text-[13px] text-white/45 leading-relaxed max-w-2xl">
            EVI head-to-head (per-competitor Engine Visibility Index,
            best-engine and citation comparisons) is coming with competitor
            intelligence. It is not shown here because those signals are not yet
            computed per competitor — we won&rsquo;t display estimated values.
          </p>
        </div>
      )}
    </div>
  );
}
