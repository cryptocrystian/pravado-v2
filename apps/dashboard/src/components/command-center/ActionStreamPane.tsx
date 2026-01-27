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
 * ActionStreamPane v8.0 - Anchored HoverCard Coordination
 *
 * LIFECYCLE BUCKETS:
 * - Active (default): Items with status ready/queued/attention/executing
 * - History: Items with status completed/failed/dismissed
 * - Executing an item moves it from Active → History on completion
 *
 * DENSITY CONTRACT (3 levels):
 * - Comfortable (DEFAULT): <=8 cards OR sufficient vertical room (6+ cards visible)
 *   → Full UX-Pilot card design with dominant CTA
 * - Standard: 9-12 cards (transition zone)
 *   → Condensed layout with visible CTA
 * - Compact: 13+ cards OR height-constrained
 *   → Row-based layout, primary CTA only, NO hover popover
 *
 * DEV TESTING:
 * - Query param override: ?density=comfortable|standard|compact
 * - This overrides auto-calculation for testing
 *
 * HOVER COORDINATION (v5 Pattern):
 * - Only ONE HoverCard can be open at a time
 * - ActionStreamPane tracks which card ID has hover open
 * - Non-hovered cards are dimmed when a hover is open
 * - Compact mode: No hover popover
 *
 * PROGRESSIVE DISCLOSURE (3 Layers):
 * - LAYER 1 (Card): Content scales with density
 * - LAYER 2 (Hover): Anchored HoverCard popover (positioned left)
 * - LAYER 3 (Modal): Full details via ActionModal (centered)
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ActionCard, type DensityLevel } from './ActionCard';
import type { ActionItem, ActionStreamResponse, EVIFilterState, Priority } from './types';

interface ActionStreamPaneProps {
  data: ActionStreamResponse | null;
  isLoading: boolean;
  error: Error | null;
  onReview?: (action: ActionItem) => void; // Opens modal for investigation
  onPrimaryAction?: (action: ActionItem) => void; // Executes action
  selectedActionId?: string | null;
  executionStates?: Record<string, 'idle' | 'executing' | 'success' | 'error'>;
  /** EVI filter from Strategy Panel */
  eviFilter?: EVIFilterState | null;
  /** Callback to clear EVI filter */
  onClearEviFilter?: () => void;
  /** v2 Entity Map: Callback when hovered action changes (for cross-pane coordination) */
  onHoverActionChange?: (actionId: string | null) => void;
}

// Filter tabs configuration
type FilterTab = 'all' | 'draft' | 'proposed' | 'urgent' | 'signal';
type DensityMode = 'auto' | 'compact' | 'comfortable';
type LifecycleBucket = 'active' | 'history';

/**
 * LOCKED ACTIONS POLICY:
 * - Locked = gate.required && gate.min_plan exists
 * - Locked items NEVER appear in Active or History buckets
 * - Locked items appear in their own "Upgrade Opportunities" section
 * - Locked items have NO execute CTA (only "Unlock" CTA)
 */
function isActionLocked(action: ActionItem): boolean {
  return action.gate.required && !!action.gate.min_plan;
}

// Helper to compute lifecycle bucket from execution state
function getLifecycleBucket(executionState: 'idle' | 'executing' | 'success' | 'error'): LifecycleBucket {
  // Active: idle or executing (still actionable)
  // History: success (completed) or error (failed)
  if (executionState === 'success' || executionState === 'error') {
    return 'history';
  }
  return 'active';
}

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

function EmptyState({ isHistory }: { isHistory: boolean }) {
  return (
    <div className="p-6 text-center">
      <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#1A1A24] flex items-center justify-center">
        {isHistory ? (
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        )}
      </div>
      <p className="text-sm text-white/70 font-medium">
        {isHistory ? 'No completed actions yet' : 'No pending actions'}
      </p>
      <p className="text-xs text-white/40 mt-1">
        {isHistory ? 'Actions you complete will appear here' : 'AI is analyzing your strategy'}
      </p>
    </div>
  );
}

