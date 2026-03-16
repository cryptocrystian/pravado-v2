'use client';

/**
 * CiteMind Publish Gate
 *
 * Intercepts publish actions and enforces AEO Score threshold.
 * Per CONTENT_WORK_SURFACE_CONTRACT.md and SEO_AEO_PILLAR_CANON.md §3E:
 * - AEO Score < 41: Block with explanation + [View Gaps] + [Publish Anyway]
 * - AEO Score >= 41: Show score and proceed
 * - Bypass is ALWAYS permitted (shown but requires explicit click)
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/SEO_AEO_PILLAR_CANON.md §3E
 */

const AEO_THRESHOLD = 41;

export interface CiteMindPublishGateProps {
  /** Whether the gate modal is open */
  isOpen: boolean;
  /** Content title for display */
  contentTitle: string;
  /** AEO score for the content item */
  aeoScore: number;
  /** Called when user confirms publish (score >= threshold) */
  onPublish: () => void;
  /** Called when user clicks "View Gaps" */
  onViewGaps: () => void;
  /** Called when user bypasses the gate (score < threshold but publishes anyway) */
  onBypass: () => void;
  /** Called when user dismisses the gate */
  onClose: () => void;
}

export function CiteMindPublishGate({
  isOpen,
  contentTitle,
  aeoScore,
  onPublish,
  onViewGaps,
  onBypass,
  onClose,
}: CiteMindPublishGateProps) {
  if (!isOpen) return null;

  const isBlocked = aeoScore < AEO_THRESHOLD;
  const scoreColor = isBlocked ? 'text-semantic-danger' : 'text-semantic-success';
  const scoreBg = isBlocked ? 'bg-semantic-danger/10' : 'bg-semantic-success/10';
  const scoreBorder = isBlocked ? 'border-semantic-danger/20' : 'border-semantic-success/20';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-0/80 z-40"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-md bg-slate-2 border border-slate-4 rounded-xl shadow-elev-3 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${scoreBg} border ${scoreBorder}`}>
                {isBlocked ? (
                  <svg className="w-5 h-5 text-semantic-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white/95">CiteMind Publish Check</h3>
                <p className="text-xs text-white/50">AEO Score Verification</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Content title */}
            <p className="text-sm text-white/70 truncate">
              <span className="text-white/40">Publishing:</span>{' '}
              <span className="text-white font-medium">{contentTitle}</span>
            </p>

            {/* AEO Score Display */}
            <div className={`flex items-center justify-between p-4 rounded-lg ${scoreBg} border ${scoreBorder}`}>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">AEO Score</p> {/* typography-allow: system label */}
                <p className="text-xs text-white/40 mt-0.5">
                  Threshold: {AEO_THRESHOLD}
                </p>
              </div>
              <span className={`text-3xl font-bold tabular-nums ${scoreColor}`}>{aeoScore}</span>
            </div>

            {/* Message */}
            {isBlocked ? (
              <div className="space-y-2">
                <p className="text-sm text-white/70 leading-relaxed">
                  This content is unlikely to be cited by AI systems. Publishing below the AEO threshold
                  ({AEO_THRESHOLD}) means reduced visibility in AI-generated answers.
                </p>
                <p className="text-xs text-white/40">
                  You can still publish, but consider reviewing the gaps first.
                </p>
              </div>
            ) : (
              <p className="text-sm text-semantic-success/80 leading-relaxed">
                This content meets the citation threshold and is likely to be referenced by AI systems.
                Ready to publish.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border-slate-4 bg-slate-1/50">
            {isBlocked ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onViewGaps}
                    className="flex-1 px-4 py-2.5 text-sm font-medium text-brand-iris bg-brand-iris/10 hover:bg-brand-iris/20 border border-brand-iris/20 rounded-lg transition-colors"
                  >
                    View Gaps
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-sm font-medium text-white/50 hover:text-white bg-slate-4 hover:bg-slate-5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <button
                  type="button"
                  onClick={onBypass}
                  className="w-full px-4 py-2 text-xs font-medium text-white/40 hover:text-white/60 transition-colors"
                >
                  Publish Anyway — bypass CiteMind check
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onPublish}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                >
                  Publish
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-white/50 hover:text-white bg-slate-4 hover:bg-slate-5 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
