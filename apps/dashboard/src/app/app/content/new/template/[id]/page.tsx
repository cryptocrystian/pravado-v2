'use client';

/**
 * Template Brief Intake — /app/content/new/template/[id]
 *
 * Phase 0 Track 0B: gated behind CONTENT_EDITOR_WIRED. The form used
 * mockTemplates to look up the template by id — that import is removed.
 * Phase 1 restores the form + live preview against real template data.
 */

export const dynamic = 'force-dynamic';

import { ComingSoonGate } from '@/components/gates/ComingSoonGate';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function TemplateIntakePage(_props: PageProps) {
  const wired = useFeatureFlag('CONTENT_EDITOR_WIRED');
  if (!wired) {
    return <ComingSoonGate pillar="Content" subsurface="Templates" />;
  }
  // Phase 1 restores the intake form render here.
  return null;
}
