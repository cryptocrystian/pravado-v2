'use client';

/**
 * ModeEvaluatingState — cosmetic mode-transition indicator (PR-3, interpretation #4).
 *
 * Rendered for ~800ms when a pillar's mode changes, in place of the mode layout,
 * so the switch reads as "AI is recalculating" rather than an instant badge swap
 * (MODE_UX_ARCHITECTURE §4D / CONTENT_OVERVIEW_THREE_MODE_SPEC §373). Reuses the
 * canonical AI-state indicator (AI_VISUAL_COMMUNICATION_CANON `evaluating`) — no
 * new visual language. This is UX-only; there is no backend re-evaluation.
 */

import { AmbientAIIndicator } from '@/components/ai';

export function ModeEvaluatingState() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-3 py-24"
      role="status"
      aria-live="polite"
      data-testid="mode-evaluating"
    >
      <AmbientAIIndicator state="evaluating" size="md" showLabel />
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/40">
        {/* typography-allow: mode-transition micro-label */}
        Recalculating for new mode…
      </p>
    </div>
  );
}

export default ModeEvaluatingState;
