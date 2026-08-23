'use client';

/**
 * Content Brief Work Surface — /app/content/brief/[id]
 *
 * GATED (launch honesty). This brief-planning surface is not yet wired to real
 * briefs — it previously rendered a hardcoded MOCK_BRIEF + MOCK_CITEMIND_PREVIEW.
 * Nothing in the app currently links here (direct-URL only). Like the other
 * content-editor detail surfaces it is deferred behind CONTENT_EDITOR_WIRED; show
 * the honest gate rather than fabricated brief content. Phase 1: wire real brief
 * loading (fetch `/api/content/briefs/${id}`) + the brief editor here.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';

export const dynamic = 'force-dynamic';

export default function ContentBriefPage() {
  return (
    <ComingSoonGate
      pillar="Content"
      subsurface="Content Brief"
      description="Constraints-first brief planning is being wired to your real briefs. It activates once brief editing lands."
    />
  );
}
