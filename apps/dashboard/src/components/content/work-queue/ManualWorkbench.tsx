'use client';

/**
 * ManualWorkbench - Clean-room Manual mode implementation
 *
 * LAYOUT SPINE (per CONTENT_WORK_SURFACE_RECONSTRUCTION.md):
 * - Left: Dense Task List (240-280px) - selection rail
 * - Center: Dominant Editor Canvas - unmistakably an editor
 * - Right: Compact Context Rail (optional, collapsible)
 *
 * CANON COMPLIANCE:
 * - CONTENT_MODE_UX_THESIS.md: Manual = "I Am Creating"
 * - EDITOR_IDENTITY_CANON.md: Clear editor boundaries, explicit entry/exit
 * - INFORMATION_DENSITY_HIERARCHY_CANON.md: 14px body min, ≤50% dead space
 * - ACTION_GRAVITY_CTA_CANON.md: CTA proximate to content, no runway footers
 *
 * @see /docs/canon/work/CONTENT_WORK_SURFACE_RECONSTRUCTION.md
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { QueueItem } from './QueueRow';
import type { CiteMindStatus, CiteMindIssue, DerivativeType } from '../types';

// ============================================
// TYPES
// ============================================

export interface ManualWorkbenchProps {
  /** Queue items to display */
  items: QueueItem[];
  /** Currently selected item ID */
  selectedId: string | null;
  /** Selection handler */
  onSelect: (id: string) => void;
  /** Execute action handler */
  onExecute?: (item: QueueItem) => void;
  /** Save draft handler */
  onSaveDraft?: (item: QueueItem) => void;
  /** Mark ready handler */
  onMarkReady?: (item: QueueItem) => void;
  /** Create new brief handler */
  onCreateNew?: () => void;
  /** Loading state */
  isLoading?: boolean;
  /** Context data for selected item */
  contextData?: {
    citeMindStatus?: CiteMindStatus;
    citeMindIssues?: CiteMindIssue[];
    entities?: string[];
    derivatives?: Array<{ type: DerivativeType; valid: boolean }>;
    crossPillar?: { prHooks: number; seoHooks: number };
  };
}

// ============================================
// TASK LIST (LEFT RAIL) - Dense Selection
// ============================================

interface TaskListProps {
  items: QueueItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
}

