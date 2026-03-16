'use client';

/**
 * AnalyticsDashboard — Single scrollable EVI health dashboard
 *
 * Answers: "Is our EVI improving, and what's driving it?"
 *
 * Sections (top → bottom):
 * 1. EVI Scorecard — current score, delta, sparkline, timestamp
 * 2. Driver Breakdown — Visibility / Authority / Momentum cards
 * 3. EVI Over Time — line chart with 30d/90d/12m toggle
 * 4. Share of Model Trend — topic cluster bars
 * 5. Coverage Timeline — PR events vs EVI correlation
 * 6. Top Movers — contributing factors with deltas
 *
 * No ImpactStrip, no ModeSwitcher. Observational only.
 *
 * @see /docs/canon/ANALYTICS_CONTRACT.md
 */

import { useState, useMemo } from 'react';
import {
  getEVIBand,
  DRIVER_CONFIGS,
  TIME_RANGE_OPTIONS,
  TIER_CONFIG,
  ANALYTICS_PILLAR_CONFIG,
} from './types';
import type { TimeRange } from './types';
import {
  MOCK_EVI_TIME_SERIES,
  MOCK_CURRENT_EVI,
  MOCK_30D_AGO_EVI,
  MOCK_SOM_CLUSTERS,
  MOCK_COVERAGE_EVENTS,
  MOCK_TOP_MOVERS,
} from './mock-data';

// ============================================
// SECTION 1: EVI SCORECARD
// ============================================

