'use client';

/**
 * ContentOverviewView v5 — Three-Mode Design
 *
 * Three separate render functions gated on mode prop:
 * - Manual ("Workbench"): Full controls, AI invisible, dense asset queue
 * - Copilot ("Plan Review"): AI prepared, user approves, SAGE queue + attribution
 * - Autopilot ("Exception Console"): AI executing, user supervises, exceptions + activity
 *
 * Per CONTENT_OVERVIEW_THREE_MODE_SPEC.md: These are three separate products
 * sharing one navigation shell, not one layout with a badge swap.
 *
 * DS Compliance: All tokens verified against DS_v3_1_EXPRESSION.md
 * No phantom hex, no bg-gray-*, no plain text-white, no translate-y hover.
 * brand-iris for all Content pillar accents.
 *
 * @see /docs/canon/work/CONTENT_OVERVIEW_THREE_MODE_SPEC.md
 * @see /docs/skills/PRAVADO_DESIGN_SKILL.md
 */

import { useState, useEffect } from 'react';
import type { ContentAsset, AutomationMode } from '../types';
import { ContentAssetCard } from '../components/ContentAssetCard';
import {
  Plus,
  Lightning,
  TrendUp,
  TrendDown,
  Minus,
  CheckCircle,
  ArrowSquareOut,
  ChartBar,
  Newspaper,
  Robot,
  MagnifyingGlass,
  CaretDown,
  DotsSixVertical,
  Pause,
  Warning,
  Clock,
  Check,
} from '@phosphor-icons/react';

// ============================================
// TYPES (exported for mock-data consumption)
// ============================================

export interface SAGEProposal {
  id: string;
  title: string;
  type: 'guide' | 'article' | 'report' | 'comparison' | 'faq';
  priority: 'critical' | 'high' | 'medium';
  competitiveGap: string;
  eviImpact: { low: number; high: number };
  effort: 'low' | 'medium' | 'high';
  timeEstimate: string;
  topicCluster: string;
}

export interface CrossPillarEvent {
  id: string;
  type: 'pr_coverage' | 'citation_detected' | 'pr_pitch_sent' | 'aeo_score_change';
  description: string;
  impact: number;
  timestamp: string;
  source: string;
}

export interface ContentOverviewData {
  avgCiteMindScore: number;
  citeMindDelta: number;
  avgCitationEligibility: number;
  avgAiIngestion: number;
  avgCrossPillarImpact: number;
  proposals: SAGEProposal[];
  inProgressCount: number;
  publishedThisMonth: number;
  topAssetThisMonth: { title: string; score: number } | null;
  needsAttentionCount: number;
  themes: Array<{ name: string; assetCount: number; avgCiteMind: number; trend: 'up' | 'down' | 'flat' }>;
  crossPillarFeed: CrossPillarEvent[];
  recentAssets: ContentAsset[];
}

interface ContentOverviewViewProps {
  data: ContentOverviewData;
  mode?: AutomationMode;
  onCreateFromBrief?: (proposalId: string) => void;
  onApproveProposal?: (proposalId: string) => void;
  onDismissProposal?: (proposalId: string) => void;
  onResolveException?: (exceptionId: string) => void;
  onPauseAutopilot?: () => void;
  onViewAllProposals?: () => void;
  onViewAsset?: (assetId: string) => void;
  onViewLibrary?: () => void;
  onCreateManual?: () => void;
}

// ============================================
// MODE-SPECIFIC MOCK DATA
// ============================================

interface ManualQueueItem {
  id: string;
  title: string;
  status: string;
  citeMindScore: number;
  citeMindStatus: string;
  contentType: string;
  updatedAt: string;
  wordCount: number;
  entityTags: string[];
}

// Manual queue — empty by default, populated from API
// TODO: Replace with SWR-fetched content items from /api/content/items
const MANUAL_QUEUE_MOCK: ManualQueueItem[] = [];

interface AutopilotException {
  id: string;
  title: string;
  issue: string;
  reason: string;
  urgency: 'critical' | 'high';
  citeMindScore: number;
}

// Autopilot exceptions — empty by default, populated from API
// TODO: Replace with SWR-fetched exceptions from /api/content/exceptions
const AUTOPILOT_EXCEPTIONS_MOCK: AutopilotException[] = [];

interface AutopilotActivity {
  id: string;
  action: string;
  asset: string;
  result: string;
  timestamp: string;
  type: 'quality' | 'derivative' | 'brief';
}

