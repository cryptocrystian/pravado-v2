'use client';

/**
 * IntelligenceCanvasPane v3 — Full-Height Entity Map + Tab Bar
 *
 * Three-tab canvas:
 *   ENTITY MAP (default) | ORCHESTRATION (Coming Soon) | SYNERGY FLOW (Coming Soon)
 *
 * Phase 0 Track 0B: gated behind CC_ENTITY_MAP_WIRED. The Entity Map was
 * driven by ~340 lines of hardcoded MOCK_ENTITY_NODES / MOCK_ENTITY_EDGES
 * (fabricated competitor entities, fake citation counts). Those constants
 * have been deleted; the gate renders ComingSoonGate until SAGE provides
 * the real entity-map signal feed.
 *
 * Phase 1 restores: the tab toolbar, zoom controls, fullscreen toggle, and
 * the EntityMap render against /api/v1/sage/entity-map.
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md §8
 * @see /docs/canon/COMMAND-CENTER-UI.md
 * @see /docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0B-MOCK-CONTAINMENT.md §4
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface IntelligenceCanvasPaneProps {
  hoveredActionId?: string | null;
  executingActionId?: string | null;
}

export function IntelligenceCanvasPane(_props: IntelligenceCanvasPaneProps) {
  const wired = useFeatureFlag('CC_ENTITY_MAP_WIRED');
  if (!wired) {
    return (
      <ComingSoonGate
        pillar="Command"
        subsurface="Intelligence Canvas"
        description="SAGE is building your entity map. This activates once your first signals are ingested across PR, content, and SEO."
      />
    );
  }
  // Phase 1 restores the full Entity Map / Orchestration / Synergy Flow canvas.
  return null;
}
