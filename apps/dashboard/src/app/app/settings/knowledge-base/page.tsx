'use client';

/**
 * Knowledge Base Settings — /app/settings/knowledge-base
 *
 * Phase 0 Track 0B: gated behind SETTINGS_KNOWLEDGE_BASE_WIRED. No KB backend
 * exists yet; mock kbCategories with fake file counts removed.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export default function KnowledgeBaseSettingsPage() {
  const wired = useFeatureFlag('SETTINGS_KNOWLEDGE_BASE_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Settings" subsurface="Knowledge Base" />;
  }
  // Phase 1 restores the per-category sections once the KB backend exists.
  return null;
}