export function ActionStreamPane({
  data,
  isLoading,
  error,
  onReview,
  onPrimaryAction,
  selectedActionId,
  executionStates = {},
  eviFilter,
  onClearEviFilter,
  onHoverActionChange,
}: ActionStreamPaneProps) {
  const searchParams = useSearchParams();
  const [lifecycleBucket, setLifecycleBucket] = useState<LifecycleBucket>('active');
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [densityMode, setDensityMode] = useState<DensityMode>('auto');
  const [computedDensity, setComputedDensity] = useState<DensityLevel>('comfortable'); // Default to comfortable
  const listRef = useRef<HTMLDivElement>(null);

  // v5: Single-hover coordination state
  // Tracks which action ID has its HoverCard open (null = none open)
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);

  // LOCKED ACTIONS POLICY: Upgrade Opportunities section (collapsed by default)
  const [isLockedSectionOpen, setIsLockedSectionOpen] = useState(false);

  // DEV: Query param override for testing density modes
  // Usage: ?density=comfortable|standard|compact
  const densityOverride = searchParams?.get('density') as DensityLevel | null;
  const validOverrides: DensityLevel[] = ['comfortable', 'standard', 'compact'];
  const hasValidOverride = !!(densityOverride && validOverrides.includes(densityOverride));

  // LOCKED ACTIONS: Separate locked items (sorted by impact)
  const lockedItems = useMemo(() => {
    if (!data?.items) return [];
    return data.items
      .filter(isActionLocked)
      .sort((a, b) => b.impact - a.impact); // Sort by value/impact score
  }, [data]);

  // Filter and sort actions (EXCLUDING locked items)
  const processedItems = useMemo(() => {
    if (!data?.items) return [];

    // LOCKED ACTIONS POLICY: Exclude locked items from Active/History
    // First filter by lifecycle bucket, excluding locked items
    let items = data.items.filter((item) => {
      // Locked items go to their own section, not here
      if (isActionLocked(item)) return false;

      const itemState = executionStates[item.id] || 'idle';
      const itemBucket = getLifecycleBucket(itemState);
      return itemBucket === lifecycleBucket;
    });

    // Apply EVI filter from Strategy Panel (driver/pillar)
    if (eviFilter) {
      items = items.filter((item) => {
        // Filter by driver if specified
        if (eviFilter.driver && item.evi_driver && item.evi_driver !== eviFilter.driver) {
          return false;
        }
        // Filter by pillar if specified
        if (eviFilter.pillar && item.pillar !== eviFilter.pillar) {
          return false;
        }
        return true;
      });
    }

    // Then apply category filter
    items = items.filter((item) => {
      if (activeFilter === 'all') return true;
      if (activeFilter === 'urgent') return item.priority === 'critical' || item.priority === 'high';
      if (activeFilter === 'draft') return item.mode === 'manual';
      if (activeFilter === 'proposed') return item.mode === 'copilot' || item.mode === 'autopilot';
      if (activeFilter === 'signal') return item.confidence > 0.8;
      return true;
    });

    // Sort based on bucket
    if (lifecycleBucket === 'active') {
      // Active: Critical/High at top, then by confidence
      items = items.sort((a, b) => {
        const aUrgent = a.priority === 'critical' || a.priority === 'high';
        const bUrgent = b.priority === 'critical' || b.priority === 'high';
        if (aUrgent && !bUrgent) return -1;
        if (!aUrgent && bUrgent) return 1;
        return b.confidence - a.confidence;
      });
    } else {
      // History: Most recently completed first (by updated_at)
      items = items.sort((a, b) => {
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    }

    return items;
  }, [data, activeFilter, lifecycleBucket, executionStates, eviFilter]);

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

  // Count items per lifecycle bucket (excluding locked items)
  const bucketCounts = useMemo(() => {
    if (!data?.items) return { active: 0, history: 0, locked: 0 };
    return data.items.reduce((acc, item) => {
      // LOCKED ACTIONS: Count separately
      if (isActionLocked(item)) {
        acc.locked++;
        return acc;
      }
      const itemState = executionStates[item.id] || 'idle';
      const bucket = getLifecycleBucket(itemState);
      acc[bucket]++;
      return acc;
    }, { active: 0, history: 0, locked: 0 });
  }, [data, executionStates]);

  // Count items per filter (within current lifecycle bucket, excluding locked)
  const counts = useMemo(() => {
    // Filter items by current lifecycle bucket first, excluding locked items
    const bucketItems = data?.items.filter((item) => {
      // LOCKED ACTIONS: Exclude from counts
      if (isActionLocked(item)) return false;
      const itemState = executionStates[item.id] || 'idle';
      return getLifecycleBucket(itemState) === lifecycleBucket;
    }) || [];

    return {
      all: bucketItems.length,
      urgent: bucketItems.filter(i => i.priority === 'critical' || i.priority === 'high').length,
      draft: bucketItems.filter(i => i.mode === 'manual').length,
      proposed: bucketItems.filter(i => i.mode === 'copilot' || i.mode === 'autopilot').length,
      signal: bucketItems.filter(i => i.confidence > 0.8).length,
    };
  }, [data, lifecycleBucket, executionStates]);

  // INTERACTION CONTRACT v2.0:
  // - handleReview opens the modal (card click or Review button)
  // - handlePrimaryAction executes the action (Primary CTA only)
  const handleReview = useCallback((action: ActionItem) => {
    onReview?.(action);
  }, [onReview]);

  const handlePrimaryActionClick = useCallback((action: ActionItem) => {
    // Primary CTA executes - NEVER opens modal
    console.log('[ActionStream] Primary action:', action.cta.primary, action.id);
    onPrimaryAction?.(action);
  }, [onPrimaryAction]);

  // v5: Handle hover state changes for single-hover coordination
  // v2 Entity Map: Also notify parent for cross-pane coordination
  const handleHoverOpenChange = useCallback((actionId: string) => (open: boolean) => {
    if (open) {
      // Opening a new hover - set this as the active one
      setHoveredActionId(actionId);
      onHoverActionChange?.(actionId);
    } else {
      // Closing hover - only clear if this is the currently hovered card
      setHoveredActionId((current) => {
        const newId = current === actionId ? null : current;
        if (current === actionId) {
          onHoverActionChange?.(null);
        }
        return newId;
      });
    }
  }, [onHoverActionChange]);

  // Spacing based on density
  const listSpacing = effectiveDensity === 'compact'
    ? 'p-2 space-y-1.5'
    : effectiveDensity === 'standard'
    ? 'p-3 space-y-2'
    : 'p-3 space-y-2.5'; // Comfortable - more spacious

  return (
    <div className="flex flex-col h-full">
      {/* Active/History Toggle - Primary navigation */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-[#1A1A24] bg-[#0D0D12] flex-shrink-0">
        <button
          onClick={() => setLifecycleBucket('active')}
          className={`
            flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
            ${lifecycleBucket === 'active'
              ? 'bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30'
              : 'text-white/55 hover:text-white/90 hover:bg-[#1A1A24] border border-transparent'
            }
          `}
        >
          Active
          {bucketCounts.active > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded ${
              lifecycleBucket === 'active' ? 'bg-brand-cyan/20' : 'bg-white/10'
            }`}>
              {bucketCounts.active}
            </span>
          )}
        </button>
        <button
          onClick={() => setLifecycleBucket('history')}
          className={`
            flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200
            ${lifecycleBucket === 'history'
              ? 'bg-white/10 text-white/90 border border-white/20'
              : 'text-white/55 hover:text-white/90 hover:bg-[#1A1A24] border border-transparent'
            }
          `}
        >
          History
          {bucketCounts.history > 0 && (
            <span className={`ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded ${
              lifecycleBucket === 'history' ? 'bg-white/15' : 'bg-white/10'
            }`}>
              {bucketCounts.history}
            </span>
          )}
        </button>
      </div>

      {/* EVI Filter Chip (from Strategy Panel) */}
      {eviFilter && (
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-brand-cyan/30 bg-brand-cyan/5 flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-xs text-brand-cyan font-medium">
            Filtered by: {eviFilter.label}
          </span>
          {onClearEviFilter && (
            <button
              onClick={onClearEviFilter}
              className="ml-auto p-0.5 rounded hover:bg-brand-cyan/20 text-brand-cyan transition-colors"
              title="Clear filter"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

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
          <EmptyState isHistory={lifecycleBucket === 'history'} />
        ) : (
          <div className={listSpacing}>
            {/* History header - shows completion context */}
            {lifecycleBucket === 'history' && (
              <div className="flex items-center gap-1.5 px-1 py-0.5 mb-1">
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium text-white/50 uppercase tracking-wider">Recently Completed</span>
              </div>
            )}

            {/* Urgent section header (Active mode only) */}
            {lifecycleBucket === 'active' && processedItems.some(i => priorityConfig[i.priority].urgent) && activeFilter === 'all' && (
              <div className="flex items-center gap-1.5 px-1 py-0.5 mb-1">
                <span className="w-1 h-1 rounded-full bg-semantic-danger animate-pulse" />
                <span className="text-xs font-semibold text-semantic-danger uppercase tracking-wider">Requires Attention</span>
              </div>
            )}

            {processedItems.map((action, index) => {
              const isUrgent = priorityConfig[action.priority].urgent;
              const nextItem = processedItems[index + 1];
              const nextIsNotUrgent = nextItem && !priorityConfig[nextItem.priority].urgent;
              // Only show divider in active mode
              const showDivider = lifecycleBucket === 'active' && isUrgent && nextIsNotUrgent && activeFilter === 'all';

              return (
                <div key={action.id}>
                  <ActionCard
                    action={action}
                    densityLevel={effectiveDensity}
                    isSelected={selectedActionId === action.id}
                    executionState={executionStates[action.id] || 'idle'}
                    onPrimaryAction={() => handlePrimaryActionClick(action)}
                    onReview={() => handleReview(action)}
                    // v5: HoverCard coordination props
                    isHoverOpen={hoveredActionId === action.id}
                    onHoverOpenChange={handleHoverOpenChange(action.id)}
                    isDimmed={hoveredActionId !== null && hoveredActionId !== action.id}
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

            {/* LOCKED ACTIONS: Upgrade Opportunities Section */}
            {lockedItems.length > 0 && lifecycleBucket === 'active' && (
              <div className="mt-4 pt-3 border-t border-[#1A1A24]">
                {/* Collapsible Header */}
                <button
                  onClick={() => setIsLockedSectionOpen(!isLockedSectionOpen)}
                  className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-[#1A1A24] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-iris/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-wider">
                      Upgrade Opportunities
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-brand-iris/20 text-brand-iris">
                      {lockedItems.length}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isLockedSectionOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsed Content */}
                {isLockedSectionOpen && (
                  <div className="mt-2 space-y-2">
                    {lockedItems.map((action) => (
                      <ActionCard
                        key={action.id}
                        action={action}
                        densityLevel={effectiveDensity}
                        isSelected={selectedActionId === action.id}
                        executionState="idle"
                        // LOCKED: No execute action - will show "Unlock" CTA instead
                        onPrimaryAction={undefined}
                        onReview={() => handleReview(action)}
                        // v5: HoverCard coordination props
                        isHoverOpen={hoveredActionId === action.id}
                        onHoverOpenChange={handleHoverOpenChange(action.id)}
                        isDimmed={hoveredActionId !== null && hoveredActionId !== action.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
