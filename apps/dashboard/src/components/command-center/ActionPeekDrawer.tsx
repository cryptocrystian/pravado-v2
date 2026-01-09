'use client';

/**
 * ActionPeekDrawer - Right-side drawer for action details
 *
 * Opens when an action card is clicked in the Action Stream.
 * Shows full details, confidence/impact meters, gate info, and CTAs.
 *
 * DS v3.1 styling with pillar accent colors.
 *
 * @see /docs/canon/DS_v3_1_EXPRESSION.md
 */

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { modeStyles, pillarAccents, priorityStyles } from './pillar-accents';
import type { ActionItem } from './types';

interface ActionPeekDrawerProps {
  action: ActionItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function ConfidenceImpactMeter({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const percentage = Math.round(value * 100);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
          {label}
        </span>
        <span className="text-sm font-bold text-white">{percentage}%</span>
      </div>
      <div className="h-2 bg-[#1F1F28] rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {/* Tick marks */}
      <div className="flex justify-between px-1">
        {[0, 25, 50, 75, 100].map((tick) => (
          <span key={tick} className="text-[11px] text-white/50"> {/* typography-allow: meter ticks */}
            {tick}
          </span>
        ))}
      </div>
    </div>
  );
}

function GateWarning({ gate }: { gate: ActionItem['gate'] }) {
  if (!gate.required) return null;

  return (
    <div className="p-4 bg-semantic-warning/10 border border-semantic-warning/20 rounded-lg">
      <div className="flex items-start gap-3">
        <svg
          className="w-5 h-5 text-semantic-warning flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <h4 className="text-sm font-medium text-semantic-warning">
            Approval Required
          </h4>
          <p className="text-xs text-white/70 mt-1">
            {gate.reason || 'This action requires approval before execution.'}
          </p>
          {gate.min_plan && (
            <p className="text-xs text-semantic-warning mt-2">
              Available on <span className="font-semibold">{gate.min_plan}</span>{' '}
              plan and above
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffPlaceholder() {
  return (
    <div className="p-4 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4 text-white/50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="text-xs font-medium text-white/70 uppercase tracking-wide">
          Details / Diff Preview
        </span>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full bg-[#1F1F28] rounded animate-pulse" />
        <div className="h-3 w-4/5 bg-[#1F1F28] rounded animate-pulse" />
        <div className="h-3 w-3/5 bg-[#1F1F28] rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-[#1F1F28] rounded animate-pulse" />
      </div>
      <p className="text-xs text-white/50 mt-3 text-center italic">
        Detailed content preview coming soon
      </p>
    </div>
  );
}

export function ActionPeekDrawer({ action, isOpen, onClose }: ActionPeekDrawerProps) {
  if (!action) return null;

  const pillarStyle = pillarAccents[action.pillar];
  const priorityStyle = priorityStyles[action.priority];
  const modeStyle = modeStyles[action.mode];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-[#13131A] border-l border-[#1F1F28] p-0 overflow-hidden"
      >
        {/* Header with pillar accent */}
        <div
          className={`px-6 pt-6 pb-4 bg-gradient-to-b ${pillarStyle.gradient}`}
        >
          <SheetHeader className="space-y-3">
            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Pillar chip */}
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded uppercase tracking-wide ${pillarStyle.bg} ${pillarStyle.text} border ${pillarStyle.border}`}
              >
                {action.pillar}
              </span>

              {/* Priority badge */}
              <div className="flex items-center gap-1.5 px-2 py-1 bg-[#1F1F28] rounded">
                <span
                  className={`w-2 h-2 rounded-full ${priorityStyle.dot}`}
                />
                <span className="text-xs text-white/70">
                  {priorityStyle.label}
                </span>
              </div>

              {/* Mode badge */}
              <span
                className={`px-2 py-1 text-[11px] font-medium rounded uppercase tracking-wide ${modeStyle.bg} ${modeStyle.text}`} // typography-allow: badge
              >
                {modeStyle.label}
              </span>
            </div>

            {/* Title */}
            <SheetTitle className="text-lg font-semibold text-white leading-tight">
              {action.title}
            </SheetTitle>

            {/* Summary */}
            <SheetDescription className="text-sm text-white/70 leading-relaxed">
              {action.summary}
            </SheetDescription>
          </SheetHeader>
        </div>

        {/* Scrollable content area */}
        <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
          {/* Confidence & Impact Meters */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide">
              AI Analysis
            </h3>
            <ConfidenceImpactMeter
              label="Confidence"
              value={action.confidence}
              color="bg-brand-cyan"
            />
            <ConfidenceImpactMeter
              label="Impact"
              value={action.impact}
              color="bg-brand-iris"
            />
          </div>

          {/* Gate Warning */}
          <GateWarning gate={action.gate} />

          {/* Diff/Details Placeholder */}
          <div>
            <h3 className="text-xs font-semibold text-white/70 uppercase tracking-wide mb-3">
              Preview
            </h3>
            <DiffPlaceholder />
          </div>

          {/* Metadata */}
          <div className="pt-4 border-t border-[#1F1F28]">
            <div className="flex items-center justify-between text-xs text-white/50">
              <span>Action ID: {action.id.slice(0, 8)}...</span>
              <span>
                Updated:{' '}
                {new Date(action.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer with CTAs - sticky at bottom */}
        <div className="absolute bottom-0 left-0 right-0 px-6 py-4 bg-[#13131A] border-t border-[#1F1F28]">
          <div className="flex gap-3">
            <button
              className={`
                flex-1 px-4 py-2.5 text-sm font-medium rounded-lg
                ${pillarStyle.bg} ${pillarStyle.text}
                border ${pillarStyle.border}
                hover:${pillarStyle.bgHover} hover:${pillarStyle.borderHover}
                ${pillarStyle.glow}
                transition-all duration-200
              `}
              onClick={() => {
                // TODO: Implement primary action
                console.log('Primary CTA:', action.cta.primary);
              }}
            >
              {action.cta.primary}
            </button>
            <button
              className="px-4 py-2.5 text-sm font-medium text-white/70 hover:text-white bg-[#1F1F28] hover:bg-[#2A2A36] rounded-lg transition-colors"
              onClick={() => {
                // TODO: Implement secondary action
                console.log('Secondary CTA:', action.cta.secondary);
              }}
            >
              {action.cta.secondary}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
