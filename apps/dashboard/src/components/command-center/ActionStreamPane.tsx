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
 * ActionStreamPane v5.0 - UX Pilot Reference Match
 *
 * TRUE ADAPTIVE DENSITY:
 * - Computes density based on available space AND card count
 * - Few cards = comfortable/standard (no empty space)
 * - Many cards = compact/ultra-compact (maximize visible)
 *
 * DENSITY LEVELS:
 * - Comfortable (1-3 cards): Full details, large CTAs, metrics row
 * - Standard (4-7 cards): Title, summary, CTA row
 * - Compact (8-14 cards): Title, CTA row only
 * - Ultra-compact (15+ cards): Single line, title only
 *
 * ON-CARD CTAs:
 * - Primary: Execute / Auto-Fix / Send Email (contextual)
 * - Secondary: Review / Details
 *
 * PROGRESSIVE DISCLOSURE (3 Layers):
 * - LAYER 1 (Card): Content scales with adaptive density
 * - LAYER 2 (Hover): Background tint via group-hover:opacity transitions
 * - LAYER 3 (Drawer): Full details via ActionPeekDrawer
 *
 * Card component uses action-card-hover-peek class for hover states.
 * See ActionCard.tsx for card implementation with group-hover:max-h patterns.
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ActionCard, type DensityLevel } from './ActionCard';
import type { ActionItem, ActionStreamResponse, Priority } from './types';

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

// Height thresholds for adaptive density
const DENSITY_THRESHOLDS = {
  comfortable: { maxCards: 3, minHeightPerCard: 140 },
  standard: { maxCards: 7, minHeightPerCard: 90 },
  compact: { maxCards: 14, minHeightPerCard: 52 },
  ultraCompact: { minHeightPerCard: 32 },
};

const filterTabs: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'proposed', label: 'Proposed' },
  { key: 'urgent', label: 'Urgent' },
  { key: 'signal', label: 'Signal' },
];

// Priority styling for grouping headers
const priorityConfig: Record<Priority, { dot: string; urgent: boolean }> = {
  critical: { dot: 'bg-semantic-danger animate-pulse', urgent: true },
  high: { dot: 'bg-semantic-warning', urgent: true },
  medium: { dot: 'bg-brand-cyan', urgent: false },
  low: { dot: 'bg-white/30', urgent: false },
};

/**
 * Calculate optimal density level based on available space and card count
 */
function calculateDensityLevel(availableHeight: number, cardCount: number): DensityLevel {
  if (cardCount === 0) return 'comfortable';

  // Calculate minimum height needed for each density level
  const padding = 24; // Container padding
  const headerHeight = 0; // Section headers if any
  const usableHeight = availableHeight - padding - headerHeight;

  // Check if we can fit all cards at each density level
  const heightPerCard = usableHeight / cardCount;

  if (cardCount <= DENSITY_THRESHOLDS.comfortable.maxCards && heightPerCard >= DENSITY_THRESHOLDS.comfortable.minHeightPerCard) {
    return 'comfortable';
  }

  if (cardCount <= DENSITY_THRESHOLDS.standard.maxCards && heightPerCard >= DENSITY_THRESHOLDS.standard.minHeightPerCard) {
    return 'standard';
  }

  if (cardCount <= DENSITY_THRESHOLDS.compact.maxCards && heightPerCard >= DENSITY_THRESHOLDS.compact.minHeightPerCard) {
    return 'compact';
  }

  return 'ultra-compact';
}

