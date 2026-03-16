'use client';

/**
 * SEO Overview — /app/seo
 *
 * Mode-aware: renders Manual / Copilot / Autopilot views based on SEOModeContext.
 * The existing SEOManualView / SEOCopilotView / SEOAutopilotView components are
 * fully built — we just need to mount the right one.
 */

export const dynamic = 'force-dynamic';

import { useSEOMode } from '@/components/seo/SEOModeContext';
import { SEOManualView } from '@/components/seo/SEOManualView';
import { SEOCopilotView } from '@/components/seo/SEOCopilotView';
import { SEOAutopilotView } from '@/components/seo/SEOAutopilotView';

export default function SEOOverviewPage() {
  const { mode } = useSEOMode();

  return (
    <div className="pt-6 pb-16 px-8 max-w-[1600px] mx-auto">

      {mode === 'manual' && <SEOManualView activeTab="overview" />}
      {mode === 'copilot' && <SEOCopilotView activeTab="overview" />}
      {mode === 'autopilot' && <SEOAutopilotView activeTab="overview" />}
    </div>
  );
}