function TaskList({ items, selectedId, onSelect, isLoading }: TaskListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

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

  // Sync focused index with selection
  useEffect(() => {
    if (selectedId) {
      const index = items.findIndex(item => item.id === selectedId);
      if (index !== -1) setFocusedIndex(index);
    }
  }, [selectedId, items]);

  // Priority indicator colors
  const priorityColor: Record<QueueItem['priority'], string> = {
    critical: 'bg-semantic-danger',
    high: 'bg-semantic-warning',
    medium: 'bg-brand-iris',
    low: 'bg-white/20',
  };

  // Type badge config
  const typeConfig: Record<QueueItem['type'], { label: string; color: string }> = {
    execution: { label: 'Brief', color: 'text-brand-iris' },
    issue: { label: 'Issue', color: 'text-semantic-warning' },
    opportunity: { label: 'Gap', color: 'text-brand-cyan' },
    scheduled: { label: 'Due', color: 'text-semantic-danger' },
    sage_proposal: { label: 'AI', color: 'text-white/50' },
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2.5 border-b border-slate-4">
          <h3 className="text-sm font-semibold text-white/60">Work Queue</h3>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-11 bg-slate-3 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2.5 border-b border-slate-4">
          <h3 className="text-sm font-semibold text-white/60">Work Queue</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-semantic-success/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/60">All clear</p>
            <p className="text-sm text-white/40 mt-0.5">No pending work</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" onKeyDown={handleKeyDown}>
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-4 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">Work Queue</h3>
          <span className="px-1.5 py-0.5 text-xs font-medium text-white/40 bg-white/5 rounded">
            {items.length}
          </span>
        </div>
      </div>

      {/* Scrollable list - dense rows */}
      <div ref={listRef} className="flex-1 overflow-y-auto p-1.5 space-y-0.5" role="listbox">
        {items.map((item) => {
          const isSelected = selectedId === item.id;
          const type = typeConfig[item.type];

          return (
            <div
              key={item.id}
              role="option"
              aria-selected={isSelected}
              tabIndex={0}
              onClick={() => onSelect(item.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(item.id);
                }
              }}
              className={`
                group flex items-center gap-2 px-2.5 py-2 rounded cursor-pointer
                transition-colors duration-100
                focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-iris/50
                ${isSelected
                  ? 'bg-brand-iris/15 border border-brand-iris/30'
                  : 'bg-transparent border border-transparent hover:bg-slate-3 hover:border-slate-4'
                }
              `}
            >
              {/* Priority bar */}
              <div className={`w-0.5 h-6 rounded-full ${priorityColor[item.priority]} shrink-0`} />

              {/* Type badge - compact */}
              <span className={`text-[10px] font-bold uppercase shrink-0 ${type.color}`}>
                {type.label}
              </span>

              {/* Title - truncate */}
              <span className={`flex-1 text-sm truncate ${isSelected ? 'text-white' : 'text-white/70'}`}>
                {item.title}
              </span>

              {/* Selection dot */}
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-iris shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-slate-4 shrink-0">
        <span className="text-xs text-white/30">↑↓ navigate · Enter select</span>
      </div>
    </div>
  );
}

// ============================================
// EDITOR CANVAS (CENTER) - Dominant Editor
// ============================================

interface EditorCanvasProps {
  item: QueueItem | null;
  onSaveDraft?: () => void;
  onMarkReady?: () => void;
  onExecute?: () => void;
  onCreateNew?: () => void;
}

function EditorCanvas({ item, onSaveDraft, onMarkReady, onExecute, onCreateNew }: EditorCanvasProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');

  // Reset state when item changes
  useEffect(() => {
    setIsEditing(false);
    setContent(item?.summary || '');
  }, [item?.id]);

  // Empty state - no selection
  if (!item) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-slate-3 border border-slate-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-white/70 mb-1">Select an item to edit</h3>
        <p className="text-sm text-white/40 mb-6 max-w-sm">
          Choose from the work queue to open the editor and start creating.
        </p>
        {onCreateNew && (
          <button
            onClick={onCreateNew}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors shadow-[0_0_16px_rgba(168,85,247,0.25)]"
          >
            + New Brief
          </button>
        )}
      </div>
    );
  }

  // Type badge config
  const typeConfig: Record<QueueItem['type'], { label: string; color: string; bg: string }> = {
    execution: { label: 'Brief', color: 'text-brand-iris', bg: 'bg-brand-iris/10' },
    issue: { label: 'Issue', color: 'text-semantic-warning', bg: 'bg-semantic-warning/10' },
    opportunity: { label: 'Gap', color: 'text-brand-cyan', bg: 'bg-brand-cyan/10' },
    scheduled: { label: 'Deadline', color: 'text-semantic-danger', bg: 'bg-semantic-danger/10' },
    sage_proposal: { label: 'SAGE', color: 'text-white/60', bg: 'bg-white/5' },
  };

  const type = typeConfig[item.type];

  // Get primary CTA based on item type
  const getPrimaryCTA = () => {
    if (item.type === 'execution') {
      return { label: 'Execute', action: onExecute, style: 'bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_12px_rgba(168,85,247,0.2)]' };
    }
    if (item.type === 'issue') {
      return { label: 'Fix Issue', action: onExecute, style: 'bg-semantic-warning text-black hover:bg-semantic-warning/90' };
    }
    if (item.type === 'opportunity') {
      return { label: 'Create Brief', action: onExecute, style: 'bg-brand-iris text-white hover:bg-brand-iris/90 shadow-[0_0_12px_rgba(168,85,247,0.2)]' };
    }
    return { label: 'View', action: onExecute, style: 'bg-white/10 text-white hover:bg-white/15' };
  };

  const primaryCTA = getPrimaryCTA();

  return (
    <div className="h-full flex flex-col bg-slate-1">
      {/* EDITOR HEADER - Title + state line (per EDITOR_IDENTITY_CANON) */}
      <div className="px-5 py-4 border-b border-slate-4 bg-slate-2 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Type badge */}
            <span className={`px-2 py-1 text-xs font-bold uppercase rounded shrink-0 ${type.color} ${type.bg}`}>
              {type.label}
            </span>
            {/* Priority */}
            {item.priority === 'critical' && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase text-semantic-danger bg-semantic-danger/10 rounded shrink-0">
                Critical
              </span>
            )}
            {/* Edit state indicator */}
            <span className={`text-xs font-medium ${isEditing ? 'text-brand-iris' : 'text-white/40'}`}>
              {isEditing ? '● Editing' : '○ View mode'}
            </span>
          </div>

          {/* Edit toggle - explicit entry per EDITOR_IDENTITY_CANON §5 */}
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 text-sm font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 rounded transition-colors"
            >
              Edit
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white bg-transparent border border-white/10 rounded transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Title row */}
        <h2 className="mt-3 text-xl font-semibold text-white leading-tight">
          {item.title}
        </h2>
      </div>

      {/* EDITOR BODY - Writing surface with visible affordance */}
      <div className="flex-1 overflow-y-auto p-5">
        {isEditing ? (
          /* Active editor state - clear boundary per EDITOR_IDENTITY_CANON §5 */
          <div className="h-full">
            {/* Editor toolbar stub */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-4">
              <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 5h2M12 5h8M6 12h8m-8 7h12" />
                </svg>
              </button>
              <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded font-bold text-sm">B</button>
              <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded italic text-sm">I</button>
              <span className="w-px h-4 bg-slate-4 mx-1" />
              <button className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                </svg>
              </button>
            </div>

            {/* Editable textarea - clear writing surface */}
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Start writing your content..."
              className="w-full h-[calc(100%-60px)] min-h-[300px] p-4 text-base leading-relaxed text-white bg-slate-2 border border-slate-4 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-iris/30 focus:border-brand-iris/50 placeholder:text-white/30"
              autoFocus
            />
          </div>
        ) : (
          /* Preview state - read-only display */
          <div className="space-y-4">
            {/* Summary section */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40 mb-2">Summary</h4>
              <p className="text-base leading-relaxed text-white/70">
                {item.summary}
              </p>
            </div>

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-2">
              {item.impact?.authority !== undefined && (
                <span className="px-2.5 py-1 text-sm font-medium text-brand-iris bg-brand-iris/10 rounded">
                  +{item.impact.authority} authority
                </span>
              )}
              {item.impact?.crossPillar !== undefined && (
                <span className="px-2.5 py-1 text-sm font-medium text-brand-cyan bg-brand-cyan/10 rounded">
                  +{item.impact.crossPillar} hooks
                </span>
              )}
              {item.confidence !== undefined && (
                <span className={`px-2.5 py-1 text-sm font-medium rounded ${
                  item.confidence >= 80 ? 'text-semantic-success bg-semantic-success/10' :
                  item.confidence >= 50 ? 'text-semantic-warning bg-semantic-warning/10' :
                  'text-white/50 bg-white/5'
                }`}>
                  {item.confidence}% confidence
                </span>
              )}
            </div>

            {/* Content preview placeholder */}
            <div className="mt-6 p-4 bg-slate-2 border border-slate-4 rounded-lg">
              <p className="text-sm text-white/40 text-center">
                Click "Edit" to start writing
              </p>
            </div>
          </div>
        )}
      </div>

      {/* EDITOR ACTION DOCK - CTA proximate to content (not runway footer) */}
      <div className="px-5 py-3 border-t border-slate-4 bg-slate-2 shrink-0">
        <div className="flex items-center justify-between gap-3">
          {/* Secondary actions (left) */}
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                <button
                  onClick={onSaveDraft}
                  className="px-3 py-1.5 text-sm font-medium text-white/60 hover:text-white bg-transparent border border-white/10 hover:border-white/20 rounded transition-colors"
                >
                  Save Draft
                </button>
                <button
                  onClick={onMarkReady}
                  className="px-3 py-1.5 text-sm font-medium text-brand-cyan hover:text-brand-cyan/90 bg-brand-cyan/10 border border-brand-cyan/20 rounded transition-colors"
                >
                  Mark Ready
                </button>
              </>
            )}
          </div>

          {/* Primary CTA (right) - always visible per ACTION_GRAVITY_CTA_CANON */}
          <button
            onClick={primaryCTA.action}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${primaryCTA.style}`}
          >
            {primaryCTA.label}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CONTEXT RAIL (RIGHT) - Compact, Collapsible
// ============================================

interface ContextRailCompactProps {
  item: QueueItem | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  contextData?: ManualWorkbenchProps['contextData'];
}

function ContextRailCompact({ item, isCollapsed, onToggleCollapse, contextData }: ContextRailCompactProps) {
  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        className="h-full w-10 flex items-center justify-center text-white/40 hover:text-brand-iris transition-colors"
        aria-label="Expand context"
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-[10px] font-medium uppercase tracking-wider [writing-mode:vertical-lr]">Context</span>
        </div>
      </button>
    );
  }

  if (!item) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2.5 border-b border-slate-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/60">Context</h3>
          <button onClick={onToggleCollapse} className="p-1 text-white/40 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-white/40 text-center">Select an item to see context</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-4 flex items-center justify-between shrink-0">
        <h3 className="text-sm font-semibold text-white/60">Context</h3>
        <button onClick={onToggleCollapse} className="p-1 text-white/40 hover:text-white rounded transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* CiteMind Status */}
        {contextData?.citeMindStatus && (
          <section className={`p-3 rounded-lg border ${
            contextData.citeMindStatus === 'passed' ? 'bg-semantic-success/5 border-semantic-success/20' :
            contextData.citeMindStatus === 'warning' ? 'bg-semantic-warning/5 border-semantic-warning/20' :
            'bg-white/5 border-white/10'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/50">CiteMind</h4>
              <span className={`px-1.5 py-0.5 text-[10px] font-bold uppercase rounded ${
                contextData.citeMindStatus === 'passed' ? 'text-semantic-success bg-semantic-success/10' :
                contextData.citeMindStatus === 'warning' ? 'text-semantic-warning bg-semantic-warning/10' :
                'text-white/50 bg-white/5'
              }`}>
                {contextData.citeMindStatus}
              </span>
            </div>
            {contextData.citeMindIssues && contextData.citeMindIssues.length > 0 && (
              <ul className="space-y-1 mt-2">
                {contextData.citeMindIssues.slice(0, 2).map((issue, i) => (
                  <li key={i} className="text-sm text-white/60 flex items-start gap-1.5">
                    <span className={issue.severity === 'error' ? 'text-semantic-danger' : 'text-semantic-warning'}>!</span>
                    {issue.message}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Entities */}
        {contextData?.entities && contextData.entities.length > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Entities</h4>
            <div className="flex flex-wrap gap-1.5">
              {contextData.entities.map(entity => (
                <span key={entity} className="px-2 py-0.5 text-sm text-white/60 bg-white/5 rounded">
                  {entity}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Cross-Pillar */}
        {contextData?.crossPillar && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Cross-Pillar</h4>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">PR Hooks</span>
                <span className="font-medium text-white/70">{contextData.crossPillar.prHooks}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/50">SEO Hooks</span>
                <span className="font-medium text-white/70">{contextData.crossPillar.seoHooks}</span>
              </div>
            </div>
          </section>
        )}

        {/* Derivatives */}
        {contextData?.derivatives && contextData.derivatives.length > 0 && (
          <section className="p-3 bg-slate-2 border border-slate-4 rounded-lg">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/50 mb-2">Derivatives</h4>
            <div className="space-y-1">
              {contextData.derivatives.map(d => (
                <div key={d.type} className="flex items-center justify-between text-sm">
                  <span className="text-white/50">{d.type.replace(/_/g, ' ')}</span>
                  <span className={d.valid ? 'text-semantic-success' : 'text-white/30'}>
                    {d.valid ? '✓' : '—'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN WORKBENCH COMPONENT
// ============================================

export function ManualWorkbench({
  items,
  selectedId,
  onSelect,
  onExecute,
  onSaveDraft,
  onMarkReady,
  onCreateNew,
  isLoading,
  contextData,
}: ManualWorkbenchProps) {
  const [contextCollapsed, setContextCollapsed] = useState(false);

  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedId) || null;
  }, [items, selectedId]);

  const handleExecute = useCallback(() => {
    if (selectedItem && onExecute) {
      onExecute(selectedItem);
    }
  }, [selectedItem, onExecute]);

  const handleSaveDraft = useCallback(() => {
    if (selectedItem && onSaveDraft) {
      onSaveDraft(selectedItem);
    }
  }, [selectedItem, onSaveDraft]);

  const handleMarkReady = useCallback(() => {
    if (selectedItem && onMarkReady) {
      onMarkReady(selectedItem);
    }
  }, [selectedItem, onMarkReady]);

  return (
    <div className="h-[calc(100vh-180px)] flex bg-slate-0 rounded-lg border border-slate-4 overflow-hidden">
      {/* LEFT: Task List - Dense selection rail (240-280px) */}
      <div className="w-[260px] shrink-0 border-r border-slate-4 bg-slate-1">
        <TaskList
          items={items}
          selectedId={selectedId}
          onSelect={onSelect}
          isLoading={isLoading}
        />
      </div>

      {/* CENTER: Editor Canvas - Dominant */}
      <div className="flex-1 min-w-0">
        <EditorCanvas
          item={selectedItem}
          onSaveDraft={handleSaveDraft}
          onMarkReady={handleMarkReady}
          onExecute={handleExecute}
          onCreateNew={onCreateNew}
        />
      </div>

      {/* RIGHT: Context Rail - Compact, collapsible */}
      <div className={`shrink-0 border-l border-slate-4 bg-slate-1 transition-all duration-200 ${
        contextCollapsed ? 'w-10' : 'w-[240px]'
      }`}>
        <ContextRailCompact
          item={selectedItem}
          isCollapsed={contextCollapsed}
          onToggleCollapse={() => setContextCollapsed(!contextCollapsed)}
          contextData={contextData}
        />
      </div>
    </div>
  );
}
