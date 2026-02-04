/**
 * Content Pillar Dashboard
 *
 * Main entry point for the Content Work Surface.
 * Uses canon-required views: Work Queue (execution-first), Library, Calendar, Insights.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/UX_CONTINUITY_CANON.md (Entry Point Invariant)
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ContentWorkSurfaceShell,
  ContentWorkQueueView,
  ContentLibraryView,
  ContentCalendarView,
  ContentInsightsView,
  AssetDetailPreview,
  type ContentView,
  type ContentAsset,
  type AuthoritySignals,
} from '@/components/content';
import { useMode } from '@/lib/ModeContext';

// ============================================
// MOCK DATA (for development while API routes are built)
// ============================================

// Stable timestamps to avoid hydration mismatch
const STABLE_NOW = '2025-01-15T12:00:00Z';

const MOCK_SIGNALS: AuthoritySignals = {
  authorityContributionScore: 72,
  citationEligibilityScore: 65,
  aiIngestionLikelihood: 78,
  crossPillarImpact: 54,
  competitiveAuthorityDelta: 8,
  measuredAt: STABLE_NOW,
};

const MOCK_ASSETS: ContentAsset[] = [
  {
    id: '1',
    organizationId: 'org-1',
    title: 'Ultimate Guide to Marketing Automation',
    contentType: 'long_form',
    status: 'published',
    authorityIntent: 'Establish thought leadership in marketing automation space',
    wordCount: 4500,
    citeMindStatus: 'passed',
    entityAssociations: ['Marketing Automation', 'B2B Marketing'],
    authoritySignals: {
      authorityContributionScore: 85,
      citationEligibilityScore: 78,
      aiIngestionLikelihood: 82,
      crossPillarImpact: 65,
      competitiveAuthorityDelta: 12,
      measuredAt: STABLE_NOW,
    },
    createdAt: '2024-12-16T12:00:00Z',
    updatedAt: '2025-01-10T12:00:00Z',
    publishedAt: '2025-01-10T12:00:00Z',
  },
  {
    id: '2',
    organizationId: 'org-1',
    title: 'Content Strategy Best Practices for 2024',
    contentType: 'blog_post',
    status: 'draft',
    authorityIntent: 'Drive organic traffic with timely content strategy insights',
    wordCount: 2100,
    citeMindStatus: 'warning',
    citeMindIssues: [
      { type: 'unverified_claim', severity: 'warning', message: 'Statistics need source attribution' },
    ],
    entityAssociations: ['Content Strategy', 'SEO'],
    authoritySignals: {
      authorityContributionScore: 62,
      citationEligibilityScore: 55,
      aiIngestionLikelihood: 70,
      crossPillarImpact: 48,
      competitiveAuthorityDelta: 3,
      measuredAt: STABLE_NOW,
    },
    createdAt: '2025-01-08T12:00:00Z',
    updatedAt: '2025-01-14T12:00:00Z',
  },
  {
    id: '3',
    organizationId: 'org-1',
    title: 'Case Study: How Acme Corp Increased Leads by 300%',
    contentType: 'case_study',
    status: 'review',
    authorityIntent: 'Demonstrate proven results and build credibility',
    wordCount: 1800,
    citeMindStatus: 'analyzing',
    entityAssociations: ['Case Studies', 'Lead Generation'],
    authoritySignals: {
      authorityContributionScore: 74,
      citationEligibilityScore: 80,
      aiIngestionLikelihood: 75,
      crossPillarImpact: 60,
      competitiveAuthorityDelta: 5,
      measuredAt: STABLE_NOW,
    },
    createdAt: '2025-01-01T12:00:00Z',
    updatedAt: '2025-01-13T12:00:00Z',
  },
];

const MOCK_BRIEFS = [
  {
    id: 'brief-1',
    organizationId: 'org-1',
    title: 'AI-Powered Content Creation Guide',
    status: 'draft' as const,
    targetKeyword: 'AI content creation',
    deadline: '2025-01-22T12:00:00Z',
    createdAt: '2025-01-12T12:00:00Z',
    updatedAt: '2025-01-14T12:00:00Z',
  },
  {
    id: 'brief-2',
    organizationId: 'org-1',
    title: 'B2B Email Marketing Playbook',
    status: 'approved' as const,
    targetKeyword: 'B2B email marketing',
    deadline: '2025-01-29T12:00:00Z',
    createdAt: '2025-01-05T12:00:00Z',
    updatedAt: '2025-01-13T12:00:00Z',
  },
];

const MOCK_GAPS = [
  {
    keyword: 'marketing automation ROI',
    intent: 'commercial' as const,
    seoOpportunityScore: 85,
    existingContentCount: 1,
    competitorCount: 5,
  },
  {
    keyword: 'content personalization strategies',
    intent: 'informational' as const,
    seoOpportunityScore: 72,
    existingContentCount: 0,
    competitorCount: 8,
  },
  {
    keyword: 'B2B lead nurturing best practices',
    intent: 'informational' as const,
    seoOpportunityScore: 68,
    existingContentCount: 2,
    competitorCount: 6,
  },
];

const MOCK_CLUSTERS = [
  {
    cluster: {
      id: 'cluster-1',
      organizationId: 'org-1',
      name: 'Marketing Automation',
      description: 'Content about marketing automation tools and strategies',
      createdAt: STABLE_NOW,
      updatedAt: STABLE_NOW,
    },
    topics: [
      { id: 't1', name: 'Email Automation', organizationId: 'org-1', createdAt: '', updatedAt: '' },
      { id: 't2', name: 'Lead Scoring', organizationId: 'org-1', createdAt: '', updatedAt: '' },
    ],
    representativeContent: [MOCK_ASSETS[0]],
  },
  {
    cluster: {
      id: 'cluster-2',
      organizationId: 'org-1',
      name: 'Content Strategy',
      description: 'Strategic content planning and optimization',
      createdAt: STABLE_NOW,
      updatedAt: STABLE_NOW,
    },
    topics: [
      { id: 't3', name: 'Content Calendar', organizationId: 'org-1', createdAt: '', updatedAt: '' },
      { id: 't4', name: 'SEO Content', organizationId: 'org-1', createdAt: '', updatedAt: '' },
    ],
    representativeContent: [MOCK_ASSETS[1]],
  },
];

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function ContentPage() {
  const router = useRouter();

  // Mode from context - Phase 10A user-controllable mode
  const { effectiveMode, setMode } = useMode('content');

  // P1.5: Handler to switch to Manual mode for low-confidence gate
  const handleSwitchToManual = useCallback(() => {
    setMode('manual');
  }, [setMode]);

  // View state - default to 'work-queue' for execution-first entry (UX Continuity Canon)
  const [activeView, setActiveView] = useState<ContentView>('work-queue');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  // Data hooks (using mock data for now, will use real hooks when API routes are ready)
  // const { items, isLoading: itemsLoading, error: itemsError } = useContentItems();
  // const { briefs, isLoading: briefsLoading } = useContentBriefs();
  // const { gaps, isLoading: gapsLoading } = useContentGaps();
  // const { clusters, isLoading: clustersLoading } = useContentClusters();
  // const { signals, isLoading: signalsLoading } = useContentSignals();

  // For now, use mock data
  const items = MOCK_ASSETS;
  const briefs = MOCK_BRIEFS;
  const gaps = MOCK_GAPS;
  const clusters = MOCK_CLUSTERS;
  const signals = MOCK_SIGNALS;
  const isLoading = false;
  const error = null;

  // Find selected asset
  const selectedAsset = selectedAssetId
    ? items.find((a) => a.id === selectedAssetId) || null
    : null;

  // Handlers
  const handleViewLibrary = useCallback(() => {
    setActiveView('library');
  }, []);

  const handleViewGap = useCallback((keyword: string) => {
    // Could navigate to a gap detail view or open a modal
    console.log('View gap:', keyword);
  }, []);

  const handleViewBrief = useCallback((briefId: string) => {
    router.push(`/app/content/brief/${briefId}`);
  }, [router]);

  const handleGenerateBrief = useCallback(() => {
    // Could open brief generation modal or navigate to creation page
    router.push('/app/content/brief/new');
  }, [router]);

  const handleSelectAsset = useCallback((assetId: string) => {
    setSelectedAssetId(assetId);
  }, []);

  const handleCreateAsset = useCallback(() => {
    router.push('/app/content/new');
  }, [router]);

  const handleEditAsset = useCallback(() => {
    if (selectedAssetId) {
      router.push(`/app/content/asset/${selectedAssetId}/edit`);
    }
  }, [router, selectedAssetId]);

  const handleImportContent = useCallback(() => {
    // Could open import modal
    console.log('Import content');
  }, []);

  const handleFixIssues = useCallback(() => {
    // Navigate to library filtered by CiteMind issues
    setActiveView('library');
  }, []);

  const handleGenerateDraft = useCallback(() => {
    // Could open AI draft generation modal
    console.log('Generate draft');
  }, []);

  const handleViewCluster = useCallback((clusterId: string) => {
    // Navigate to library filtered by cluster
    console.log('View cluster:', clusterId);
    setActiveView('library');
  }, []);

  const handleViewCalendar = useCallback(() => {
    setActiveView('calendar');
  }, []);

  // Phase 6A.7: Launch orchestration editor for an action
  const handleLaunchOrchestrate = useCallback((actionId: string) => {
    router.push(`/app/content/orchestrate/${actionId}`);
  }, [router]);

  // Render active view
  const renderActiveView = () => {
    switch (activeView) {
      case 'work-queue':
        return (
          <ContentWorkQueueView
            signals={signals}
            clusters={clusters}
            gaps={gaps}
            briefs={briefs}
            assets={items}
            mode={effectiveMode}
            isLoading={isLoading}
            error={error}
            onViewLibrary={handleViewLibrary}
            onViewGap={handleViewGap}
            onViewBrief={handleViewBrief}
            onGenerateBrief={handleGenerateBrief}
            onImportContent={handleImportContent}
            onFixIssues={handleFixIssues}
            onGenerateDraft={handleGenerateDraft}
            onViewCluster={handleViewCluster}
            onViewCalendar={handleViewCalendar}
            onLaunchOrchestrate={handleLaunchOrchestrate}
            onSwitchToManual={handleSwitchToManual}
          />
        );
      case 'library':
        return (
          <ContentLibraryView
            assets={items}
            isLoading={isLoading}
            error={error}
            selectedAssetId={selectedAssetId ?? undefined}
            onSelectAsset={handleSelectAsset}
            onCreateAsset={handleCreateAsset}
            availableEntities={['Marketing Automation', 'Content Strategy', 'Lead Generation', 'SEO']}
          />
        );
      case 'calendar':
        return (
          <ContentCalendarView
            assets={items.filter((a) => a.publishedAt)}
            briefs={briefs}
            isLoading={isLoading}
            error={error}
            onSelectAsset={handleSelectAsset}
            onSelectBrief={handleViewBrief}
            onCreateBrief={handleGenerateBrief}
          />
        );
      case 'insights':
        return (
          <ContentInsightsView
            signals={signals}
            topAssets={items.sort(
              (a, b) =>
                (b.authoritySignals?.authorityContributionScore ?? 0) -
                (a.authoritySignals?.authorityContributionScore ?? 0)
            )}
            gaps={gaps}
            isLoading={isLoading}
            error={error}
            onViewAsset={handleSelectAsset}
            onViewGap={handleViewGap}
            onGenerateBrief={handleGenerateBrief}
          />
        );
      default:
        return null;
    }
  };

  // Render right rail content (for library view asset preview)
  const renderRightRail = () => {
    if (activeView === 'library' && selectedAsset) {
      return (
        <AssetDetailPreview
          asset={selectedAsset}
          onEdit={handleEditAsset}
          onClose={() => setSelectedAssetId(null)}
        />
      );
    }
    return null;
  };

  return (
    <ContentWorkSurfaceShell
      activeView={activeView}
      onViewChange={setActiveView}
      rightRailContent={renderRightRail()}
      showRightRail={activeView === 'library' && !!selectedAsset}
    >
      {renderActiveView()}
    </ContentWorkSurfaceShell>
  );
}
