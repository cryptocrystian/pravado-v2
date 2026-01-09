'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 * - UX-Pilot: Authority for Comfortable mode card design
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * ActionStreamPane v6.0 - UX Pilot Aligned
 *
 * DENSITY CONTRACT (3 levels):
 * - Comfortable (DEFAULT): <=8 cards OR sufficient vertical room (6+ cards visible)
 *   → Full UX-Pilot card design with dominant CTA
 * - Standard: 9-12 cards (transition zone)
 *   → Condensed layout with visible CTA
 * - Compact: 13+ cards OR height-constrained
 *   → Row-based layout, primary CTA only
 *
 * COMFORTABLE = UX-PILOT AUTHORITY:
 * - Card height ~120-150px
 * - Dominant primary CTA (colored pill, strong contrast)
 * - Subdued secondary action (ghost/outline)
 * - Clear severity indication via left accent
 *
 * DEV TESTING:
 * - Query param override: ?density=comfortable|standard|compact
 * - This overrides auto-calculation for testing
 *
 * PROGRESSIVE DISCLOSURE (3 Layers):
 * - LAYER 1 (Card): Content scales with density
 * - LAYER 2 (Hover): Background tint via group-hover transitions
 * - LAYER 3 (Drawer): Full details via ActionPeekDrawer
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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
type DensityMode = 'auto' | 'compact' | 'comfortable';

// NEW: Density thresholds aligned with UX-Pilot contract
// Comfortable is DEFAULT and most common
const DENSITY_THRESHOLDS = {
  // Comfortable: default for <=8 cards, or when 6+ cards fit comfortably
  comfortable: { maxCards: 8, minHeightPerCard: 130 },
  // Standard: transition zone for 9-12 cards
  standard: { maxCards: 12, minHeightPerCard: 80 },
  // Compact: 13+ cards or height-constrained (fallback only)
  compact: { minHeightPerCard: 48 },
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
 *
 * NEW v6.0 RULES (UX-Pilot aligned):
 * - Comfortable is DEFAULT and should be most common
 * - Only fall back to standard/compact when necessary
 */
function calculateDensityLevel(availableHeight: number, cardCount: number): DensityLevel {
  // Default to comfortable for empty or small lists
  if (cardCount === 0) return 'comfortable';

  const padding = 32; // Container padding
  const usableHeight = availableHeight - padding;
  const heightPerCard = usableHeight / cardCount;

  // Rule 1: <=8 cards = comfortable (unless height-constrained)
  if (cardCount <= DENSITY_THRESHOLDS.comfortable.maxCards) {
    // Even with 8 cards, prefer comfortable if we have room for 6+ visible
    if (heightPerCard >= DENSITY_THRESHOLDS.comfortable.minHeightPerCard * 0.75) {
      return 'comfortable';
    }
  }

  // Rule 2: 9-12 cards = standard (transition zone)
  if (cardCount <= DENSITY_THRESHOLDS.standard.maxCards) {
    if (heightPerCard >= DENSITY_THRESHOLDS.standard.minHeightPerCard) {
      return 'standard';
    }
  }

  // Rule 3: 13+ cards OR height-constrained = compact (fallback only)
  return 'compact';
}

function LoadingSkeleton({ density }: { density: DensityLevel }) {
  // Skeleton counts by density
  const skeletonCount = density === 'compact' ? 6 : density === 'standard' ? 4 : 3;
  const skeletonHeight = density === 'compact' ? 'h-12' : density === 'standard' ? 'h-20' : 'h-32';

  return (
    <div className={density === 'compact' ? 'p-2 space-y-1' : 'p-3 space-y-2.5'}>
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
  const searchParams = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [densityMode, setDensityMode] = useState<DensityMode>('auto');
  const [computedDensity, setComputedDensity] = useState<DensityLevel>('comfortable'); // Default to comfortable
  const listRef = useRef<HTMLDivElement>(null);

  // DEV: Query param override for testing density modes
  // Usage: ?density=comfortable|standard|compact
  const densityOverride = searchParams?.get('density') as DensityLevel | null;
  const validOverrides: DensityLevel[] = ['comfortable', 'standard', 'compact'];
  const hasValidOverride = !!(densityOverride && validOverrides.includes(densityOverride));

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

  // Determine effective density level based on mode and overrides
  const effectiveDensity: DensityLevel = useMemo(() => {
    // Priority 1: Query param override (for dev testing)
    if (hasValidOverride && densityOverride) {
      return densityOverride;
    }
    // Priority 2: User toggle selection
    if (densityMode === 'compact') return 'compact';
    if (densityMode === 'comfortable') return 'comfortable';
    // Priority 3: Auto-calculated density (defaults to comfortable)
    return computedDensity;
  }, [densityMode, computedDensity, hasValidOverride, densityOverride]);

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
  const listSpacing = effectiveDensity === 'compact'
    ? 'p-2 space-y-1.5'
    : effectiveDensity === 'standard'
    ? 'p-3 space-y-2'
    : 'p-3 space-y-2.5'; // Comfortable - more spacious

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
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Override indicator */}
          {hasValidOverride && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-semantic-warning/20 text-semantic-warning rounded">
              DEV
            </span>
          )}
          <div className="flex items-center bg-[#0D0D12] rounded p-0.5 border border-[#1A1A24]">
            {(['auto', 'comfortable', 'compact'] as DensityMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setDensityMode(mode)}
                disabled={hasValidOverride}
                className={`
                  px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors
                  ${hasValidOverride ? 'opacity-50 cursor-not-allowed' : ''}
                  ${densityMode === mode ? 'bg-white/10 text-white/90' : 'text-white/45 hover:text-white/75'}
                `}
                title={
                  mode === 'auto' ? 'Adaptive density (default)' :
                  mode === 'comfortable' ? 'Force comfortable (UX-Pilot)' :
                  'Force compact'
                }
              >
                {mode === 'auto' ? 'A' : mode === 'comfortable' ? 'F' : 'C'}
              </button>
            ))}
          </div>
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