// Autopilot activity — empty by default, populated from API
// TODO: Replace with SWR-fetched activity log from /api/content/activity
const AUTOPILOT_ACTIVITY_MOCK: AutopilotActivity[] = [];

// ============================================
// SHARED HELPERS
// ============================================

function getCiteColor(s: number): string {
  if (s >= 80) return 'text-semantic-success';
  if (s >= 60) return 'text-brand-cyan';
  if (s >= 40) return 'text-semantic-warning';
  return 'text-semantic-danger';
}

function getCiteGlow(s: number): string {
  if (s >= 80) return 'drop-shadow-[0_0_12px_rgba(34,197,94,0.2)]';
  return '';
}

const PRIORITY_CONFIG = {
  critical: {
    badge: 'bg-semantic-danger/10 text-semantic-danger border-semantic-danger/20',
    label: 'Critical',
    border: 'border-l-semantic-danger',
  },
  high: {
    badge: 'bg-semantic-warning/10 text-semantic-warning border-semantic-warning/20',
    label: 'High',
    border: 'border-l-semantic-warning',
  },
  medium: {
    badge: 'bg-brand-cyan/10 text-brand-cyan border-brand-cyan/20',
    label: 'Medium',
    border: 'border-l-brand-cyan',
  },
};

const TYPE_LABELS: Record<string, string> = {
  guide: 'Guide', article: 'Article', report: 'Report',
  comparison: 'Comparison', faq: 'FAQ Page',
};

const EFFORT_LABELS: Record<string, string> = {
  low: 'Low effort', medium: 'Moderate effort', high: 'High effort',
};

const EVENT_ICON_MAP = {
  pr_coverage:       { icon: Newspaper, bg: 'bg-brand-magenta/10', text: 'text-brand-magenta' },
  citation_detected: { icon: Robot,     bg: 'bg-brand-cyan/10',    text: 'text-brand-cyan' },
  pr_pitch_sent:     { icon: Lightning, bg: 'bg-brand-magenta/10', text: 'text-brand-magenta' },
  aeo_score_change:  { icon: ChartBar,  bg: 'bg-brand-cyan/10',    text: 'text-brand-cyan' },
};

// Cross-pillar tail lines — populated dynamically from SAGE proposals
const CROSS_PILLAR_TAILS: Record<string, string> = {};

// Sparkline uses zeros until real trend data is available
const SPARKLINE_POINTS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

// Confidence scores come from SAGE proposals — default 0.85
const CONFIDENCE_SCORES: Record<string, number> = {};

function MiniSparkline({ data, className }: { data: number[]; className?: string }) {
  const w = 96;
  const h = 28;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastX = pad + ((data.length - 1) / (data.length - 1)) * (w - 2 * pad);
  const lastY = h - pad - ((data[data.length - 1] - min) / range) * (h - 2 * pad);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className}>
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX.toFixed(1)} cy={lastY.toFixed(1)} r="2.5" fill="currentColor" />
    </svg>
  );
}

// ============================================
// MODE TRANSITION (~800ms evaluating state)
// ============================================

function ModeTransition() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-0">
      <div className="flex flex-col items-center gap-3">
        <span className="w-3 h-3 rounded-full bg-brand-iris animate-pulse shadow-[0_0_12px_rgba(168,85,247,0.6)]" />
        <span className="text-sm font-medium text-white/50">Evaluating...</span>
      </div>
    </div>
  );
}

// ============================================
// MANUAL MODE — "Workbench"
// ============================================

