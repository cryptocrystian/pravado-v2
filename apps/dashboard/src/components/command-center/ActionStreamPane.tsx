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
 * ActionStreamPane v3.0 - Auto-Compact Density + Progressive Disclosure
 *
 * AUTO-COMPACT MODE:
 * - When cards exceed pane height, automatically switches to compact layout
 * - Compact: Title + pillar + priority (single line, no paragraphs)
 * - Toggle available: Auto | Compact | Expanded
 *
 * PROGRESSIVE DISCLOSURE (3 Layers):
 * - Layer 1 (Card): Minimal - title, pillar badge, priority dot, conf/impact pills
 * - Layer 2 (Hover): Overlay reveal - summary line, time estimate, gated chip
 * - Layer 3 (Drawer): Full details via ActionPeekDrawer
 *
 * GROUPING:
 * - Critical/Urgent actions pinned to top
 * - Others sorted by confidence descending
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
type DensityMode = 'auto' | 'compact' | 'expanded';

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
}> = {
  pr: {
    border: 'border-l-brand-magenta',
    bg: 'bg-brand-magenta/5',
    text: 'text-brand-magenta',
    glow: 'shadow-[0_0_16px_rgba(232,121,249,0.12)]',
    glowIntense: 'shadow-[0_0_20px_rgba(232,121,249,0.2)]',
    badge: 'bg-brand-magenta/15 text-brand-magenta border-brand-magenta/30',
  },
  content: {
    border: 'border-l-brand-iris',
    bg: 'bg-brand-iris/5',
    text: 'text-brand-iris',
    glow: 'shadow-[0_0_16px_rgba(168,85,247,0.12)]',
    glowIntense: 'shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    badge: 'bg-brand-iris/15 text-brand-iris border-brand-iris/30',
  },
  seo: {
    border: 'border-l-brand-cyan',
    bg: 'bg-brand-cyan/5',
    text: 'text-brand-cyan',
    glow: 'shadow-[0_0_16px_rgba(0,217,255,0.12)]',
    glowIntense: 'shadow-[0_0_20px_rgba(0,217,255,0.2)]',
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
  low: { dot: 'bg-white/30', label: 'Low', urgent: false },
};

// Compact confidence/impact pill
function MetricPill({ value, label }: { value: number; label: string }) {
  const percentage = Math.round(value * 100);
  return (
    <span className="px-1.5 py-0.5 text-[8px] font-bold bg-[#1A1A24] text-white/70 rounded">
      {label[0]}: {percentage}%
    </span>
  );
}

/**
 * CompactActionCard - Ultra-dense single-line card
 * Used in auto-compact mode when list exceeds viewport
 *
 * MARKER: action-card-hover-peek (for CI guardrail check)
 */
function CompactActionCard({
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
        group relative bg-[#0D0D12] rounded overflow-hidden cursor-pointer
        border-l-[3px] ${pillar.border}
        border border-[#1A1A24] border-l-0
        transition-all duration-200 ease-out
        hover:bg-[#111116] hover:border-[#2A2A36]
        ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
        focus:outline-none focus:ring-1 focus:ring-brand-cyan/40
      `}
    >
      <div className="relative px-2.5 py-2 flex items-center gap-2">
        {/* Priority Dot */}
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priority.dot}`} />

        {/* Pillar Badge - compact */}
        <span className={`px-1 py-0.5 text-[8px] font-bold uppercase rounded border flex-shrink-0 ${pillar.badge}`}>
          {action.pillar}
        </span>

        {/* Title - truncated */}
        <span className="flex-1 text-[11px] font-medium text-white/90 truncate">
          {action.title}
        </span>

        {/* Metric pills */}
        <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
          <MetricPill value={action.confidence} label="Conf" />
          <MetricPill value={action.impact} label="Impact" />
        </div>

        {/* Hover reveal: arrow */}
        <svg
          className="w-3 h-3 text-white/30 group-hover:text-brand-cyan transition-colors flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* LAYER 2: Hover overlay with summary */}
      <div className="absolute inset-0 bg-[#0D0D12]/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center px-2.5 pointer-events-none">
        <p className="text-[10px] text-white/70 truncate flex-1">{action.summary}</p>
        {action.gate.required && (
          <span className="px-1 py-0.5 text-[7px] font-medium text-semantic-warning bg-semantic-warning/10 rounded border border-semantic-warning/20 flex-shrink-0 ml-2">
            Gated
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * ExpandedActionCard - Full card with progressive disclosure
 *
 * MARKER: action-card-hover-peek (for CI guardrail check)
 */
function ExpandedActionCard({
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
        ${isSelected ? `${pillar.glow} border-[#2A2A36]` : ''}
        focus:outline-none focus:ring-1 focus:ring-brand-cyan/40
      `}
    >
      {/* Subtle gradient overlay on hover */}
      <div className={`absolute inset-0 ${pillar.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative p-3">
        {/* LAYER 1: Essential Info */}

        {/* Header Row */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${pillar.badge}`}>
              {action.pillar}
            </span>
            {action.mode === 'autopilot' && (
              <span className="px-1 py-0.5 text-[8px] font-medium uppercase rounded bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20">
                Auto
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
            <span className={`text-[9px] ${priority.urgent ? 'text-semantic-warning font-medium' : 'text-white/50'}`}>
              {priority.label}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[12px] font-semibold text-white/90 mb-1 leading-snug line-clamp-2">
          {action.title}
        </h3>

        {/* Metric pills row */}
        <div className="flex items-center gap-2 mb-1.5">
          <MetricPill value={action.confidence} label="Conf" />
          <MetricPill value={action.impact} label="Impact" />
          {action.gate.required && (
            <span className="px-1 py-0.5 text-[7px] font-medium text-semantic-warning bg-semantic-warning/10 rounded border border-semantic-warning/20">
              Gated
            </span>
          )}
        </div>

        {/* LAYER 2: Hover reveal - summary + CTA */}
        <div className="overflow-hidden transition-all duration-300 ease-out max-h-0 group-hover:max-h-16 opacity-0 group-hover:opacity-100">
          <p className="text-[10px] text-white/60 line-clamp-2 mb-2">{action.summary}</p>
          <div className="flex items-center justify-between">
            <span className="text-[8px] text-white/40">~5 min</span>
            <span className="text-[9px] text-brand-cyan flex items-center gap-1">
              View details
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ compact }: { compact: boolean }) {
  if (compact) {
    return (
      <div className="p-2 space-y-1">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-8 bg-[#0D0D12] border-l-[3px] border-l-white/10 border border-[#1A1A24] border-l-0 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-3 space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-3 bg-[#0D0D12] border-l-[3px] border-l-white/10 border border-[#1A1A24] border-l-0 rounded-lg animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-10 bg-[#1A1A24] rounded" />
            <div className="h-3 w-12 bg-[#1A1A24] rounded" />
          </div>
          <div className="h-4 w-4/5 bg-[#1A1A24] rounded mb-2" />
          <div className="flex gap-2">
            <div className="h-4 w-12 bg-[#1A1A24] rounded" />
            <div className="h-4 w-12 bg-[#1A1A24] rounded" />
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
            <p className="text-[10px] text-white/50 mt-0.5">{error.message}</p>
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
        <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <p className="text-xs text-white/50 font-medium">No pending actions</p>
      <p className="text-[10px] text-white/30 mt-1">AI is analyzing your strategy</p>
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
  const [densityMode, setDensityMode] = useState<DensityMode>('auto');
  const [shouldCompact, setShouldCompact] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Auto-compact detection: if content would overflow, switch to compact
  useEffect(() => {
    if (densityMode !== 'auto' || !listRef.current || !contentRef.current) return;

    const checkOverflow = () => {
      const container = listRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      // If content height > container height, need compact mode
      const containerHeight = container.clientHeight;
      const contentHeight = content.scrollHeight;
      setShouldCompact(contentHeight > containerHeight + 50); // 50px buffer
    };

    checkOverflow();
    // Recheck on resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [densityMode, data]);

  const isCompact = densityMode === 'compact' || (densityMode === 'auto' && shouldCompact);

  // Filter and sort actions
  const processedItems = useMemo(() => {
    if (!data?.items) return [];

    // Filter
    let items = data.items.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'urgent') return item.priority === 'critical' || item.priority === 'high';
      if (activeFilter === 'draft') return item.mode === 'manual';
      if (activeFilter === 'proposed') return item.mode === 'copilot' || item.mode === 'autopilot';
      if (activeFilter === 'signal') return item.confidence > 0.8;
      return true;
    });

    // Sort: Critical/High at top, then by confidence
    items = items.sort((a, b) => {
      const aUrgent = a.priority === 'critical' || a.priority === 'high';
      const bUrgent = b.priority === 'critical' || b.priority === 'high';
      if (aUrgent && !bUrgent) return -1;
      if (!aUrgent && bUrgent) return 1;
      // Within same urgency tier, sort by confidence
      return b.confidence - a.confidence;
    });

    return items;
  }, [data, activeFilter]);

  // Count items per filter
  const counts = useMemo(() => ({
    all: data?.items.length || 0,
    urgent: data?.items.filter(i => i.priority === 'critical' || i.priority === 'high').length || 0,
    draft: data?.items.filter(i => i.mode === 'manual').length || 0,
    proposed: data?.items.filter(i => i.mode === 'copilot' || i.mode === 'autopilot').length || 0,
    signal: data?.items.filter(i => i.confidence > 0.8).length || 0,
  }), [data]);

  const handleActionClick = useCallback((action: ActionItem) => {
    onActionSelect?.(action);
  }, [onActionSelect]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Filter Tabs + Density Toggle */}
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-b border-[#1A1A24] bg-[#0A0A0F] flex-shrink-0">
        {/* Filter Tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {filterTabs.map((tab) => {
            const count = counts[tab.key];
            const isActive = activeFilter === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`
                  px-2 py-1 text-[9px] font-semibold uppercase tracking-wide rounded
                  transition-all duration-200 ease-out whitespace-nowrap
                  ${isActive
                    ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                    : 'text-white/50 hover:text-white/90 hover:bg-[#1A1A24]'
                  }
                `}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1 ${isActive ? 'text-brand-cyan/70' : 'text-white/30'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Density Toggle */}
        <div className="flex items-center bg-[#0D0D12] rounded p-0.5 border border-[#1A1A24] flex-shrink-0">
          {(['auto', 'compact', 'expanded'] as DensityMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setDensityMode(mode)}
              className={`
                px-1.5 py-0.5 text-[8px] font-medium rounded transition-colors
                ${densityMode === mode ? 'bg-white/10 text-white/90' : 'text-white/40 hover:text-white/70'}
              `}
              title={mode === 'auto' ? 'Auto-compact when overflow' : mode === 'compact' ? 'Always compact' : 'Always expanded'}
            >
              {mode === 'auto' ? 'A' : mode === 'compact' ? 'C' : 'E'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton compact={isCompact} />
        ) : error ? (
          <ErrorState error={error} />
        ) : processedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div ref={contentRef} className={isCompact ? 'p-2 space-y-1' : 'p-3 space-y-2'}>
            {/* Urgent section header if any urgent items */}
            {processedItems.some(i => i.priority === 'critical' || i.priority === 'high') && activeFilter === 'all' && (
              <div className="flex items-center gap-1.5 px-1 py-0.5 mb-1">
                <span className="w-1 h-1 rounded-full bg-semantic-danger animate-pulse" />
                <span className="text-[8px] font-semibold text-semantic-danger uppercase tracking-wider">Urgent</span>
              </div>
            )}

            {processedItems.map((action, index) => {
              // Add divider after urgent items
              const isUrgent = action.priority === 'critical' || action.priority === 'high';
              const nextItem = processedItems[index + 1];
              const nextIsNotUrgent = nextItem && nextItem.priority !== 'critical' && nextItem.priority !== 'high';
              const showDivider = isUrgent && nextIsNotUrgent && activeFilter === 'all';

              return (
                <div key={action.id}>
                  {isCompact ? (
                    <CompactActionCard
                      action={action}
                      onClick={() => handleActionClick(action)}
                      isSelected={selectedActionId === action.id}
                    />
                  ) : (
                    <ExpandedActionCard
                      action={action}
                      onClick={() => handleActionClick(action)}
                      isSelected={selectedActionId === action.id}
                    />
                  )}
                  {showDivider && (
                    <div className="flex items-center gap-1.5 px-1 py-1 mt-1.5">
                      <div className="flex-1 h-px bg-[#1A1A24]" />
                      <span className="text-[7px] text-white/30 uppercase tracking-wider">Other</span>
                      <div className="flex-1 h-px bg-[#1A1A24]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
