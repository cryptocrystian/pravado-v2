'use client';

/**
 * ActionStreamPane - Action Stream Display
 *
 * Displays prioritized action items from the AI.
 * Each action card shows pillar, priority, summary, confidence/impact,
 * gate status, and CTA buttons.
 *
 * @see /contracts/examples/action-stream.json
 */

import type { ActionItem, ActionStreamResponse, Pillar, Priority } from './types';

interface ActionStreamPaneProps {
  data: ActionStreamResponse | null;
  isLoading: boolean;
  error: Error | null;
  onActionSelect?: (action: ActionItem) => void;
  selectedActionId?: string | null;
}

// Pillar color mapping (DS v3.1)
const pillarColors: Record<Pillar, { bg: string; text: string; border: string }> = {
  pr: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta/30' },
  content: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris/30' },
  seo: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/30' },
};

// Priority styling
const priorityStyles: Record<Priority, { dot: string; label: string }> = {
  critical: { dot: 'bg-semantic-danger', label: 'Critical' },
  high: { dot: 'bg-semantic-warning', label: 'High' },
  medium: { dot: 'bg-brand-cyan', label: 'Medium' },
  low: { dot: 'bg-slate-5', label: 'Low' },
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
  const pillarStyle = pillarColors[action.pillar];
  const priorityStyle = priorityStyles[action.priority];

  // Build border class based on pillar
  const borderHoverClass =
    action.pillar === 'seo'
      ? 'hover:border-brand-cyan/40'
      : action.pillar === 'pr'
        ? 'hover:border-brand-magenta/40'
        : 'hover:border-brand-iris/40';

  // Selected state styling
  const selectedClass = isSelected
    ? action.pillar === 'seo'
      ? 'border-brand-cyan/60 shadow-[0_0_12px_rgba(0,217,255,0.15)]'
      : action.pillar === 'pr'
        ? 'border-brand-magenta/60 shadow-[0_0_12px_rgba(232,121,249,0.15)]'
        : 'border-brand-iris/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
    : 'border-[#1F1F28]';

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
        group p-4 bg-[#13131A] border rounded-lg
        ${selectedClass}
        ${borderHoverClass}
        transition-all duration-200 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-brand-cyan/30 focus:ring-offset-2 focus:ring-offset-[#0A0A0F]
      `}
    >
      {/* Header: Pillar + Priority */}
      <div className="flex items-center justify-between mb-2">
        <span
          className={`
            px-2 py-0.5 text-xs font-medium rounded uppercase
            ${pillarStyle.bg} ${pillarStyle.text}
          `}
        >
          {action.pillar}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${priorityStyle.dot}`} />
          <span className="text-xs text-slate-6">{priorityStyle.label}</span>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-white mb-1.5 line-clamp-2">
        {action.title}
      </h3>

      {/* Summary */}
      <p className="text-xs text-slate-6 mb-3 line-clamp-2">
        {action.summary}
      </p>

      {/* Confidence & Impact Meters */}
      <div className="flex gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-6 uppercase tracking-wide">Confidence</span>
            <span className="text-[10px] text-white font-medium">{Math.round(action.confidence * 100)}%</span>
          </div>
          <div className="h-1 bg-[#1F1F28] rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-cyan rounded-full transition-all duration-300"
              style={{ width: `${action.confidence * 100}%` }}
            />
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-slate-6 uppercase tracking-wide">Impact</span>
            <span className="text-[10px] text-white font-medium">{Math.round(action.impact * 100)}%</span>
          </div>
          <div className="h-1 bg-[#1F1F28] rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-iris rounded-full transition-all duration-300"
              style={{ width: `${action.impact * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Gate Warning */}
      {action.gate.required && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 mb-3 bg-semantic-warning/10 border border-semantic-warning/20 rounded text-xs">
          <svg className="w-3.5 h-3.5 text-semantic-warning flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-semantic-warning">
            {action.gate.reason || 'Requires approval'}
            {action.gate.min_plan && ` (${action.gate.min_plan}+ plan)`}
          </span>
        </div>
      )}

      {/* Mode Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className={`
            px-2 py-0.5 text-[10px] font-medium rounded uppercase tracking-wide
            ${action.mode === 'autopilot' ? 'bg-brand-cyan/10 text-brand-cyan' : ''}
            ${action.mode === 'copilot' ? 'bg-brand-iris/10 text-brand-iris' : ''}
            ${action.mode === 'manual' ? 'bg-slate-4/50 text-slate-6' : ''}
          `}
        >
          {action.mode}
        </span>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2">
        <button
          className={`
            flex-1 px-3 py-1.5 text-xs font-medium rounded
            ${pillarStyle.bg} ${pillarStyle.text} ${pillarStyle.border}
            border hover:brightness-110 transition-all duration-200
          `}
        >
          {action.cta.primary}
        </button>
        <button className="px-3 py-1.5 text-xs font-medium text-slate-6 hover:text-white transition-colors">
          {action.cta.secondary}
        </button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg animate-pulse">
          <div className="flex items-center justify-between mb-3">
            <div className="h-5 w-12 bg-slate-4 rounded" />
            <div className="h-4 w-16 bg-slate-5 rounded" />
          </div>
          <div className="h-4 w-3/4 bg-slate-4 rounded mb-2" />
          <div className="h-3 w-full bg-slate-5 rounded mb-1" />
          <div className="h-3 w-2/3 bg-slate-5 rounded mb-4" />
          <div className="flex gap-2">
            <div className="h-8 flex-1 bg-slate-4 rounded" />
            <div className="h-8 w-16 bg-slate-5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ error }: { error: Error }) {
  return (
    <div className="p-4">
      <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-semantic-danger flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-semantic-danger">Failed to load actions</h4>
            <p className="text-xs text-slate-6 mt-1">{error.message}</p>
          </div>
        </div>
      </div>
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
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="p-4">
        <div className="p-8 text-center text-slate-6">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-slate-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm">No actions pending</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {data.items.map((action) => (
        <ActionCard
          key={action.id}
          action={action}
          onClick={() => onActionSelect?.(action)}
          isSelected={selectedActionId === action.id}
        />
      ))}
    </div>
  );
}
