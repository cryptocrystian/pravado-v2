'use client';

/**
 * QueueList - Scrollable list of queue items.
 *
 * Layout:
 * - Dense rows, scrollable within pane
 * - Mode-aware header with item counts
 * - Keyboard navigation support (up/down arrows)
 *
 * Manual mode: Full list, re-rank/pin controls
 * Copilot mode: Full list with step numbers
 * Autopilot mode: Exceptions only, with routine count indicator
 *
 * @see /docs/canon/AUTOMATION_MODE_CONTRACTS_CANON.md
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { QueueRow, type QueueItem } from './QueueRow';
import type { AutomationMode } from '../types';

// ============================================
// TYPES
// ============================================

export interface QueueListProps {
  items: QueueItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  mode: AutomationMode;
  /** Routine items count (Autopilot only) */
  routineCount?: number;
  /** Pinned item ID (Manual only) */
  pinnedId?: string | null;
  onPinToggle?: (id: string) => void;
  /** Whether to show the header */
  showHeader?: boolean;
  /** Custom header label override */
  headerLabel?: string;
  /** Is the list loading */
  isLoading?: boolean;
}

// ============================================
// HEADER CONFIGURATIONS BY MODE
// ============================================

const MODE_HEADERS = {
  manual: {
    label: 'Work Queue',
    sublabel: 'Select an item to begin',
  },
  copilot: {
    label: 'AI-Ranked Queue',
    sublabel: 'Review the suggested order',
  },
  autopilot: {
    label: 'Exceptions',
    sublabel: 'Items requiring attention',
  },
};

// ============================================
// COMPONENT
// ============================================

export function QueueList({
  items,
  selectedId,
  onSelect,
  mode,
  routineCount = 0,
  pinnedId,
  onPinToggle,
  showHeader = true,
  headerLabel,
  isLoading = false,
}: QueueListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const headerConfig = MODE_HEADERS[mode];
  const displayLabel = headerLabel || headerConfig.label;

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(focusedIndex + 1, items.length - 1);
      setFocusedIndex(nextIndex);
      onSelect(items[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(focusedIndex - 1, 0);
      setFocusedIndex(prevIndex);
      onSelect(items[prevIndex].id);
    }
  }, [focusedIndex, items, onSelect]);

  // Update focused index when selection changes externally
  useEffect(() => {
    if (selectedId) {
      const index = items.findIndex(item => item.id === selectedId);
      if (index !== -1) {
        setFocusedIndex(index);
      }
    }
  }, [selectedId, items]);

  // Empty state
  if (!isLoading && items.length === 0) {
    return (
      <div className="flex flex-col h-full">
        {showHeader && (
          <div className="px-3 py-2 border-b border-slate-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
              {displayLabel}
            </h3>
          </div>
        )}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-semantic-success/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/70">
              {mode === 'autopilot' ? 'No exceptions' : 'All clear'}
            </p>
            <p className="text-xs text-white/40 mt-1">
              {mode === 'autopilot' && routineCount > 0
                ? `${routineCount} routine items auto-handled`
                : 'No pending actions'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      {showHeader && (
        <div className="px-3 py-2.5 border-b border-slate-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/60">
                {displayLabel}
              </h3>
              <span className="px-1.5 py-0.5 text-[10px] font-medium text-white/40 bg-white/5 rounded">
                {items.length}
              </span>
            </div>

            {/* Mode-specific indicators */}
            {mode === 'autopilot' && routineCount > 0 && (
              <span className="text-xs text-semantic-success">
                +{routineCount} auto-handled
              </span>
            )}
            {mode === 'copilot' && (
              <span className="text-xs text-brand-cyan">
                AI-ranked
              </span>
            )}
          </div>
          <p className="text-xs text-white/30 mt-0.5">
            {headerConfig.sublabel}
          </p>
        </div>
      )}

      {/* Scrollable list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto p-2 space-y-1"
        role="listbox"
        aria-label="Queue items"
      >
        {isLoading ? (
          // Loading skeleton
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-12 bg-slate-3 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          items.map((item, index) => (
            <QueueRow
              key={item.id}
              item={item}
              isSelected={selectedId === item.id}
              isPinned={pinnedId === item.id}
              onClick={() => onSelect(item.id)}
              onPinToggle={mode === 'manual' && onPinToggle ? () => onPinToggle(item.id) : undefined}
              mode={mode}
              index={index}
            />
          ))
        )}
      </div>

      {/* Footer with batch controls (Manual mode only) */}
      {mode === 'manual' && items.length > 1 && (
        <div className="px-3 py-2 border-t border-slate-4 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30">
              ↑↓ navigate · Enter select
            </span>
            <button className="text-white/40 hover:text-brand-iris transition-colors">
              Re-rank →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