function EVIScorecard() {
  const current = MOCK_CURRENT_EVI;
  const prev = MOCK_30D_AGO_EVI;
  const band = getEVIBand(current.eviScore);
  const delta = Math.round((current.eviScore - prev.eviScore) * 10) / 10;
  const isPositive = delta >= 0;

  // Sparkline: last 30 days
  const sparkData = MOCK_EVI_TIME_SERIES.slice(-30);
  const sparkMin = Math.min(...sparkData.map((d) => d.eviScore));
  const sparkMax = Math.max(...sparkData.map((d) => d.eviScore));
  const sparkRange = sparkMax - sparkMin || 1;

  const sparkPoints = sparkData
    .map((d, i) => {
      const x = (i / (sparkData.length - 1)) * 120;
      const y = 32 - ((d.eviScore - sparkMin) / sparkRange) * 28;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <div className="flex items-start justify-between">
        {/* Left: Score + delta */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-white/55 block mb-2">
            Earned Visibility Index
          </span>
          <div className="flex items-baseline gap-3">
            <span className={`text-4xl font-bold tabular-nums ${band.colorClass}`}>
              {current.eviScore.toFixed(1)}
            </span>
            <span className={`${band.bgClass} ${band.colorClass} px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border border-current/20`}>
              {band.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
              {isPositive ? '+' : ''}{delta.toFixed(1)}
            </span>
            <svg className={`w-3.5 h-3.5 ${isPositive ? 'text-semantic-success' : 'text-semantic-danger rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
            </svg>
            <span className="text-[13px] text-white/50">vs 30 days ago</span>
          </div>
        </div>

        {/* Right: Sparkline */}
        <div className="flex flex-col items-end gap-2">
          <svg width="120" height="36" className="overflow-visible">
            <polyline
              points={sparkPoints}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-brand-cyan"
            />
          </svg>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            Updated 2 hours ago
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SECTION 2: DRIVER BREAKDOWN
// ============================================

function DriverBreakdown() {
  const current = MOCK_CURRENT_EVI;
  const prev = MOCK_30D_AGO_EVI;

  return (
    <div>
      <h2 className="text-base font-semibold text-white/90 mb-3">
        EVI Drivers
      </h2>
      <div className="grid grid-cols-3 gap-4">
        {DRIVER_CONFIGS.map((driver) => {
          const score = current[driver.key];
          const prevScore = prev[driver.key];
          const delta = Math.round((score - prevScore) * 10) / 10;
          const isPositive = delta >= 0;

          return (
            <div
              key={driver.key}
              className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-white/90">{driver.label}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  {driver.weight}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold tabular-nums text-white/90">
                  {score.toFixed(1)}
                </span>
                <span className={`text-sm font-semibold tabular-nums ${isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                  {isPositive ? '+' : ''}{delta.toFixed(1)}
                </span>
                <svg className={`w-3 h-3 ${isPositive ? 'text-semantic-success' : 'text-semantic-danger rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
                </svg>
              </div>

              {/* Score bar */}
              <div className="w-full h-1.5 bg-slate-4 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-cyan rounded-full transition-all duration-500"
                  style={{ width: `${score}%` }}
                />
              </div>

              <p className="text-[13px] text-white/50 mt-3 leading-relaxed">
                {driver.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SECTION 3: EVI OVER TIME
// ============================================

function EVIOverTime() {
  const [range, setRange] = useState<TimeRange>('30d');

  const rangeConfig = TIME_RANGE_OPTIONS.find((r) => r.key === range)!;
  const data = useMemo(
    () => MOCK_EVI_TIME_SERIES.slice(-rangeConfig.days),
    [rangeConfig.days],
  );

  // Chart dimensions
  const chartW = 800;
  const chartH = 200;
  const padL = 40;
  const padR = 10;
  const padT = 10;
  const padB = 30;
  const plotW = chartW - padL - padR;
  const plotH = chartH - padT - padB;

  // Scale
  const minY = 0;
  const maxY = 100;

  const toX = (i: number) => padL + (i / (data.length - 1)) * plotW;
  const toY = (v: number) => padT + plotH - ((v - minY) / (maxY - minY)) * plotH;

  // Build path
  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.eviScore).toFixed(1)}`)
    .join(' ');

  // Band zones (horizontal)
  const bands = [
    { min: 0, max: 40, className: 'fill-semantic-danger/5' },
    { min: 40, max: 60, className: 'fill-semantic-warning/5' },
    { min: 60, max: 80, className: 'fill-brand-cyan/5' },
    { min: 80, max: 100, className: 'fill-semantic-success/5' },
  ];

  // X-axis labels
  const labelCount = range === '30d' ? 5 : range === '90d' ? 6 : 12;
  const labelStep = Math.floor(data.length / labelCount);

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white/90">EVI Over Time</h2>
        {/* Range toggle */}
        <div className="flex items-center bg-slate-3 rounded-lg border border-border-subtle p-0.5">
          {TIME_RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setRange(opt.key)}
              className={`px-3 py-1.5 text-[13px] font-medium rounded-md transition-all duration-150 ${
                range === opt.key
                  ? 'bg-panel text-white/90 shadow-elev-1'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chartW} ${chartH}`}
        className="w-full"
        preserveAspectRatio="none"
      >
        {/* Band zones */}
        {bands.map((b) => (
          <rect
            key={b.min}
            x={padL}
            y={toY(b.max)}
            width={plotW}
            height={toY(b.min) - toY(b.max)}
            className={b.className}
          />
        ))}

        {/* Horizontal grid lines */}
        {[0, 20, 40, 60, 80, 100].map((v) => (
          <g key={v}>
            <line
              x1={padL}
              y1={toY(v)}
              x2={padL + plotW}
              y2={toY(v)}
              className="stroke-white/10"
              strokeWidth="0.5"
            />
            <text
              x={padL - 6}
              y={toY(v) + 3}
              textAnchor="end"
              className="fill-white/40"
              style={{ fontSize: '9px' }}
            >
              {v}
            </text>
          </g>
        ))}

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % labelStep !== 0 && i !== data.length - 1) return null;
          const label = d.date.slice(5); // MM-DD
          return (
            <text
              key={d.date}
              x={toX(i)}
              y={chartH - 4}
              textAnchor="middle"
              className="fill-white/40"
              style={{ fontSize: '9px' }}
            >
              {label}
            </text>
          );
        })}

        {/* EVI line */}
        <path
          d={pathD}
          fill="none"
          className="stroke-brand-cyan"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

// ============================================
// SECTION 4: SHARE OF MODEL TREND
// ============================================

function ShareOfModelTrend() {
  const maxShare = Math.max(
    ...MOCK_SOM_CLUSTERS.flatMap((c) => [c.yourShare, c.competitorShare]),
  );
  const barScale = 100 / (maxShare + 5); // leave breathing room

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white/90">Share of Model by Topic</h2>
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
          30-day comparison
        </span>
      </div>

      <div className="space-y-5">
        {MOCK_SOM_CLUSTERS.map((cluster) => {
          const isPositive = cluster.delta30d >= 0;

          return (
            <div key={cluster.topicCluster}>
              {/* Cluster label + delta */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-white/85">{cluster.topicCluster}</span>
                <span className={`text-[13px] font-semibold tabular-nums ${isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                  {isPositive ? '+' : ''}{cluster.delta30d.toFixed(1)}pp
                </span>
              </div>

              {/* Your bar */}
              <div className="flex items-center gap-3 mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 w-12 shrink-0">
                  You
                </span>
                <div className="flex-1 h-5 bg-slate-4 rounded overflow-hidden">
                  <div
                    className="h-full bg-brand-cyan rounded transition-all duration-500"
                    style={{ width: `${cluster.yourShare * barScale}%` }}
                  />
                </div>
                <span className="text-sm font-semibold tabular-nums text-white/85 w-14 text-right">
                  {cluster.yourShare.toFixed(1)}%
                </span>
              </div>

              {/* Competitor bar */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 w-12 shrink-0 truncate" title={cluster.topCompetitor}>
                  {cluster.topCompetitor.slice(0, 6)}
                </span>
                <div className="flex-1 h-5 bg-slate-4 rounded overflow-hidden">
                  <div
                    className="h-full bg-white/20 rounded transition-all duration-500"
                    style={{ width: `${cluster.competitorShare * barScale}%` }}
                  />
                </div>
                <span className="text-sm tabular-nums text-white/55 w-14 text-right">
                  {cluster.competitorShare.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SECTION 5: COVERAGE TIMELINE
// ============================================

function CoverageTimeline() {
  // Sort events by date ascending
  const events = [...MOCK_COVERAGE_EVENTS].sort((a, b) => a.date.localeCompare(b.date));

  // Get EVI data for the same date range
  const earliestDate = events[0]?.date ?? '';
  const eviSlice = MOCK_EVI_TIME_SERIES.filter((d) => d.date >= earliestDate);

  // Chart dimensions
  const chartW = 800;
  const chartH = 100;
  const padL = 0;
  const padR = 0;

  // Date range
  const dateRange = eviSlice.length;
  const toX = (dateStr: string) => {
    const idx = eviSlice.findIndex((d) => d.date === dateStr);
    if (idx < 0) return 0;
    return padL + (idx / (dateRange - 1)) * (chartW - padL - padR);
  };

  const eviMin = Math.min(...eviSlice.map((d) => d.eviScore));
  const eviMax = Math.max(...eviSlice.map((d) => d.eviScore));
  const eviRange = eviMax - eviMin || 1;
  const toY = (v: number) => 10 + (chartH - 20) - ((v - eviMin) / eviRange) * (chartH - 20);

  const eviPath = eviSlice
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${(padL + (i / (dateRange - 1)) * (chartW - padL - padR)).toFixed(1)} ${toY(d.eviScore).toFixed(1)}`)
    .join(' ');

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <h2 className="text-base font-semibold text-white/90 mb-4">Coverage Timeline</h2>

      {/* Coverage events table */}
      <div className="mb-4">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">Date</th>
              <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">Placement</th>
              <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">Tier</th>
              <th className="text-right pb-2 text-xs font-semibold uppercase tracking-wide text-white/55">EVI Impact</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => {
              const tierConf = TIER_CONFIG[event.tier];
              const isPositive = event.eviImpact >= 0;
              return (
                <tr key={event.id} className="border-b border-border-subtle/50 last:border-0">
                  <td className="py-2 pr-4 text-[13px] text-white/55 whitespace-nowrap">{event.date.slice(5)}</td>
                  <td className="py-2 pr-4 text-sm text-white/85 leading-snug">{event.title}</td>
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${tierConf.dotClass}`} />
                      <span className="text-[13px] text-white/55">{tierConf.label}</span>
                    </div>
                  </td>
                  <td className={`py-2 text-right text-sm font-semibold tabular-nums ${isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                    {isPositive ? '+' : ''}{event.eviImpact.toFixed(1)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mini EVI chart */}
      <div className="border-t border-border-subtle pt-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
            EVI correlation
          </span>
          <div className="flex items-center gap-3 ml-auto">
            {(['T1', 'T2', 'T3'] as const).map((tier) => (
              <div key={tier} className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${TIER_CONFIG[tier].dotClass}`} />
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                  {TIER_CONFIG[tier].label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="none">
          {/* EVI line */}
          <path
            d={eviPath}
            fill="none"
            className="stroke-brand-cyan/40"
            strokeWidth="1.5"
          />

          {/* Event markers on chart */}
          {events.map((event) => {
            const x = toX(event.date);
            if (x === 0) return null;
            const tierConf = TIER_CONFIG[event.tier];

            return (
              <g key={event.id}>
                <line
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={chartH}
                  className="stroke-white/10"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={x}
                  cy={10}
                  r={event.tier === 'T1' ? 5 : event.tier === 'T2' ? 4 : 3}
                  className={tierConf.dotClass}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ============================================
// SECTION 6: TOP MOVERS
// ============================================

function TopMovers() {
  const sorted = [...MOCK_TOP_MOVERS].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <h2 className="text-base font-semibold text-white/90 mb-4">Top Movers This Period</h2>

      <table className="w-full">
        <thead>
          <tr className="border-b border-border-subtle">
            <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-white/55 w-1/2">Factor</th>
            <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-white/55">Pillar</th>
            <th className="text-left pb-3 text-xs font-semibold uppercase tracking-wide text-white/55">Period</th>
            <th className="text-right pb-3 text-xs font-semibold uppercase tracking-wide text-white/55">Impact</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((mover) => {
            const isPositive = mover.delta >= 0;
            const pillarConf = ANALYTICS_PILLAR_CONFIG[mover.pillar];
            return (
              <tr key={mover.id} className="border-b border-border-subtle/50 last:border-0">
                <td className="py-3 pr-4 text-sm text-white/85 leading-snug">{mover.description}</td>
                <td className="py-3 pr-4">
                  <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${pillarConf.badgeClass}`}>
                    {pillarConf.label}
                  </span>
                </td>
                <td className="py-3 pr-4 text-[13px] text-white/55 whitespace-nowrap">{mover.period}</td>
                <td className={`py-3 text-right text-base font-bold tabular-nums ${isPositive ? 'text-semantic-success' : 'text-semantic-danger'}`}>
                  {isPositive ? '+' : ''}{mover.delta.toFixed(1)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ============================================
// PAGE HEADER
// ============================================

function AnalyticsIcon() {
  return (
    <svg
      className="w-5 h-5 text-white/70"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AnalyticsDashboard() {
  return (
    <div className="flex flex-col h-full min-h-0 bg-page">
      {/* ── Header (no pillar accent — neutral) ── */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-border-subtle bg-slate-1">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 ring-1 ring-white/10">
          <AnalyticsIcon />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white/95 tracking-tight">Analytics</h1>
          <p className="text-[13px] text-white/55 mt-0.5">
            EVI health and visibility trends
          </p>
        </div>
      </div>

      {/* ── Dashboard sections (scrollable) ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
          {/* 1. EVI Scorecard */}
          <EVIScorecard />

          {/* 2. Driver Breakdown */}
          <DriverBreakdown />

          {/* 3. EVI Over Time */}
          <EVIOverTime />

          {/* 4. Share of Model Trend */}
          <ShareOfModelTrend />

          {/* 5. Coverage Timeline */}
          <CoverageTimeline />

          {/* 6. Top Movers */}
          <TopMovers />
        </div>
      </div>
    </div>
  );
}
