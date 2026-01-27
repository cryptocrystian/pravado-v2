'use client';

/**
 * PR Coverage View - DS 3.0
 *
 * Best-in-class coverage tracking with CiteMind integration.
 * Track mentions, citations (traditional + AI), sentiment, and outcomes.
 *
 * Features:
 * - Visual coverage timeline
 * - Citation dashboard (traditional + AI breakdown)
 * - Tier distribution bar
 * - Sentiment summary
 * - CiteMind pulse card for AI visibility health
 *
 * @see /docs/canon/CITEMIND_SYSTEM.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import { useState, useMemo } from 'react';
import type { Coverage, OutletTier, Sentiment } from '../types';
import {
  buttonStyles,
  glowEffects,
} from '../prWorkSurfaceStyles';

// ============================================
// TYPES
// ============================================

interface CiteMindPulse {
  score: number; // 0-100
  trend: 'rising' | 'stable' | 'declining';
  lastScan: string;
  aiCitations: {
    chatgpt: number;
    claude: number;
    perplexity: number;
    gemini: number;
    bingCopilot: number;
  };
  citationVelocity: number; // citations per day
  narrativeDriftRisk: 'low' | 'medium' | 'high';
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_COVERAGE: Coverage[] = [
  {
    id: 'cov-1',
    url: 'https://techcrunch.com/2024/01/15/ai-pr-platform-launch',
    headline: 'New AI-Powered PR Platform Promises to Transform Media Relations',
    outlet: 'TechCrunch',
    tier: 't1',
    sentiment: 'positive',
    publishedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    citationDetected: true,
    attributedPitchId: 'p1',
    summary: 'Comprehensive coverage of the platform launch with quotes from CEO.',
  },
  {
    id: 'cov-2',
    url: 'https://wired.com/story/marketing-ai-tools',
    headline: 'The Rise of AI in Marketing Operations',
    outlet: 'Wired',
    tier: 't1',
    sentiment: 'neutral',
    publishedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    citationDetected: true,
    summary: 'Industry roundup mentioning Pravado among other AI marketing tools.',
  },
  {
    id: 'cov-3',
    url: 'https://martech.org/pr-intelligence-report',
    headline: 'PR Intelligence Tools: A Market Analysis',
    outlet: 'MarTech.org',
    tier: 'trade',
    sentiment: 'positive',
    publishedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    citationDetected: false,
    summary: 'Brief mention in market analysis report.',
  },
  {
    id: 'cov-4',
    url: 'https://venturebeat.com/ai-marketing',
    headline: 'VentureBeat AI Awards: Marketing Category',
    outlet: 'VentureBeat',
    tier: 't1',
    sentiment: 'positive',
    publishedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    citationDetected: true,
    attributedReleaseId: 'rel-1',
    summary: 'Nominated for Best AI Marketing Tool award.',
  },
  {
    id: 'cov-5',
    url: 'https://forbes.com/sites/tech/ai-pr-trends',
    headline: 'How AI is Reshaping Public Relations',
    outlet: 'Forbes',
    tier: 't1',
    sentiment: 'positive',
    publishedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    citationDetected: true,
    summary: 'Feature article highlighting AI-first PR platforms.',
  },
  {
    id: 'cov-6',
    url: 'https://prweek.com/ai-tools-analysis',
    headline: 'PR Tech Stack 2024: Essential Tools Review',
    outlet: 'PRWeek',
    tier: 't2',
    sentiment: 'positive',
    publishedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    citationDetected: false,
    summary: 'Included in essential tools roundup.',
  },
];

const MOCK_CITEMIND_PULSE: CiteMindPulse = {
  score: 74,
  trend: 'rising',
  lastScan: new Date(Date.now() - 4 * 3600000).toISOString(),
  aiCitations: {
    chatgpt: 12,
    claude: 8,
    perplexity: 23,
    gemini: 5,
    bingCopilot: 7,
  },
  citationVelocity: 2.3,
  narrativeDriftRisk: 'low',
};

// ============================================
// HELPER COMPONENTS
// ============================================

function TierBadge({ tier }: { tier: OutletTier }) {
  const config = {
    t1: {
      color: 'bg-brand-iris/15 text-brand-iris border border-brand-iris/30',
      label: 'Tier 1',
    },
    t2: {
      color: 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30',
      label: 'Tier 2',
    },
    t3: {
      color: 'bg-white/10 text-white/60 border border-white/20',
      label: 'Tier 3',
    },
    trade: {
      color: 'bg-semantic-warning/15 text-semantic-warning border border-semantic-warning/30',
      label: 'Trade',
    },
    niche: {
      color: 'bg-white/10 text-white/50 border border-white/15',
      label: 'Niche',
    },
  };

  const { color, label } = config[tier];
  return (
    <span className={`px-2 py-0.5 text-[11px] font-bold uppercase rounded ${color}`}>
      {label}
    </span>
  );
}

function SentimentBadge({ sentiment, compact = false }: { sentiment: Sentiment; compact?: boolean }) {
  const config = {
    positive: {
      color: 'text-semantic-success',
      bg: 'bg-semantic-success/10',
      icon: '↑',
      label: 'Positive',
    },
    neutral: {
      color: 'text-white/60',
      bg: 'bg-white/5',
      icon: '→',
      label: 'Neutral',
    },
    negative: {
      color: 'text-semantic-danger',
      bg: 'bg-semantic-danger/10',
      icon: '↓',
      label: 'Negative',
    },
  };

  const { color, bg, icon, label } = config[sentiment];

  // Compact mode: icon only with tooltip
  if (compact) {
    return (
      <span
        className={`w-6 h-6 flex items-center justify-center text-sm rounded ${bg} ${color}`}
        title={label}
      >
        {icon}
      </span>
    );
  }

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded ${bg} ${color}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

function AICitationBadge() {
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold uppercase rounded bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30">
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      AI Citation
    </span>
  );
}

// ============================================
// STAT CARD
// ============================================

function StatCard({
  label,
  value,
  subtext,
  accent = 'neutral',
  icon,
}: {
  label: string;
  value: number | string;
  subtext?: string;
  accent?: 'neutral' | 'cyan' | 'iris' | 'magenta' | 'success';
  icon?: React.ReactNode;
}) {
  const accentStyles = {
    neutral: {
      bg: 'bg-[#13131A]',
      border: 'border-[#1A1A24]',
      value: 'text-white',
    },
    cyan: {
      bg: 'bg-brand-cyan/5',
      border: 'border-brand-cyan/20',
      value: 'text-brand-cyan',
    },
    iris: {
      bg: 'bg-brand-iris/5',
      border: 'border-brand-iris/20',
      value: 'text-brand-iris',
    },
    magenta: {
      bg: 'bg-brand-magenta/5',
      border: 'border-brand-magenta/20',
      value: 'text-brand-magenta',
    },
    success: {
      bg: 'bg-semantic-success/5',
      border: 'border-semantic-success/20',
      value: 'text-semantic-success',
    },
  };

  const style = accentStyles[accent];

  return (
    <div className={`p-4 rounded-xl ${style.bg} border ${style.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className={`text-2xl font-bold ${style.value}`}>{value}</div>
          <div className="text-xs text-white/55 mt-1">{label}</div>
          {subtext && <div className="text-[10px] text-white/40 mt-0.5">{subtext}</div>}
        </div>
        {icon && <div className="text-white/30">{icon}</div>}
      </div>
    </div>
  );
}

// ============================================
// TIER DISTRIBUTION BAR
// ============================================

function TierDistributionBar({ coverage }: { coverage: Coverage[] }) {
  const distribution = useMemo(() => {
    const counts = {
      t1: coverage.filter((c) => c.tier === 't1').length,
      t2: coverage.filter((c) => c.tier === 't2').length,
      t3: coverage.filter((c) => c.tier === 't3').length,
      trade: coverage.filter((c) => c.tier === 'trade').length,
      niche: coverage.filter((c) => c.tier === 'niche').length,
    };
    const total = coverage.length || 1;
    return {
      t1: { count: counts.t1, pct: (counts.t1 / total) * 100 },
      t2: { count: counts.t2, pct: (counts.t2 / total) * 100 },
      t3: { count: counts.t3, pct: (counts.t3 / total) * 100 },
      trade: { count: counts.trade, pct: (counts.trade / total) * 100 },
      niche: { count: counts.niche, pct: (counts.niche / total) * 100 },
    };
  }, [coverage]);

  const tierConfig = [
    { key: 't1', label: 'Tier 1', color: 'bg-brand-iris' },
    { key: 't2', label: 'Tier 2', color: 'bg-brand-cyan' },
    { key: 't3', label: 'Tier 3', color: 'bg-white/40' },
    { key: 'trade', label: 'Trade', color: 'bg-semantic-warning' },
    { key: 'niche', label: 'Niche', color: 'bg-white/20' },
  ] as const;

  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Tier Distribution
        </span>
        <span className="text-[10px] text-white/50">{coverage.length} placements</span>
      </div>

      {/* Stacked bar */}
      <div className="h-3 rounded-full bg-[#1A1A24] overflow-hidden flex">
        {tierConfig.map((tier) => {
          const pct = distribution[tier.key].pct;
          if (pct === 0) return null;
          return (
            <div
              key={tier.key}
              className={`${tier.color} h-full transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${tier.label}: ${distribution[tier.key].count}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
        {tierConfig.map((tier) => {
          const data = distribution[tier.key];
          if (data.count === 0) return null;
          return (
            <div key={tier.key} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-sm ${tier.color}`} />
              <span className="text-[11px] text-white/60">
                {tier.label} <span className="text-white/40">({data.count})</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// SENTIMENT SUMMARY
// ============================================

function SentimentSummary({ coverage }: { coverage: Coverage[] }) {
  const sentiment = useMemo(() => {
    const counts = {
      positive: coverage.filter((c) => c.sentiment === 'positive').length,
      neutral: coverage.filter((c) => c.sentiment === 'neutral').length,
      negative: coverage.filter((c) => c.sentiment === 'negative').length,
    };
    const total = coverage.length || 1;
    return {
      positive: { count: counts.positive, pct: (counts.positive / total) * 100 },
      neutral: { count: counts.neutral, pct: (counts.neutral / total) * 100 },
      negative: { count: counts.negative, pct: (counts.negative / total) * 100 },
    };
  }, [coverage]);

  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Sentiment Analysis
        </span>
      </div>

      <div className="space-y-2">
        {/* Positive */}
        <div className="flex items-center gap-3">
          <span className="w-16 text-[11px] text-semantic-success font-medium">Positive</span>
          <div className="flex-1 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
            <div
              className="h-full bg-semantic-success transition-all duration-300"
              style={{ width: `${sentiment.positive.pct}%` }}
            />
          </div>
          <span className="w-8 text-right text-[11px] text-white/50">
            {sentiment.positive.count}
          </span>
        </div>

        {/* Neutral */}
        <div className="flex items-center gap-3">
          <span className="w-16 text-[11px] text-white/60 font-medium">Neutral</span>
          <div className="flex-1 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
            <div
              className="h-full bg-white/40 transition-all duration-300"
              style={{ width: `${sentiment.neutral.pct}%` }}
            />
          </div>
          <span className="w-8 text-right text-[11px] text-white/50">
            {sentiment.neutral.count}
          </span>
        </div>

        {/* Negative */}
        <div className="flex items-center gap-3">
          <span className="w-16 text-[11px] text-semantic-danger font-medium">Negative</span>
          <div className="flex-1 h-2 rounded-full bg-[#1A1A24] overflow-hidden">
            <div
              className="h-full bg-semantic-danger transition-all duration-300"
              style={{ width: `${sentiment.negative.pct}%` }}
            />
          </div>
          <span className="w-8 text-right text-[11px] text-white/50">
            {sentiment.negative.count}
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CITEMIND PULSE CARD
// ============================================

function CiteMindPulseCard({ pulse }: { pulse: CiteMindPulse }) {
  const trendConfig = {
    rising: { color: 'text-semantic-success', icon: '↑', label: 'Rising' },
    stable: { color: 'text-white/60', icon: '→', label: 'Stable' },
    declining: { color: 'text-semantic-danger', icon: '↓', label: 'Declining' },
  };

  const driftConfig = {
    low: { color: 'text-semantic-success', bg: 'bg-semantic-success/10', label: 'Low' },
    medium: { color: 'text-semantic-warning', bg: 'bg-semantic-warning/10', label: 'Medium' },
    high: { color: 'text-semantic-danger', bg: 'bg-semantic-danger/10', label: 'High' },
  };

  const trend = trendConfig[pulse.trend];
  const drift = driftConfig[pulse.narrativeDriftRisk];
  const totalAICitations = Object.values(pulse.aiCitations).reduce((a, b) => a + b, 0);

  return (
    <div className={`p-5 rounded-xl bg-[#0D0D12] border border-brand-cyan/20 ${glowEffects.seo}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-cyan/15 flex items-center justify-center">
            <svg className="w-4 h-4 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <span className="text-sm font-semibold text-white">CiteMind Pulse</span>
            <span className="text-[10px] text-white/40 ml-2">AI Visibility Health</span>
          </div>
        </div>
        <span className="text-[10px] text-white/40">
          Last scan: {new Date(pulse.lastScan).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Score Ring */}
      <div className="flex items-center gap-6 mb-4">
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#1A1A24"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#00d9ff"
              strokeWidth="3"
              strokeDasharray={`${pulse.score}, 100`}
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-brand-cyan">{pulse.score}</span>
            <span className="text-[9px] text-white/40">/ 100</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {/* Trend */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/55">Trend</span>
            <span className={`flex items-center gap-1 text-[11px] font-medium ${trend.color}`}>
              {trend.icon} {trend.label}
            </span>
          </div>
          {/* Velocity */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/55">Velocity</span>
            <span className="text-[11px] text-white/70 font-medium">
              {pulse.citationVelocity}/day
            </span>
          </div>
          {/* Drift Risk */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/55">Drift Risk</span>
            <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${drift.bg} ${drift.color}`}>
              {drift.label}
            </span>
          </div>
        </div>
      </div>

      {/* AI Citation Breakdown */}
      <div className="pt-3 border-t border-[#1A1A24]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/50">
            AI Citations by Model
          </span>
          <span className="text-[11px] text-brand-cyan font-medium">{totalAICitations} total</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { key: 'chatgpt', label: 'ChatGPT' },
            { key: 'claude', label: 'Claude' },
            { key: 'perplexity', label: 'Perplexity' },
            { key: 'gemini', label: 'Gemini' },
            { key: 'bingCopilot', label: 'Copilot' },
          ].map((model) => (
            <div key={model.key} className="text-center">
              <div className="text-sm font-semibold text-white/90">
                {pulse.aiCitations[model.key as keyof typeof pulse.aiCitations]}
              </div>
              <div className="text-[9px] text-white/40 truncate">{model.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================
// COVERAGE TIMELINE
// ============================================

function CoverageTimeline({ coverage }: { coverage: Coverage[] }) {
  const sortedCoverage = useMemo(
    () => [...coverage].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()),
    [coverage]
  );

  const recentCoverage = sortedCoverage.slice(0, 5);

  return (
    <div className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24]">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
          Recent Coverage
        </span>
        <span className="text-[10px] text-white/50">Last 30 days</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-[#1A1A24]" />

        <div className="space-y-4">
          {recentCoverage.map((item, idx) => {
            const isLatest = idx === 0;
            const date = new Date(item.publishedAt);
            const daysDiff = Math.floor((Date.now() - date.getTime()) / 86400000);

            return (
              <div key={item.id} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-1.5 top-1 w-3 h-3 rounded-full border-2 ${
                    isLatest
                      ? 'bg-brand-magenta border-brand-magenta/50'
                      : item.citationDetected
                        ? 'bg-brand-cyan border-brand-cyan/50'
                        : 'bg-[#1A1A24] border-[#2A2A36]'
                  }`}
                />

                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TierBadge tier={item.tier} />
                      {item.citationDetected && <AICitationBadge />}
                    </div>
                    <p className="text-sm text-white/85 truncate">{item.headline}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-brand-cyan">{item.outlet}</span>
                      <span className="text-[11px] text-white/40">
                        {daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff}d ago`}
                      </span>
                    </div>
                  </div>
                  <SentimentBadge sentiment={item.sentiment} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// CoverageCard component removed - now using CoverageTableRow for tabular view

// ============================================
// COVERAGE TABLE ROW (Aligned Columns)
// ============================================

function CoverageTableRow({ item }: { item: Coverage }) {
  const [isHovered, setIsHovered] = useState(false);
  const daysDiff = Math.floor((Date.now() - new Date(item.publishedAt).getTime()) / 86400000);
  const dateLabel = daysDiff === 0 ? 'Today' : daysDiff === 1 ? 'Yesterday' : `${daysDiff}d ago`;

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 rounded-lg bg-[#0A0A0F] hover:bg-[#111116] border border-transparent hover:border-[#1A1A24] transition-all duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Sentiment (Icon Only w/ Tooltip) */}
      <div className="w-8 shrink-0">
        <SentimentBadge sentiment={item.sentiment} compact />
      </div>

      {/* Tier */}
      <div className="w-16 shrink-0">
        <TierBadge tier={item.tier} />
      </div>

      {/* Outlet */}
      <div className="w-28 shrink-0">
        <span className="text-sm font-medium text-brand-cyan truncate">{item.outlet}</span>
      </div>

      {/* Headline */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/85 truncate">{item.headline}</p>
      </div>

      {/* Citation Indicator */}
      <div className="w-24 shrink-0 flex justify-center">
        {item.citationDetected ? (
          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-brand-cyan/15 text-brand-cyan">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Cited
          </span>
        ) : (
          <span className="text-[10px] text-white/30">—</span>
        )}
      </div>

      {/* Date */}
      <div className="w-20 shrink-0 text-right">
        <span className="text-[11px] text-white/50">{dateLabel}</span>
      </div>

      {/* Hover Action: View Article */}
      <div className="w-24 shrink-0 flex justify-end">
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-200 ${
            isHovered
              ? 'bg-brand-magenta/15 text-brand-magenta opacity-100'
              : 'opacity-0 text-white/50'
          }`}
        >
          View article
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ============================================
// COVERAGE TABLE (with Header)
// ============================================

function CoverageTable({ coverage }: { coverage: Coverage[] }) {
  return (
    <div className="space-y-1">
      {/* Table Header */}
      <div className="flex items-center gap-4 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
        <div className="w-8 shrink-0"></div>
        <div className="w-16 shrink-0">Tier</div>
        <div className="w-28 shrink-0">Outlet</div>
        <div className="flex-1">Headline</div>
        <div className="w-24 shrink-0 text-center">Citation</div>
        <div className="w-20 shrink-0 text-right">Date</div>
        <div className="w-24 shrink-0"></div>
      </div>

      {/* Rows */}
      {coverage.map((item) => (
        <CoverageTableRow key={item.id} item={item} />
      ))}
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

function EmptyState() {
  return (
    <div className="p-12 text-center rounded-xl border border-dashed border-[#2A2A36] bg-[#0D0D12]/50">
      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#13131A] flex items-center justify-center">
        <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      </div>
      <p className="text-sm text-white/55">No coverage matching this filter</p>
      <p className="text-xs text-white/40 mt-1">Try adjusting your filter criteria</p>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PRCoverage() {
  const [coverage] = useState<Coverage[]>(MOCK_COVERAGE);
  const [pulse] = useState<CiteMindPulse>(MOCK_CITEMIND_PULSE);
  const [filter, setFilter] = useState<'all' | 'citations' | 't1'>('all');

  const filteredCoverage = useMemo(() => {
    return coverage.filter((c) => {
      if (filter === 'citations') return c.citationDetected;
      if (filter === 't1') return c.tier === 't1';
      return true;
    });
  }, [coverage, filter]);

  // Stats
  const stats = useMemo(() => ({
    total: coverage.length,
    aiCitations: coverage.filter((c) => c.citationDetected).length,
    t1: coverage.filter((c) => c.tier === 't1').length,
    positive: coverage.filter((c) => c.sentiment === 'positive').length,
  }), [coverage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-white">Coverage Tracking</h2>
          <p className="text-xs text-white/40 mt-0.5">See the impact of your media efforts</p>
        </div>
        <button
          type="button"
          className={buttonStyles.primary}
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Coverage
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Coverage"
          value={stats.total}
          subtext="All placements"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          }
        />
        <StatCard
          label="AI Citations"
          value={stats.aiCitations}
          subtext="CiteMind detected"
          accent="cyan"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
        <StatCard
          label="Tier 1 Placements"
          value={stats.t1}
          subtext="Premium outlets"
          accent="iris"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          }
        />
        <StatCard
          label="Positive Sentiment"
          value={stats.positive}
          subtext={`${Math.round((stats.positive / stats.total) * 100)}% of coverage`}
          accent="success"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: CiteMind Pulse */}
        <div className="lg:col-span-1">
          <CiteMindPulseCard pulse={pulse} />
        </div>

        {/* Right: Timeline + Distribution */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TierDistributionBar coverage={coverage} />
            <SentimentSummary coverage={coverage} />
          </div>
          <CoverageTimeline coverage={coverage} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1A1A24] pb-px">
        {[
          { id: 'all', label: 'All Coverage', count: coverage.length },
          { id: 'citations', label: 'AI Citations', count: stats.aiCitations },
          { id: 't1', label: 'Tier 1 Only', count: stats.t1 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id as 'all' | 'citations' | 't1')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors relative ${
              filter === tab.id
                ? 'text-white'
                : 'text-white/55 hover:text-white/80'
            }`}
          >
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              filter === tab.id
                ? 'bg-brand-magenta/15 text-brand-magenta'
                : 'bg-white/10 text-white/50'
            }`}>
              {tab.count}
            </span>
            {filter === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-magenta rounded-t" />
            )}
          </button>
        ))}
      </div>

      {/* Coverage List (Tabular with aligned columns) */}
      <div className="rounded-xl border border-[#1A1A24] bg-[#0D0D12] p-2">
        {filteredCoverage.length > 0 ? (
          <CoverageTable coverage={filteredCoverage} />
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}
