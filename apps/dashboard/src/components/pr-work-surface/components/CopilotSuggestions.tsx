'use client';

/**
 * Copilot Suggestions - DS 3.0
 *
 * AI-generated suggestions that require manual execution.
 * NO autopilot - all suggestions are advisory only.
 *
 * @see /docs/canon/SAGE_v2.md
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import type { CopilotSuggestion } from '../types';

interface Props {
  suggestions: CopilotSuggestion[];
  onActionClick?: (suggestion: CopilotSuggestion) => void;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    critical: 'bg-semantic-danger/15 text-semantic-danger ring-semantic-danger/30',
    high: 'bg-semantic-warning/15 text-semantic-warning ring-semantic-warning/30',
    medium: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30',
    low: 'bg-white/10 text-white/50 ring-white/20',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ring-1 ${colors[priority as keyof typeof colors] || colors.low}`}>
      {priority}
    </span>
  );
}

export function CopilotSuggestions({ suggestions, onActionClick }: Props) {
  if (suggestions.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl border border-dashed border-[#1A1A24]">
        <svg className="w-12 h-12 mx-auto text-white/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p className="text-sm text-white/55">No suggestions at this time.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Disclaimer */}
      <div className="p-4 rounded-xl bg-brand-cyan/5 border border-brand-cyan/20">
        <p className="text-xs text-brand-cyan">
          These are AI suggestions only. All actions require your explicit approval and execution.
        </p>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24] hover:border-brand-cyan/30 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <PriorityBadge priority={suggestion.priority} />
              <span className="text-xs text-white/55">
                {suggestion.confidence}% confidence
              </span>
            </div>
            <h3 className="font-medium text-white">{suggestion.title}</h3>
            <p className="text-sm text-white/55 mt-1">{suggestion.description}</p>
            <div className="mt-3 p-2 rounded-lg bg-[#13131A]">
              <p className="text-xs text-white/55">
                <span className="text-brand-cyan">Rationale:</span> {suggestion.rationale}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onActionClick?.(suggestion)}
              className="mt-3 w-full px-4 py-2 text-sm font-medium text-brand-cyan bg-brand-cyan/10 rounded-lg hover:bg-brand-cyan/20 transition-colors border border-brand-cyan/20"
            >
              {suggestion.actionLabel}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
