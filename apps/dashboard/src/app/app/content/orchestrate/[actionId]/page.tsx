'use client';

/**
 * Content Orchestration Editor — /app/content/orchestrate/[actionId]
 *
 * GATED (launch honesty). This execution-focused orchestration surface is not
 * yet wired — it previously rendered hardcoded MOCK_TRIGGER_ACTIONS /
 * MOCK_ENTITY_CHECKLIST / MOCK_AI_PROFILES. Nothing in the app currently links
 * here (direct-URL only). Deferred behind CONTENT_EDITOR_WIRED alongside the
 * other content-editor detail surfaces; show the honest gate rather than a
 * fabricated orchestration plan. Phase 1: wire the real orchestration action
 * (fetch the CRAFT action by id) + the execution editor here.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/CRAFT_EXECUTION_MODEL.md
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';

export const dynamic = 'force-dynamic';

export default function ContentOrchestrationPage() {
  return (
    <ComingSoonGate
      pillar="Content"
      subsurface="Orchestration"
      description="The content orchestration editor is being wired to your real CRAFT actions. It activates once orchestration lands."
    />
  );
}
