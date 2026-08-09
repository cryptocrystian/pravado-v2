'use client';

/**
 * Content Work Surface — Route Page
 *
 * Connects the /app/content route to the ContentWorkSurfaceShell.
 * Replaces the old stale page (two-column mock layout, disconnected from shell).
 *
 * Per CONTENT_REBUILD_BRIEF.md and CONTENT_WORK_SURFACE_CONTRACT.md v2.0:
 * - ImpactStrip always present
 * - Tab nav: Overview / Library / Calendar / Insights
 * - No TriPaneShell (D022 — each view uses its own layout)
 * - CiteMind score is the primary visual hierarchy element
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/CONTENT_REBUILD_BRIEF.md
 */

export const dynamic = 'force-dynamic';

import { useState, useCallback, useRef } from 'react';

import { ContentLoadingSkeleton } from '@/components/content/components/ContentLoadingSkeleton';
import { CONTENT_OVERVIEW_MOCK } from '@/components/content/content-mock-data';
import { ContentWorkSurfaceShell } from '@/components/content/ContentWorkSurfaceShell';
import { useContentItems } from '@/components/content/hooks/useContentData';
import type {
  ContentView,
  ContentType,
  EditorInitData,
  CreationContentType,
} from '@/components/content/types';
import { ContentCalendarView } from '@/components/content/views/ContentCalendarView';
import { ContentEditorView } from '@/components/content/views/ContentEditorView';
import { ContentInsightsView } from '@/components/content/views/ContentInsightsView';
import { ContentLibraryView } from '@/components/content/views/ContentLibraryView';
import { ContentOverviewView } from '@/components/content/views/ContentOverviewView';
import { ModeEvaluatingState } from '@/components/shared/ModeEvaluatingState';
import { useMode } from '@/lib/ModeContext';

import { resolveContentViewState } from './contentViewState';

// ============================================
// MODULE-SCOPE CONSTANTS
// (outside component — never recreated on render)
// ============================================

const PROPOSAL_TYPE_MAP: Record<string, CreationContentType> = {
  guide: 'long_form_article',
  article: 'blog_post',
  comparison: 'blog_post',
  faq: 'blog_post',
  report: 'long_form_article',
};