function LoadingSkeleton({ density }: { density: DensityLevel }) {
  const skeletonCount = density === 'ultra-compact' ? 8 : density === 'compact' ? 6 : density === 'standard' ? 4 : 3;
  const skeletonHeight = density === 'ultra-compact' ? 'h-8' : density === 'compact' ? 'h-14' : density === 'standard' ? 'h-24' : 'h-36';

  return (
    <div className={density === 'ultra-compact' || density === 'compact' ? 'p-2 space-y-1' : 'p-3 space-y-2'}>
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <div key={i} className={`${skeletonHeight} bg-[#0D0D12] border-l-[3px] border-l-white/10 border border-[#1A1A24] border-l-0 rounded-lg animate-pulse`} />
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
            <p className="text-xs text-white/55 mt-0.5">{error.message}</p>
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
      <p className="text-sm text-white/70 font-medium">No pending actions</p>
      <p className="text-xs text-white/40 mt-1">AI is analyzing your strategy</p>
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
  const [computedDensity, setComputedDensity] = useState<DensityLevel>('standard');
  const listRef = useRef<HTMLDivElement>(null);

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
      return b.confidence - a.confidence;
    });

    return items;
  }, [data, activeFilter]);

  // Adaptive density calculation
  useLayoutEffect(() => {
    if (!listRef.current || !data?.items) return;

    const calculateDensity = () => {
      const container = listRef.current;
      if (!container) return;

      const availableHeight = container.clientHeight;
      const cardCount = processedItems.length;

      setComputedDensity(calculateDensityLevel(availableHeight, cardCount));
    };

    calculateDensity();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(calculateDensity);
    resizeObserver.observe(listRef.current);

    return () => resizeObserver.disconnect();
  }, [data, processedItems.length]);

  // Determine effective density level based on mode
  const effectiveDensity: DensityLevel = useMemo(() => {
    if (densityMode === 'compact') return 'compact';
    if (densityMode === 'expanded') return 'comfortable';
    return computedDensity;
  }, [densityMode, computedDensity]);

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

  const handlePrimaryAction = useCallback((action: ActionItem) => {
    // In real implementation, this would execute the action
    console.log('Primary action:', action.cta.primary, action.id);
    // For now, open the drawer to show details
    onActionSelect?.(action);
  }, [onActionSelect]);

  const handleSecondaryAction = useCallback((action: ActionItem) => {
    // Secondary action opens the drawer
    onActionSelect?.(action);
  }, [onActionSelect]);

  // Spacing based on density
  const listSpacing = effectiveDensity === 'ultra-compact' || effectiveDensity === 'compact'
    ? 'p-2 space-y-1'
    : 'p-3 space-y-2';

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
                  px-2 py-1 text-[11px] font-semibold uppercase tracking-wide rounded
                  transition-all duration-200 ease-out whitespace-nowrap
                  ${isActive
                    ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
                    : 'text-white/55 hover:text-white/90 hover:bg-[#1A1A24]'
                  }
                `}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`ml-1 ${isActive ? 'text-brand-cyan/70' : 'text-white/35'}`}>
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
                px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors
                ${densityMode === mode ? 'bg-white/10 text-white/90' : 'text-white/45 hover:text-white/75'}
              `}
              title={mode === 'auto' ? 'Adaptive density' : mode === 'compact' ? 'Always compact' : 'Always expanded'}
            >
              {mode === 'auto' ? 'A' : mode === 'compact' ? 'C' : 'E'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <LoadingSkeleton density={effectiveDensity} />
        ) : error ? (
          <ErrorState error={error} />
        ) : processedItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className={listSpacing}>
            {/* Urgent section header */}
            {processedItems.some(i => priorityConfig[i.priority].urgent) && activeFilter === 'all' && (
              <div className="flex items-center gap-1.5 px-1 py-0.5 mb-1">
                <span className="w-1 h-1 rounded-full bg-semantic-danger animate-pulse" />
                <span className="text-xs font-semibold text-semantic-danger uppercase tracking-wider">Requires Attention</span>
              </div>
            )}

            {processedItems.map((action, index) => {
              const isUrgent = priorityConfig[action.priority].urgent;
              const nextItem = processedItems[index + 1];
              const nextIsNotUrgent = nextItem && !priorityConfig[nextItem.priority].urgent;
              const showDivider = isUrgent && nextIsNotUrgent && activeFilter === 'all';

              return (
                <div key={action.id}>
                  <ActionCard
                    action={action}
                    densityLevel={effectiveDensity}
                    isSelected={selectedActionId === action.id}
                    onPrimaryAction={() => handlePrimaryAction(action)}
                    onSecondaryAction={() => handleSecondaryAction(action)}
                    onCardClick={() => handleActionClick(action)}
                  />
                  {showDivider && (
                    <div className="flex items-center gap-1.5 px-1 py-1 mt-1.5">
                      <div className="flex-1 h-px bg-[#1A1A24]" />
                      <span className="text-xs text-white/35 uppercase tracking-wider">Other Actions</span>
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