function ManualStatusBar({ data }: { data: ContentOverviewData }) {
  return (
    <div className="bg-slate-1 border-b border-border-subtle">
      <div className="px-4 py-2.5 flex items-center">
        {/* CiteMind Score */}
        <div className="pr-5 flex items-baseline gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">CiteMind</span>
          <span className={`text-2xl font-bold tabular-nums ${getCiteColor(data.avgCiteMindScore)}`}>
            {data.avgCiteMindScore}
          </span>
        </div>

        {/* Sub-metrics */}
        <div className="border-l border-border-subtle pl-4 pr-5 flex items-center gap-3">
          {[
            { label: 'Elig', value: data.avgCitationEligibility },
            { label: 'Ingest', value: data.avgAiIngestion },
            { label: 'X-Pillar', value: data.avgCrossPillarImpact },
          ].map((m) => (
            <div key={m.label} className="flex items-baseline gap-1">
              <span className="text-base font-bold tabular-nums text-white/85">{m.value}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Pipeline */}
        <div className="border-l border-border-subtle pl-4 pr-5 flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mr-1">Pipeline</span>
          <span className="text-base font-bold tabular-nums text-white/85">{data.inProgressCount}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Draft</span>
          <span className="text-white/25">→</span>
          <span className="text-base font-bold tabular-nums text-white/85">0</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Review</span>
          <span className="text-white/25">→</span>
          <span className="text-base font-bold tabular-nums text-white/85">{data.publishedThisMonth}</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Pub</span>
        </div>

        {/* Ops stats */}
        <div className="border-l border-border-subtle pl-4 ml-auto flex items-center gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tabular-nums text-white/85">{data.inProgressCount}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Active</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold tabular-nums text-white/85">{data.publishedThisMonth}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Published</span>
          </div>
          {data.topAssetThisMonth && (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold tabular-nums text-semantic-success">{data.topAssetThisMonth.score}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Top</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ManualFilterBar() {
  return (
    <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-3">
      <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-2 border border-border-subtle rounded-lg">
        <MagnifyingGlass className="w-4 h-4 text-white/40" weight="regular" />
        <span className="text-sm text-white/40">Search content...</span>
      </div>
      {['All Status', 'All Types', 'All Entities'].map((label) => (
        <button
          key={label}
          type="button"
          className="px-3 py-2 text-sm text-white/60 bg-slate-2 border border-border-subtle rounded-lg hover:border-slate-5 transition-colors flex items-center gap-1.5"
        >
          {label}
          <CaretDown className="w-3 h-3 text-white/40" weight="regular" />
        </button>
      ))}
    </div>
  );
}

const MANUAL_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  published: { label: 'PUBLISHED', color: 'bg-semantic-success/15 text-semantic-success' },
  draft: { label: 'DRAFT', color: 'bg-white/5 text-white/50' },
  review: { label: 'REVIEW', color: 'bg-brand-cyan/15 text-brand-cyan' },
  needs_review: { label: 'NEEDS REV', color: 'bg-semantic-warning/15 text-semantic-warning' },
};

function ManualQueueRow({
  item,
  onEdit,
}: {
  item: ManualQueueItem;
  onEdit?: (id: string) => void;
}) {
  const statusCfg = MANUAL_STATUS_CONFIG[item.status] || MANUAL_STATUS_CONFIG.draft;

  return (
    <div className="group flex items-center gap-3 px-4 py-3 border-b border-border-subtle hover:bg-white/[0.02] transition-colors">
      {/* Drag handle */}
      <DotsSixVertical className="w-4 h-4 text-white/25 cursor-grab flex-shrink-0" weight="bold" />

      {/* Status badge */}
      <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded flex-shrink-0 ${statusCfg.color}`}>
        {statusCfg.label}
      </span>

      {/* Title */}
      <span className="text-sm font-medium text-white/85 flex-1 min-w-0 truncate">{item.title}</span>

      {/* CiteMind score */}
      <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${item.citeMindScore > 0 ? getCiteColor(item.citeMindScore) : 'text-white/30'}`}>
        {item.citeMindScore > 0 ? item.citeMindScore : '—'}
      </span>

      {/* Content type */}
      <span className="text-[13px] text-white/50 flex-shrink-0 w-20 text-right">{item.contentType}</span>

      {/* Updated at */}
      <span className="text-[13px] text-white/40 flex-shrink-0 w-16 text-right">{item.updatedAt}</span>

      {/* Word count */}
      <span className="text-[13px] text-white/40 tabular-nums flex-shrink-0 w-20 text-right">
        {item.wordCount.toLocaleString()} words
      </span>

      {/* Entity tags */}
      <div className="flex gap-1.5 flex-shrink-0">
        {item.entityTags.slice(0, 2).map((tag) => (
          <span key={tag} className="px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded bg-brand-iris/10 text-brand-iris/70">
            {tag}
          </span>
        ))}
      </div>

      {/* Edit on hover */}
      <button
        onClick={() => onEdit?.(item.id)}
        className="opacity-0 group-hover:opacity-100 text-[13px] text-white/50 hover:text-white/80 transition-all flex-shrink-0"
      >
        Edit →
      </button>
    </div>
  );
}

function ManualView({
  data,
  onViewAsset,
}: {
  data: ContentOverviewData;
  onViewAsset?: (id: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ManualStatusBar data={data} />
      <ManualFilterBar />
      <div className="flex-1 overflow-y-auto">
        {MANUAL_QUEUE_MOCK.length > 0 ? (
          MANUAL_QUEUE_MOCK.map((item) => (
            <ManualQueueRow key={item.id} item={item} onEdit={onViewAsset} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm text-white/50">No content items yet</p>
            <p className="text-[13px] text-white/30 mt-1">Create your first piece of content to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// COPILOT MODE — "Plan Review"
// ============================================

function CiteMindInstrumentStrip({
  score, delta, citationEligibility, aiIngestion, crossPillarImpact,
  inProgressCount, publishedThisMonth, topAssetThisMonth, needsAttentionCount,
}: {
  score: number;
  delta: number;
  citationEligibility: number;
  aiIngestion: number;
  crossPillarImpact: number;
  inProgressCount: number;
  publishedThisMonth: number;
  topAssetThisMonth: { title: string; score: number } | null;
  needsAttentionCount: number;
}) {
  const scoreColor = getCiteColor(score);
  const scoreGlow = getCiteGlow(score);

  return (
    <div className="bg-slate-1 border-b border-border-subtle shadow-[inset_0_0_60px_rgba(168,85,247,0.03)]">
      <div className="px-4 py-3 flex items-stretch">

        {/* Score Block */}
        <div className="pr-5 flex flex-col justify-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 mb-1">
            Content CiteMind Score
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-5xl font-bold tabular-nums leading-none ${scoreColor} ${scoreGlow}`}>
              {score}
            </span>
            <span className="text-xl text-white/30 font-light">/100</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            {delta > 0 ? (
              <TrendUp className="w-3.5 h-3.5 text-semantic-success" weight="bold" />
            ) : delta < 0 ? (
              <TrendDown className="w-3.5 h-3.5 text-semantic-danger" weight="bold" />
            ) : (
              <Minus className="w-3.5 h-3.5 text-white/40" weight="bold" />
            )}
            <span className={`text-[13px] font-semibold ${delta > 0 ? 'text-semantic-success' : delta < 0 ? 'text-semantic-danger' : 'text-white/40'}`}>
              {delta > 0 ? '+' : ''}{delta} pts
            </span>
            <span className="text-[13px] text-white/40">· 30d</span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="border-l border-border-subtle px-4 flex flex-col items-center justify-center">
          <MiniSparkline data={SPARKLINE_POINTS} className={`${scoreColor} opacity-70`} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/30 mt-0.5">30d trend</span>
        </div>

        {/* Sub-metrics */}
        <div className="border-l border-border-subtle flex items-stretch">
          {[
            { label: 'Citation Eligibility', value: citationEligibility },
            { label: 'AI Ingestion', value: aiIngestion },
            { label: 'Cross-Pillar', value: crossPillarImpact },
          ].map((m, i) => (
            <div key={m.label} className={`px-4 flex flex-col justify-center ${i > 0 ? 'border-l border-border-subtle' : ''}`}>
              <span className="text-xl font-bold tabular-nums text-white/90 leading-none">{m.value}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mt-1">{m.label}</span>
            </div>
          ))}
        </div>

        {/* Pipeline Flow */}
        <div className="flex-1 border-l border-border-subtle px-5 flex flex-col items-center justify-center min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 mb-1.5">Pipeline</span>
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="text-base font-bold tabular-nums text-white/90">{inProgressCount}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Draft</span>
            </div>
            <span className="text-white/25">→</span>
            <div className="flex flex-col items-center">
              <span className="text-base font-bold tabular-nums text-white/90">1</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Review</span>
            </div>
            <span className="text-white/25">→</span>
            <div className="flex flex-col items-center">
              <span className="text-base font-bold tabular-nums text-white/90">{publishedThisMonth}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Published</span>
            </div>
          </div>
        </div>

        {/* Operational Stats (2×2 grid) */}
        <div className="border-l border-border-subtle pl-5 grid grid-cols-2 gap-x-5 gap-y-2 content-center">
          <div>
            <span className="text-2xl font-bold tabular-nums text-white/90 leading-none">{inProgressCount}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mt-0.5">In Progress</span>
          </div>
          <div>
            <span className="text-2xl font-bold tabular-nums text-white/90 leading-none">{publishedThisMonth}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 block mt-0.5">Published</span>
          </div>
          {topAssetThisMonth && (
            <div>
              <span className="text-2xl font-bold tabular-nums text-semantic-success leading-none">{topAssetThisMonth.score}</span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-semantic-success/70 block mt-0.5">Top CiteMind</span>
            </div>
          )}
          <div>
            {needsAttentionCount > 0 ? (
              <>
                <span className="text-2xl font-bold tabular-nums text-semantic-warning leading-none">{needsAttentionCount}</span>
                <button className="text-[11px] font-bold uppercase tracking-wider text-semantic-warning/70 hover:text-semantic-warning block mt-0.5 transition-colors">
                  Resolve →
                </button>
              </>
            ) : (
              <>
                <span className="text-2xl font-bold tabular-nums text-semantic-success leading-none">0</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-semantic-success/70 block mt-0.5">All Clear</span>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function CopilotSAGECard({
  proposal,
  onApprove,
  onDismiss,
}: {
  proposal: SAGEProposal;
  onApprove?: (id: string) => void;
  onDismiss?: (id: string) => void;
}) {
  const priority = PRIORITY_CONFIG[proposal.priority];
  const tailLine = CROSS_PILLAR_TAILS[proposal.id] || '→ Cross-pillar actions pending';
  const confidence = CONFIDENCE_SCORES[proposal.id] || 0.85;

  return (
    <div
      className={`
        bg-slate-1 border border-border-subtle border-l-2 ${priority.border}
        rounded-xl p-3.5
        transition-all duration-150
        hover:border-slate-5 hover:shadow-[0_0_0_1px_rgba(168,85,247,0.2)]
      `}
    >
      {/* Row 1 — Badges + EVI impact */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border ${priority.badge}`}>
            {priority.label}
          </span>
          <span className="text-[13px] text-white/50">
            {TYPE_LABELS[proposal.type]} · {proposal.topicCluster}
          </span>
        </div>
        <div className="flex items-baseline gap-0.5 flex-shrink-0">
          <span className="text-base font-bold text-semantic-success tabular-nums">
            +{proposal.eviImpact.low}–{proposal.eviImpact.high}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40 ml-0.5">EVI pts</span>
        </div>
      </div>

      {/* Row 2 — Title */}
      <h4 className="text-[15px] font-semibold text-white/90 leading-snug mt-1.5">
        {proposal.title}
      </h4>

      {/* Row 3 — SAGE Reasoning chip + Competitive gap text */}
      <div className="mt-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-iris/70">SAGE Reasoning</span>
      </div>
      <p className="text-sm text-white/65 leading-snug mt-0.5">
        <Lightning className="inline w-3.5 h-3.5 text-brand-iris opacity-80 mr-1 -mt-0.5" weight="fill" />
        {proposal.competitiveGap}
      </p>

      {/* Row 4 — Cross-pillar tail line */}
      <p className="text-xs text-white/45 mt-1">
        {tailLine}
      </p>

      {/* Row 5 — Effort + Confidence + Actions */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-3">
          <span className="text-[13px] text-white/40">
            {EFFORT_LABELS[proposal.effort]} · {proposal.timeEstimate}
          </span>
          <span className="text-xs text-white/45">
            Confidence {confidence.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDismiss?.(proposal.id)}
            className="px-3 py-1.5 text-sm text-white/50 hover:text-white/80 transition-colors"
          >
            Dismiss
          </button>
          <button
            onClick={() => onApprove?.(proposal.id)}
            className="px-3.5 py-1.5 text-sm font-semibold bg-brand-iris text-white/95 rounded-lg hover:bg-brand-iris/90 shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all duration-150"
          >
            Approve & Create Brief →
          </button>
        </div>
      </div>
    </div>
  );
}

function CopilotSAGEQueue({
  proposals,
  onApprove,
  onDismiss,
  onViewAllProposals,
  onCreateManual,
}: {
  proposals: SAGEProposal[];
  onApprove?: (id: string) => void;
  onDismiss?: (id: string) => void;
  onViewAllProposals?: () => void;
  onCreateManual?: () => void;
}) {
  const topProposals = proposals.slice(0, 3);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightning className="w-4 h-4 text-brand-iris" weight="fill" />
          <span className="text-sm font-semibold text-white/90">SAGE Action Queue</span>
          <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-brand-iris/20 text-brand-iris border border-brand-iris/30">
            {proposals.length}
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          {proposals.length > 3 && (
            <button
              onClick={onViewAllProposals}
              className="text-[13px] text-white/40 hover:text-white/70 transition-colors"
            >
              See all →
            </button>
          )}
          <button
            onClick={onCreateManual}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold bg-brand-iris text-white/95 rounded-lg hover:bg-brand-iris/90 shadow-[0_0_14px_rgba(168,85,247,0.35)] transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" weight="regular" />
            Create
          </button>
        </div>
      </div>

      {topProposals.length > 0 ? (
        topProposals.map((p) => (
          <CopilotSAGECard
            key={p.id}
            proposal={p}
            onApprove={onApprove}
            onDismiss={onDismiss}
          />
        ))
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="w-8 h-8 text-brand-iris/40 mb-3" weight="duotone" />
          <p className="text-sm text-white/50">All caught up</p>
          <p className="text-[13px] text-white/30 mt-1">SAGE has no open proposals</p>
        </div>
      )}
    </div>
  );
}

function AttributionFeed({ events }: { events: CrossPillarEvent[] }) {
  if (events.length === 0) return null;

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-1.5 h-1.5 rounded-full bg-brand-iris" />
        <span className="text-sm font-semibold text-white/90">Cross-Pillar Attribution</span>
      </div>

      <div className="flex flex-col">
        {events.slice(0, 4).map((event, i) => {
          const config = EVENT_ICON_MAP[event.type];
          const Icon = config.icon;
          return (
            <div
              key={event.id}
              className={`flex items-start gap-3 py-3.5 ${i > 0 ? 'border-t border-border-subtle' : ''}`}
            >
              <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center ${config.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${config.text}`} weight="fill" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 leading-snug">{event.description}</p>
                <p className="text-[13px] text-white/40 mt-0.5">{event.source}</p>
              </div>
              <div className="flex-shrink-0">
                <span className={`text-sm font-bold tabular-nums ${
                  event.impact > 0 ? 'text-semantic-success' : event.impact < 0 ? 'text-semantic-danger' : 'text-white/30'
                }`}>
                  {event.impact > 0 ? '+' : ''}{event.impact.toFixed(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActiveThemesSection({ themes }: { themes: ContentOverviewData['themes'] }) {
  if (themes.length === 0) return null;

  const visibleThemes = themes.slice(0, 4);

  return (
    <div className="mt-4 pt-4 border-t border-border-subtle">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">Active Themes</span>
        {themes.length > 4 && (
          <button className="text-[13px] text-white/40 hover:text-white/70 transition-colors">
            See all →
          </button>
        )}
      </div>

      <div className="flex flex-col">
        {visibleThemes.map((theme, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-2.5 cursor-pointer ${i > 0 ? 'border-t border-border-subtle' : ''}`}
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/85">{theme.name}</p>
              <p className="text-[13px] text-white/50">{theme.assetCount} assets</p>
            </div>
            <div className="flex items-baseline gap-1.5 flex-shrink-0 ml-3">
              <span className={`text-lg font-bold tabular-nums ${getCiteColor(theme.avgCiteMind)}`}>
                {theme.avgCiteMind}
              </span>
              <span className="text-[13px]">
                {theme.trend === 'up' && <span className="text-semantic-success">↑</span>}
                {theme.trend === 'down' && <span className="text-semantic-danger">↓</span>}
                {theme.trend === 'flat' && <span className="text-white/40">→</span>}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentAssetsSection({
  assets, onViewAsset, onViewLibrary,
}: {
  assets: ContentAsset[];
  onViewAsset?: (id: string) => void;
  onViewLibrary?: () => void;
}) {
  if (assets.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Recent Assets</span>
        <button
          onClick={onViewLibrary}
          className="text-[13px] text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
        >
          View library <ArrowSquareOut className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {assets.slice(0, 3).map((asset) => (
          <ContentAssetCard
            key={asset.id}
            asset={asset}
            density="comfortable"
            onClick={() => onViewAsset?.(asset.id)}
          />
        ))}
      </div>
    </div>
  );
}

function CopilotView({
  data,
  onApproveProposal,
  onDismissProposal,
  onViewAllProposals,
  onViewAsset,
  onViewLibrary,
  onCreateManual,
}: {
  data: ContentOverviewData;
  onApproveProposal?: (id: string) => void;
  onDismissProposal?: (id: string) => void;
  onViewAllProposals?: () => void;
  onViewAsset?: (id: string) => void;
  onViewLibrary?: () => void;
  onCreateManual?: () => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* CiteMind Instrument Strip — full-bleed */}
      <CiteMindInstrumentStrip
        score={data.avgCiteMindScore}
        delta={data.citeMindDelta}
        citationEligibility={data.avgCitationEligibility}
        aiIngestion={data.avgAiIngestion}
        crossPillarImpact={data.avgCrossPillarImpact}
        inProgressCount={data.inProgressCount}
        publishedThisMonth={data.publishedThisMonth}
        topAssetThisMonth={data.topAssetThisMonth}
        needsAttentionCount={data.needsAttentionCount}
      />

      {/* Two-column main: SAGE (hero) | Attribution + Themes + Recent Assets */}
      <div className="px-4 pt-4 pb-6">
        <div className="flex gap-5">
          {/* Left: SAGE Action Queue (~60%) */}
          <div className="flex-[3] min-w-0">
            <CopilotSAGEQueue
              proposals={data.proposals}
              onApprove={onApproveProposal}
              onDismiss={onDismissProposal}
              onViewAllProposals={onViewAllProposals}
              onCreateManual={onCreateManual}
            />
          </div>

          {/* Right: Attribution + Themes + Recent Assets — all above fold */}
          <div className="flex-[2] min-w-0 border-l border-border-subtle pl-5">
            <AttributionFeed events={data.crossPillarFeed} />
            <ActiveThemesSection themes={data.themes} />
            <RecentAssetsSection
              assets={data.recentAssets}
              onViewAsset={onViewAsset}
              onViewLibrary={onViewLibrary}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// AUTOPILOT MODE — "Exception Console"
// ============================================

function AutopilotStatusBar({ onPause }: { onPause?: () => void }) {
  return (
    <div className="bg-slate-1 border-b border-border-subtle">
      <div className="px-4 py-3 flex items-center">
        {/* AI State — IDLE (no tasks) */}
        <div className="flex items-center gap-3 pr-6">
          <span className="w-2.5 h-2.5 rounded-full bg-white/30" />
          <span className="text-base font-bold text-white/90">IDLE</span>
          <span className="text-xs text-white/45">No items supervised</span>
        </div>

        {/* Health Summary */}
        <div className="border-l border-border-subtle px-6 flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">CiteMind</span>
          <span className="text-sm text-white/40">No data</span>
        </div>

        {/* Kill Switch */}
        <div className="ml-auto flex items-center gap-3">
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-brand-iris/15 text-brand-iris border border-brand-iris/25">
            Autopilot
          </span>
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-3.5 py-1.5 text-sm text-white/60 border border-white/20 rounded-lg hover:bg-white/5 hover:text-white/80 transition-colors"
          >
            <Pause className="w-4 h-4" weight="regular" />
            Pause Autopilot
          </button>
        </div>
      </div>
    </div>
  );
}

const URGENCY_CONFIG = {
  critical: {
    border: 'border-l-2 border-l-semantic-danger',
    bg: 'bg-semantic-danger/5',
    badge: 'bg-semantic-danger/15 text-semantic-danger',
  },
  high: {
    border: 'border-l-2 border-l-semantic-warning',
    bg: 'bg-semantic-warning/5',
    badge: 'bg-semantic-warning/15 text-semantic-warning',
  },
};

function ExceptionCard({
  exception,
  onResolve,
}: {
  exception: AutopilotException;
  onResolve?: (id: string) => void;
}) {
  const urgency = URGENCY_CONFIG[exception.urgency];

  return (
    <div className={`${urgency.border} ${urgency.bg} rounded-xl p-4 border border-border-subtle`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded ${urgency.badge}`}>
              {exception.issue}
            </span>
            {exception.citeMindScore > 0 && (
              <span className={`text-[13px] font-bold tabular-nums ${getCiteColor(exception.citeMindScore)}`}>
                {exception.citeMindScore}
              </span>
            )}
          </div>
          <h4 className="text-[15px] font-semibold text-white/90 leading-snug">{exception.title}</h4>
          <p className="text-sm text-white/60 leading-snug mt-1">{exception.reason}</p>
        </div>
      </div>
      <div className="flex justify-end mt-3">
        <button
          onClick={() => onResolve?.(exception.id)}
          className="px-3.5 py-1.5 text-sm font-semibold bg-brand-iris text-white/95 rounded-lg hover:bg-brand-iris/90 shadow-[0_0_12px_rgba(168,85,247,0.2)] transition-all duration-150"
        >
          Resolve →
        </button>
      </div>
    </div>
  );
}

function AllClearState() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 rounded-full bg-semantic-success/10 flex items-center justify-center mb-4">
        <Check className="w-6 h-6 text-semantic-success" weight="bold" />
      </div>
      <h3 className="text-lg font-semibold text-white/90">All clear — no exceptions</h3>
      <p className="text-[13px] text-white/50 mt-1">No items currently executing.</p>
    </div>
  );
}

const ACTIVITY_TYPE_CONFIG = {
  quality:    { icon: CheckCircle,   color: 'text-semantic-success', bg: 'bg-semantic-success/10' },
  derivative: { icon: ArrowSquareOut, color: 'text-brand-iris',       bg: 'bg-brand-iris/10' },
  brief:      { icon: Lightning,      color: 'text-brand-cyan',       bg: 'bg-brand-cyan/10' },
};

function ActivityLogEntry({ entry }: { entry: AutopilotActivity }) {
  const config = ACTIVITY_TYPE_CONFIG[entry.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={`w-7 h-7 rounded-md flex-shrink-0 flex items-center justify-center ${config.bg}`}>
        <Icon className={`w-3.5 h-3.5 ${config.color}`} weight="fill" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/70 leading-snug">{entry.action}</p>
        <p className="text-[13px] text-white/50">{entry.asset}</p>
        <p className="text-[13px] text-white/40 mt-0.5">{entry.result}</p>
      </div>
      <span className="text-[13px] text-white/30 flex-shrink-0">{entry.timestamp}</span>
    </div>
  );
}

function AutopilotView({
  onResolveException,
  onPauseAutopilot,
}: {
  onResolveException?: (id: string) => void;
  onPauseAutopilot?: () => void;
}) {
  const exceptions = AUTOPILOT_EXCEPTIONS_MOCK;
  const activities = AUTOPILOT_ACTIVITY_MOCK;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <AutopilotStatusBar onPause={onPauseAutopilot} />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Exception Queue (~55%) */}
        <div className="flex-[55] min-w-0 overflow-y-auto px-4 py-4">
          <div className="flex items-center gap-2 mb-4">
            <Warning className="w-4 h-4 text-semantic-warning" weight="fill" />
            <span className="text-sm font-semibold text-white/90">Exceptions</span>
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded-full bg-semantic-warning/20 text-semantic-warning border border-semantic-warning/30">
              {exceptions.length}
            </span>
          </div>

          {exceptions.length > 0 ? (
            <div className="flex flex-col gap-3">
              {exceptions.map((ex) => (
                <ExceptionCard key={ex.id} exception={ex} onResolve={onResolveException} />
              ))}
            </div>
          ) : (
            <AllClearState />
          )}
        </div>

        {/* Right: Activity Log (~45%) */}
        <div className="flex-[45] min-w-0 overflow-y-auto border-l border-border-subtle px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" weight="regular" />
              <span className="text-sm font-semibold text-white/90">Activity Log</span>
            </div>
            <button className="text-[13px] text-white/40 hover:text-white/70 transition-colors">
              View full log →
            </button>
          </div>

          <div className="flex flex-col">
            {activities.length > 0 ? (
              activities.map((entry, i) => (
                <div key={entry.id} className={i > 0 ? 'border-t border-border-subtle' : ''}>
                  <ActivityLogEntry entry={entry} />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <p className="text-sm text-white/50">No activity yet</p>
                <p className="text-[13px] text-white/30 mt-1">Autopilot activity will appear here as tasks execute.</p>
              </div>
            )}
          </div>

          {/* Cross-pillar impact — collapsed by default */}
          <button
            type="button"
            className="mt-4 pt-3 border-t border-border-subtle w-full text-left text-[13px] text-white/40 hover:text-white/60 transition-colors flex items-center gap-1.5"
          >
            Show cross-pillar impact
            <CaretDown className="w-3 h-3" weight="regular" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentOverviewView({
  data,
  mode = 'copilot',
  onCreateFromBrief,
  onApproveProposal,
  onDismissProposal,
  onResolveException,
  onPauseAutopilot,
  onViewAllProposals,
  onViewAsset,
  onViewLibrary,
  onCreateManual,
}: ContentOverviewViewProps) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayMode, setDisplayMode] = useState(mode);

  useEffect(() => {
    if (mode !== displayMode) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayMode(mode);
        setIsTransitioning(false);
      }, 800);
      return () => clearTimeout(timer);
    }
    setIsTransitioning(false);
    return undefined;
  }, [mode, displayMode]);

  if (isTransitioning) {
    return <ModeTransition />;
  }

  if (displayMode === 'manual') {
    return <ManualView data={data} onViewAsset={onViewAsset} />;
  }

  if (displayMode === 'autopilot') {
    return (
      <AutopilotView
        onResolveException={onResolveException}
        onPauseAutopilot={onPauseAutopilot}
      />
    );
  }

  // Default: Copilot — "Plan Review"
  return (
    <CopilotView
      data={data}
      onApproveProposal={onApproveProposal || onCreateFromBrief}
      onDismissProposal={onDismissProposal}
      onViewAllProposals={onViewAllProposals}
      onViewAsset={onViewAsset}
      onViewLibrary={onViewLibrary}
      onCreateManual={onCreateManual}
    />
  );
}