export default function ContentSurfacePage() {
  const [activeView, setActiveView] = useState<ContentView>('work-queue');
  // Canonical per-pillar mode (server-hydrated via PR-1 ModeContext).
  const {
    effectiveMode: mode,
    setMode,
    isLoading: isModeLoading,
    isEvaluating,
  } = useMode('content');
  // First-paint hydration gate — avoid flashing the wrong mode's view before
  // the server mode resolves (MODE_UX_ARCHITECTURE §4D).
  const viewState = resolveContentViewState(isModeLoading, mode);
  // Real content library data (replaces CONTENT_OVERVIEW_MOCK for the Library
  // view). Honest loading/empty/error states are handled by ContentLibraryView.
  const {
    assets: libraryAssets,
    isLoading: libraryLoading,
    error: libraryError,
  } = useContentItems();
  const [editorInitData, setEditorInitData] = useState<EditorInitData | null>(
    null
  );
  const [editorWordCount, setEditorWordCount] = useState(0);
  const [editorTitle, setEditorTitle] = useState('');

  const openCreationRef = useRef<
    | ((
        data: Record<string, string>,
        contentType?: CreationContentType,
        stage?: 1 | 2
      ) => void)
    | null
  >(null);

  // Stable callback — useCallback prevents new fn reference on every render,
  // which would cause the shell's registerOpenCreation useEffect to loop.
  const handleRegisterOpenCreation = useCallback(
    (
      fn: (
        data: Record<string, string>,
        contentType?: CreationContentType,
        stage?: 1 | 2
      ) => void
    ) => {
      openCreationRef.current = fn;
    },
    [] // empty deps — ref assignment never needs to change
  );

  // Manual create — opens overlay at Stage 1 (no pre-fill)
  const handleCreateManual = useCallback(() => {
    openCreationRef.current?.({}, undefined, 1);
  }, []);

  const openEditorFor = useCallback((title: string) => {
    const initData: EditorInitData = {
      title,
      topic: '',
      keyword: '',
      audience: '',
      tone: '',
      contentType: null,
      outline: [],
    };
    setEditorInitData(initData);
    setEditorTitle(initData.title);
    setActiveView('editor');
  }, []);

  const handleViewChange = useCallback((view: ContentView) => {
    setActiveView(view);
  }, []);

  const handleCreateContent = useCallback((_contentType: ContentType) => {
    // TODO: Route to new content editor with type pre-selected
  }, []);

  const handleEditorBack = useCallback(() => {
    setActiveView('work-queue');
    setEditorInitData(null);
  }, []);

  const handleEditorLaunch = useCallback((initData: EditorInitData) => {
    setEditorInitData(initData);
    setEditorTitle(initData.title);
    setActiveView('editor');
  }, []);

  const renderView = () => {
    switch (activeView) {
      case 'work-queue':
        return (
          <ContentOverviewView
            data={CONTENT_OVERVIEW_MOCK}
            mode={mode}
            onCreateManual={handleCreateManual}
            onCreateFromBrief={(proposalId) => {
              const proposal = CONTENT_OVERVIEW_MOCK.proposals.find(
                (p) => p.id === proposalId
              );
              if (!proposal) return;
              openCreationRef.current?.(
                {
                  title: proposal.title,
                  topic: proposal.topicCluster,
                },
                PROPOSAL_TYPE_MAP[proposal.type]
              );
            }}
            onViewAllProposals={() => {
              // TODO: open proposals drawer or route to briefs
            }}
            onViewAsset={(assetId) => {
              const title =
                CONTENT_OVERVIEW_MOCK.recentAssets.find((a) => a.id === assetId)
                  ?.title ?? 'Untitled Document';
              openEditorFor(title);
            }}
            onResolveException={() => {
              openEditorFor('Document');
            }}
            onViewLibrary={() => setActiveView('library')}
          />
        );

      case 'library':
        return (
          <ContentLibraryView
            assets={libraryAssets}
            isLoading={libraryLoading}
            error={libraryError ?? null}
            onCreateAsset={() => handleCreateContent('blog_post')}
          />
        );

      case 'calendar':
        return (
          <ContentCalendarView
            assets={CONTENT_OVERVIEW_MOCK.recentAssets}
            briefs={[]}
            isLoading={false}
          />
        );

      case 'insights':
        return (
          <ContentInsightsView
            signals={{
              authorityContributionScore:
                CONTENT_OVERVIEW_MOCK.avgCiteMindScore,
              citationEligibilityScore:
                CONTENT_OVERVIEW_MOCK.avgCitationEligibility,
              aiIngestionLikelihood: CONTENT_OVERVIEW_MOCK.avgAiIngestion,
              crossPillarImpact: CONTENT_OVERVIEW_MOCK.avgCrossPillarImpact,
              // Honest zero (unavailable) — was a fabricated +2.1. The real
              // competitive-authority delta lands with the gated Insights
              // surface (unapplied migration 105); until then it must not
              // render a fake movement. Kept 0 to match the sibling honest
              // zeros above rather than inventing a number.
              competitiveAuthorityDelta: 0,
              measuredAt: new Date().toISOString(),
            }}
            topAssets={CONTENT_OVERVIEW_MOCK.recentAssets}
            gaps={[]}
            isLoading={false}
          />
        );

      case 'editor':
        return editorInitData ? (
          <ContentEditorView
            initData={editorInitData}
            mode={mode}
            onWordCountChange={setEditorWordCount}
            onTitleChange={setEditorTitle}
          />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <ContentWorkSurfaceShell
      activeView={activeView}
      onViewChange={handleViewChange}
      onCreateContent={handleCreateContent}
      mode={mode}
      onModeChange={setMode}
      aiStatus="idle"
      isEditorMode={activeView === 'editor'}
      editorTitle={editorTitle}
      editorWordCount={editorWordCount}
      onEditorBack={handleEditorBack}
      onEditorLaunch={handleEditorLaunch}
      registerOpenCreation={handleRegisterOpenCreation}
    >
      {viewState.kind === 'loading' ? (
        <div className="px-8 pt-6">
          <ContentLoadingSkeleton type="dashboard" />
        </div>
      ) : isEvaluating ? (
        <ModeEvaluatingState />
      ) : (
        renderView()
      )}
    </ContentWorkSurfaceShell>
  );
}
