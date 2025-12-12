/**
 * AI Reasoning Popover (Sprint S93)
 *
 * A "Why am I seeing this?" affordance that provides:
 * - Trigger source for AI-generated content
 * - Related pillars and their influence
 * - Confidence score
 * - Suggested next actions
 *
 * Can be attached to any AI artifact (insights, recommendations, signals, etc.)
 */

'use client';

import { useState, useRef, useEffect } from 'react';

// Types
export interface AIReasoningContext {
  /** What triggered this AI artifact */
  triggerSource: string;
  /** Description of the trigger */
  triggerDescription?: string;
  /** The primary pillar that generated this */
  sourcePillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
  /** Other pillars that influenced or are affected by this */
  relatedPillars?: Array<{
    pillar: 'pr' | 'content' | 'seo' | 'exec' | 'crisis';
    influence: 'triggered_by' | 'informs' | 'updates' | 'affects';
    description?: string;
  }>;
  /** Confidence score (0-100) */
  confidence?: number;
  /** Suggested next actions */
  nextActions?: Array<{
    label: string;
    href?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
  /** When this was generated */
  generatedAt?: string;
}

// AI Dot
function AIDot({ status = 'idle' }: { status?: 'idle' | 'active' | 'processing' }) {
  const baseClasses = 'w-2 h-2 rounded-full';
  if (status === 'processing') {
    return <span className={`${baseClasses} bg-brand-iris animate-pulse`} />;
  }
  if (status === 'active') {
    return <span className={`${baseClasses} bg-brand-cyan`} />;
  }
  return <span className={`${baseClasses} bg-slate-6`} />;
}

// Pillar colors
const pillarColors: Record<string, { bg: string; text: string; border: string; label: string }> = {
  pr: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris/20', label: 'PR Intelligence' },
  content: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/20', label: 'Content Hub' },
  seo: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta/20', label: 'SEO Performance' },
  exec: { bg: 'bg-brand-amber/10', text: 'text-brand-amber', border: 'border-brand-amber/20', label: 'Executive Hub' },
  crisis: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', border: 'border-semantic-danger/20', label: 'Crisis Management' },
};

// Influence labels
const influenceLabels: Record<string, string> = {
  triggered_by: 'Triggered by',
  informs: 'Informs',
  updates: 'Updates',
  affects: 'Affects',
};

// Priority colors
const priorityColors: Record<string, string> = {
  high: 'bg-semantic-danger/10 text-semantic-danger',
  medium: 'bg-brand-amber/10 text-brand-amber',
  low: 'bg-slate-5/50 text-muted',
};

interface AIReasoningPopoverProps {
  context: AIReasoningContext;
  /** Position of popover relative to trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Render as icon button or inline text link */
  variant?: 'icon' | 'link';
  /** Custom trigger text for link variant */
  linkText?: string;
}

export function AIReasoningPopover({
  context,
  position = 'bottom',
  variant = 'icon',
  linkText = 'Why am I seeing this?',
}: AIReasoningPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Position classes
  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  const sourceColors = pillarColors[context.sourcePillar] || pillarColors.pr;

  return (
    <div className="relative inline-flex">
      {/* Trigger */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={
          variant === 'icon'
            ? 'p-1 rounded hover:bg-slate-4/50 text-muted hover:text-brand-cyan transition-colors'
            : 'text-xs text-brand-cyan hover:underline cursor-pointer'
        }
        aria-label="Why am I seeing this?"
        aria-expanded={isOpen}
      >
        {variant === 'icon' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ) : (
          linkText
        )}
      </button>

      {/* Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className={`absolute z-50 w-80 ${positionClasses[position]}`}
        >
          <div className="bg-slate-2 border border-border-subtle rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-3/50 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <AIDot status="active" />
                <span className="text-sm font-medium text-white">AI Reasoning</span>
                {context.confidence && (
                  <span className="ml-auto text-xs text-muted">
                    {context.confidence}% confidence
                  </span>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-4">
              {/* Trigger Source */}
              <div>
                <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                  Trigger Source
                </h4>
                <div className={`px-3 py-2 rounded-lg border ${sourceColors.bg} ${sourceColors.border}`}>
                  <p className={`text-sm font-medium ${sourceColors.text}`}>
                    {context.triggerSource}
                  </p>
                  {context.triggerDescription && (
                    <p className="text-xs text-muted mt-1">{context.triggerDescription}</p>
                  )}
                </div>
              </div>

              {/* Related Pillars */}
              {context.relatedPillars && context.relatedPillars.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Cross-Pillar Influence
                  </h4>
                  <div className="space-y-2">
                    {context.relatedPillars.map((rel, idx) => {
                      const colors = pillarColors[rel.pillar] || pillarColors.pr;
                      return (
                        <div key={idx} className="flex items-center gap-2 text-xs">
                          <span className="text-muted">{influenceLabels[rel.influence]}</span>
                          <span className={`px-2 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                            {colors.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Next Actions */}
              {context.nextActions && context.nextActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Suggested Actions
                  </h4>
                  <div className="space-y-2">
                    {context.nextActions.map((action, idx) => (
                      <a
                        key={idx}
                        href={action.href || '#'}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-3/50 hover:bg-slate-4/50 transition-colors group"
                      >
                        <span className="text-sm text-white group-hover:text-brand-cyan">
                          {action.label}
                        </span>
                        {action.priority && (
                          <span className={`text-[10px] px-2 py-0.5 rounded ${priorityColors[action.priority]}`}>
                            {action.priority}
                          </span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Generated timestamp */}
              {context.generatedAt && (
                <p className="text-[10px] text-slate-6 text-center">
                  Generated {new Date(context.generatedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple "Why am I seeing this?" text link that can be used inline
 */
export function AIReasoningLink({
  context,
  linkText = 'Why am I seeing this?',
}: {
  context: AIReasoningContext;
  linkText?: string;
}) {
  return <AIReasoningPopover context={context} variant="link" linkText={linkText} position="top" />;
}

export default AIReasoningPopover;
