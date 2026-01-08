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
 * ActionStreamPane - Action Stream Display
 *
 * Displays prioritized action items from the AI.
 * Features:
 * - Filter tabs (All, Draft, Proposed, etc.)
 * - Cards with LEFT BORDER accents (pillar-colored)
 * - Compact, information-dense, urgent styling
 * - Confidence/impact meters
 * - Gate warnings and CTA buttons
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
  badge: string;
}> = {
  pr: {
    border: 'border-l-brand-magenta',
    bg: 'bg-brand-magenta/5',
    text: 'text-brand-magenta',
    glow: 'shadow-[0_0_20px_rgba(232,121,249,0.12)]',
    badge: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30',
  },
  content: {
    border: 'border-l-brand-iris',
    bg: 'bg-brand-iris/5',
    text: 'text-brand-iris',
    glow: 'shadow-[0_0_20px_rgba(168,85,247,0.12)]',
    badge: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30',
  },
  seo: {
    border: 'border-l-brand-cyan',
    bg: 'bg-brand-cyan/5',
    text: 'text-brand-cyan',
    glow: 'shadow-[0_0_20px_rgba(0,217,255,0.12)]',
    badge: 'bg-brand-cyan/15 text-brand-cyan border-brand-cyan/30',
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
        group relative bg-[#0D0D12] rounded-lg overflow-hidden cursor-pointer
        border-l-[3px] ${pillar.border}
        border border-[#1A1A24] border-l-0
        transition-all duration-200
        hover:bg-[#111116] hover:border-[#2A2A36]
        ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
        focus:outline-none focus:ring-1 focus:ring-brand-cyan/40
      `}
    >
      {/* Subtle gradient overlay */}
      <div className={`absolute inset-0 ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity`} />

      <div className="relative p-3">
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

        {/* Title */}
        <h3 className="text-[13px] font-semibold text-white mb-1 leading-snug line-clamp-2 group-hover:text-white/90">
          {action.title}
        </h3>

        {/* Summary */}
        <p className="text-[11px] text-slate-5 mb-2.5 line-clamp-2 leading-relaxed">
          {action.summary}
        </p>

        {/* Confidence & Impact Meters - Compact inline */}
        <div className="flex gap-3 mb-2.5">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-slate-6 uppercase tracking-wide">Conf</span>
              <span className="text-[9px] text-white font-bold">{Math.round(action.confidence * 100)}%</span>
            </div>
            <div className="h-0.5 bg-[#1A1A24] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-cyan to-brand-cyan/60 rounded-full"
                style={{ width: `${action.confidence * 100}%` }}
              />
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-slate-6 uppercase tracking-wide">Impact</span>
              <span className="text-[9px] text-white font-bold">{Math.round(action.impact * 100)}%</span>
            </div>
            <div className="h-0.5 bg-[#1A1A24] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-iris to-brand-iris/60 rounded-full"
                style={{ width: `${action.impact * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Gate Warning - Compact */}
        {action.gate.required && (
          <div className="flex items-center gap-1.5 px-2 py-1 mb-2.5 bg-semantic-warning/8 border border-semantic-warning/20 rounded text-[10px]">
            <svg className="w-3 h-3 text-semantic-warning flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-semantic-warning truncate">
              {action.gate.reason || 'Requires approval'}
            </span>
          </div>
        )}

        {/* CTA Buttons - Compact */}
        <div className="flex gap-1.5">
          <button
            className={`
              flex-1 px-2.5 py-1.5 text-[10px] font-semibold rounded
              ${pillar.badge}
              hover:brightness-110 transition-all duration-150
            `}
          >
            {action.cta.primary}
          </button>
          <button className="px-2.5 py-1.5 text-[10px] font-medium text-slate-5 hover:text-white hover:bg-[#1A1A24] rounded transition-colors">
            {action.cta.secondary}
          </button>
        </div>
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
                transition-all duration-150 whitespace-nowrap
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
