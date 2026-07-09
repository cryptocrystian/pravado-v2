'use client';

/**
 * SEO Overview — /app/seo
 *
 * Mode-aware: renders Manual / Copilot / Autopilot views based on the canonical
 * per-pillar mode (useMode('seo') — server-hydrated via the PR-1 ModeContext).
 * Uses effectiveMode so a stored mode above the plan ceiling never renders a
 * view the plan doesn't permit.
 */

export const dynamic = 'force-dynamic';

import { SEOAutopilotView } from '@/components/seo/SEOAutopilotView';
import { SEOCopilotView } from '@/components/seo/SEOCopilotView';
import { SEOManualView } from '@/components/seo/SEOManualView';
import { useMode } from '@/lib/ModeContext';

export default function SEOOverviewPage() {
  const { effectiveMode } = useMode('seo');

  return (
    <div className="pt-6 pb-16 px-8 max-w-[1600px] mx-auto">
      {effectiveMode === 'manual' && <SEOManualView activeTab="overview" />}
      {effectiveMode === 'copilot' && <SEOCopilotView activeTab="overview" />}
      {effectiveMode === 'autopilot' && (
        <SEOAutopilotView activeTab="overview" />
      )}
    </div>
  );
}
