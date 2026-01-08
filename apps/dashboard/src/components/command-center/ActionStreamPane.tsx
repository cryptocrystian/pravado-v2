'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * ActionStreamPane - Progressive Disclosure Action Stream
 *
 * 3-Layer Progressive Disclosure System:
 * - Layer 1 (Card): Outcome-first, compact cards with essential info
 * - Layer 2 (Hover): Ghost reveal of extra details + peek affordance
 * - Layer 3 (Drawer): Full details via ActionPeekDrawer (on click)
 *
 * Features:
 * - Filter tabs (All, Draft, Proposed, etc.)
 * - Cards with LEFT BORDER accents (pillar-colored)
 * - Micro-interactions: glow intensify, meter animation, consistent easing
 * - Gated/upgrade CTAs consolidated in drawer (Layer 3)
 *
 * @see /contracts/examples/action-stream.json
 */

import { useState } from 'react';
import type { ActionItem, ActionStreamResponse, Pillar, Priority } from './types';

interface ActionStreamPaneProps {
  data: ActionStreamResponse | null;
  isLoading: boolean;
  error: Error | null;
  onActionSelect?: (action: ActionItem) => void;
  selectedActionId?: string | null;
}

// Filter tabs configuration
type FilterTab = 'all' | 'draft' | 'proposed' | 'urgent' | 'signal';

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'signal', label: 'Signal' },
];

// Pillar LEFT BORDER accent colors (DS v3 style)
const pillarAccents: Record<Pillar, {
  border: string;
  bg: string;
  text: string;
  glow: string;
  glowIntense: string;
  badge: string;
  meterGradient: string;
}> = {
  pr: {
    border: 'border-l-brand-magenta',
    bg: 'bg-brand-magenta/5',
    text: 'text-brand-magenta',
    glow: 'shadow-[0_0_20px_rgba(232,121,249,0.12)]',
    glowIntense: 'shadow-[0_0_28px_rgba(232,121,249,0.25)]',
    badge: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30',
    meterGradient: 'from-brand-magenta to-brand-magenta/60',
  },
  content: {
    border: 'border-l-brand-iris',
    bg: 'bg-brand-iris/5',
    text: 'text-brand-iris',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.12)]',
    glowIntense: 'shadow-[0_0_28px_rgba(168,85,247,0.25)]',
    badge: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30',
    meterGradient: 'from-brand-iris to-brand-iris/60',
  },
  seo: {
    border: 'border-l-brand-cyan',
    bg: 'bg-brand-cyan/5',
    text: 'text-brand-cyan',
    glow: 'shadow-[0_0_20px_rgba(0,217,255,0.12)]',
    glowIntense: 'shadow-[0_0_28px_rgba(0,217,255,0.25)]',
    badge: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
    meterGradient: 'from-brand-cyan to-brand-cyan/60',
  },
};

// Priority styling with urgency indicators
const priorityConfig: Record<Priority, {
  dot: string;
  label: string;
  urgent: boolean;
}> = {
  critical: { dot: 'bg-semantic-danger animate-pulse', label: 'Critical', urgent: true },
  high: { dot: 'bg-semantic-warning', label: 'High', urgent: true },
  medium: { dot: 'bg-brand-cyan', label: 'Medium', urgent: false },
  low: { dot: 'bg-slate-5', label: 'Low', urgent: false },
};

