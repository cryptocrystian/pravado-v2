'use client';

/**
 * Content Asset Work Surface — /app/content/asset/[id]
 *
 * GATED (launch honesty). This surface is a content EDITOR and, like its
 * siblings /app/content/[documentId] and /app/content/new, is not yet wired to
 * real documents — the content editor is deferred behind CONTENT_EDITOR_WIRED.
 * It previously rendered a hardcoded MOCK_ASSET (and its /api/content/items/[id]
 * proxy is itself still a mock stub), so a Calendar/Insights click opened a
 * fabricated article. Until the editor is wired, show the honest gate instead of
 * fake content. Phase 1: implement the real fetch(`/api/content/items/${id}`) +
 * ArticleEditor here and flip CONTENT_EDITOR_WIRED.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';

export const dynamic = 'force-dynamic';

export default function AssetWorkSurfacePage() {
  return (
    <ComingSoonGate
      pillar="Content"
      subsurface="Content Editor"
      description="The article editor is being wired to your real documents. It activates once content editing lands."
    />
  );
}
