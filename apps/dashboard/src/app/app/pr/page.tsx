'use client';

/**
 * PR Work Surface V1
 *
 * New PR interface built on SAGE/AUTOMATE/EVI/CiteMind canon model.
 * Replaces legacy PR UI (quarantined at /app/pr-legacy).
 *
 * Key principles:
 * - NO autopilot for relationship actions (pitches, follow-ups) // guardrail-allow: policy comment
 * - CiteMind AEO enabled by default, legacy wire opt-in
 * - Entity-first CRM with topic currency and relationship stages
 * - All AI suggestions require manual approval
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/CITEMIND_SYSTEM.md
 */

export const dynamic = 'force-dynamic';

import { Suspense, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  PRWorkSurfaceShell,
  PRInbox,
  PROverview,
  PRDatabase,
  PRPitches,
  PRCoverage,
  PRDistribution,
  PRSettings,
  type PRTab,
} from '@/components/pr-work-surface';

const VALID_TABS: PRTab[] = ['inbox', 'overview', 'database', 'pitches', 'coverage', 'distribution', 'settings'];

function isValidTab(tab: string | null): tab is PRTab {
  return tab !== null && VALID_TABS.includes(tab as PRTab);
}

// Loading skeleton for Suspense boundary
function PRWorkSurfaceLoading() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-magenta border-t-transparent rounded-full animate-spin" />
        <span className="text-white/60 text-sm">Loading PR Intelligence...</span>
      </div>
    </div>
  );
}

// Inner component that uses useSearchParams
function PRWorkSurfaceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname() || '/app/pr';

  // Read active tab from URL, default to 'inbox'
  const tabParam = searchParams?.get('tab') ?? null;
  const activeTab: PRTab = isValidTab(tabParam) ? tabParam : 'inbox';

  // Update URL when tab changes
  const handleTabChange = useCallback((tab: PRTab) => {
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    if (tab === 'inbox') {
      params.delete('tab'); // Clean URL for default tab
    } else {
      params.set('tab', tab);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }, [searchParams, router, pathname]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'inbox':
        return <PRInbox />;
      case 'overview':
        return <PROverview />;
      case 'database':
        return <PRDatabase />;
      case 'pitches':
        return <PRPitches />;
      case 'coverage':
        return <PRCoverage />;
      case 'distribution':
        return <PRDistribution />;
      case 'settings':
        return <PRSettings />;
      default:
        return <PRInbox />;
    }
  };

  return (
    <PRWorkSurfaceShell activeTab={activeTab} onTabChange={handleTabChange}>
      {renderTabContent()}
    </PRWorkSurfaceShell>
  );
}

export default function PRWorkSurfacePage() {
  return (
    <Suspense fallback={<PRWorkSurfaceLoading />}>
      <PRWorkSurfaceContent />
    </Suspense>
  );
}