// Animated meter bar component
function AnimatedMeter({
  value,
  label,
  colorClass,
}: {
  value: number;
  label: string;
  colorClass: string;
}) {
  const percentage = Math.round(value * 100);

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[9px] text-slate-6 uppercase tracking-wide">{label}</span>
        <span className="text-[9px] text-white font-bold">{percentage}%</span>
      </div>
      <div className="h-1 bg-[#1A1A24] rounded-full overflow-hidden">
        <div
          className={`h-full bg-gradient-to-r ${colorClass} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * ActionCard - 3-Layer Progressive Disclosure
 *
 * Layer 1: Compact card showing outcome + pillar + priority
 * Layer 2: Hover reveals ghost details (extra chips, peek affordance)
 * Layer 3: Click opens drawer with full details
 *
 * MARKER: action-card-hover-peek (for CI guardrail check)
 */
function ActionCard({
  action,
  onClick,
  isSelected,
}: {
  action: ActionItem;
  onClick?: () => void;
  isSelected?: boolean;
}) {
  const pillar = pillarAccents[action.pillar];
  const priority = priorityConfig[action.priority];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`
        action-card-hover-peek
        group relative bg-[#0D0D12] rounded-lg overflow-hidden cursor-pointer
        border-l-[3px] ${pillar.border}
        border border-[#1A1A24] border-l-0
        transition-all duration-300 ease-out
        hover:bg-[#111116] hover:border-[#2A2A36]
        hover:${pillar.glowIntense}
        ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
        focus:outline-none focus:ring-1 focus:ring-brand-cyan/40
      `}
    >
      {/* Subtle gradient overlay - intensifies on hover */}
      <div className={`absolute inset-0 ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative p-3">
        {/* LAYER 1: Essential Info (Always Visible) */}

        {/* Header Row: Pillar Badge + Priority + Mode */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border ${pillar.badge}`}>
              {action.pillar}
            </span>
            {action.mode === 'autopilot' && (
              <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Auto
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            <span className={`text-[10px] ${priority.urgent ? 'text-semantic-warning font-medium' : 'text-slate-5'}`}>
              {priority.label}
            </span>
          </div>
        </div>

        {/* Title - Outcome-first */}
        <h3 className="text-[13px] font-semibold text-white mb-1 leading-snug line-clamp-2 group-hover:text-white/95">
          {action.title}
        </h3>

        {/* Summary - Layer 1 truncated */}
        <p className="text-[11px] text-slate-5 mb-2.5 line-clamp-2 leading-relaxed group-hover:text-slate-4 transition-colors duration-200">
          {action.summary}
        </p>

        {/* Confidence & Impact Meters - Animated */}
        <div className="flex gap-3 mb-2.5">
          <AnimatedMeter
            value={action.confidence}
            label="Conf"
            colorClass="from-brand-cyan to-brand-cyan/60"
          />
          <AnimatedMeter
            value={action.impact}
            label="Impact"
            colorClass="from-brand-iris to-brand-iris/60"
          />
        </div>

        {/* LAYER 2: Ghost Reveal (Visible on Hover) */}
        <div className="overflow-hidden transition-all duration-300 ease-out max-h-0 group-hover:max-h-20 opacity-0 group-hover:opacity-100">
          {/* Extra chips row */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {/* Time estimate chip */}
            <span className="px-1.5 py-0.5 text-[8px] font-medium text-slate-5 bg-[#1A1A24] rounded">
              ~5 min
            </span>
            {/* Confidence qualifier */}
            {action.confidence >= 0.8 && (
              <span className="px-1.5 py-0.5 text-[8px] font-medium text-semantic-success bg-semantic-success/10 rounded border border-semantic-success/20">
                High conf
              </span>
            )}
            {/* Gate indicator (minimal in Layer 2) */}
            {action.gate.required && (
              <span className="px-1.5 py-0.5 text-[8px] font-medium text-semantic-warning bg-semantic-warning/10 rounded border border-semantic-warning/20">
                Gated
              </span>
            )}
          </div>

          {/* Peek affordance */}
          <div className="flex items-center justify-center gap-1 text-[9px] text-slate-5 group-hover:text-brand-cyan transition-colors">
            <span>Click for full details</span>
            <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        {/* LAYER 1: CTA Buttons (Compact) */}
        <div className="flex gap-1.5 mt-2">
          <button
            className={`
              flex-1 px-2.5 py-1.5 text-[10px] font-semibold rounded
              ${pillar.badge}
              hover:brightness-110 transition-all duration-200
            `}
            onClick={(e) => {
              e.stopPropagation();
              // Primary CTA handler - Layer 1 quick action
            }}
          >
            {action.cta.primary}
          </button>
          <button
            className="px-2.5 py-1.5 text-[10px] font-medium text-slate-5 hover:text-white hover:bg-[#1A1A24] rounded transition-colors duration-200"
            onClick={(e) => {
              e.stopPropagation();
              // Secondary CTA handler
            }}
          >
            {action.cta.secondary}
          </button>
        </div>

        {/* Gate warning moved to Layer 3 (Drawer) for cleaner cards */}
        {/* Note: Gate indicator chip shown in Layer 2 hover state */}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-3 space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="p-3 bg-[#0D0D12] border-l-[3px] border-l-slate-5 border border-[#1A1A24] border-l-0 rounded-lg animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-10 bg-[#1A1A24] rounded" />
            <div className="h-3 w-12 bg-[#1A1A24] rounded" />
          </div>
          <div className="h-4 w-4/5 bg-[#1A1A24] rounded mb-1.5" />
          <div className="h-3 w-full bg-[#1A1A24] rounded mb-1" />
          <div className="h-3 w-3/4 bg-[#1A1A24] rounded mb-3" />
          <div className="flex gap-1.5">
            <div className="h-6 flex-1 bg-[#1A1A24] rounded" />
            <div className="h-6 w-14 bg-[#1A1A24] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-3">
      <div className="p-3 bg-semantic-danger/8 border border-semantic-danger/20 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-semantic-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-xs font-semibold text-semantic-danger">Failed to load actions</h4>
            <p className="text-[10px] text-slate-5 mt-0.5">{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#1A1A24] flex items-center justify-center">
        <svg className="w-6 h-6 text-slate-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <p className="text-xs text-slate-5 font-medium">No pending actions</p>
      <p className="text-[10px] text-slate-6 mt-1">AI is analyzing your strategy</p>
    </div>
  );
}

export function ActionStreamPane({
  data,
  isLoading,
  error,
  onActionSelect,
  selectedActionId,
}: ActionStreamPaneProps) {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Filter actions based on active tab
  const filteredItems = data?.items.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'urgent') return item.priority === 'critical' || item.priority === 'high';
    if (activeFilter === 'draft') return item.mode === 'manual';
    if (activeFilter === 'proposed') return item.mode === 'copilot' || item.mode === 'autopilot';
    if (activeFilter === 'signal') return item.confidence > 0.8;
    return true;
  }) || [];

  // Count items per filter
  const counts = {
    all: data?.items.length || 0,
    urgent: data?.items.filter(i => i.priority === 'critical' || i.priority === 'high').length || 0,
    draft: data?.items.filter(i => i.mode === 'manual').length || 0,
    proposed: data?.items.filter(i => i.mode === 'copilot' || i.mode === 'autopilot').length || 0,
    signal: data?.items.filter(i => i.confidence > 0.8).length || 0,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filter Tabs */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[#1A1A24] bg-[#0A0A0F] overflow-x-auto">
        {filterTabs.map((tab) => {
          const count = counts[tab.key];
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`
                px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide rounded
                transition-all duration-200 ease-out whitespace-nowrap
                ${isActive
                  ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                  : 'text-slate-5 hover:text-white hover:bg-[#1A1A24]'
                }
              `}
            >
              {tab.label}
              {count > 0 && (
                <span className={`ml-1 ${isActive ? 'text-brand-cyan/70' : 'text-slate-6'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState error={error} />
        ) : filteredItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="p-3 space-y-2">
            {filteredItems.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onClick={() => onActionSelect?.(action)}
                isSelected={selectedActionId === action.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
