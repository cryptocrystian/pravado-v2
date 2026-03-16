'use client';

/**
 * ManualModeView - "I Am Creating" (Document-first)
 *
 * The Manual mode is a document-first creative workbench. Users see their
 * documents in a rail, open one into a TipTap editor, and get CiteMind/AEO
 * intelligence in a context rail.
 *
 * Layout:
 * +------------------------------------------------------+
 * | HealthStrip                    | + Create | Import    |  <- top bar
 * +------------------------------------------------------+
 * | DocumentRail | PravadoEditor (dominant) | ContextRail |  <- ManualWorkbench
 * | (220px)      | flex-1                   | (280px/0)   |
 * +------------------------------------------------------+
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 * @see /docs/canon/MODE_UX_ARCHITECTURE.md
 */

import { useState, useCallback, useMemo } from 'react';
import {
  HealthStrip,
  CTACluster,
  computeCiteMindIssueCount,
  type ContentModeViewProps,
} from './shared';
import { ManualWorkbench } from '../work-queue';
import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';
import { CiteMindPublishGate } from '../components/CiteMindPublishGate';

export function ManualModeView({
  signals,
  gaps,
  briefs,
  assets = [],
  clusters,
  isLoading,
  error,
  onViewBrief,
  onGenerateBrief,
  onCreateContent,
  onImportContent,
  onFixIssues,
  onGenerateDraft,
}: ContentModeViewProps) {
  // Document selection
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // CiteMind publish gate state
  const [publishGateOpen, setPublishGateOpen] = useState(false);
  const [publishGateAsset, setPublishGateAsset] = useState<{ id: string; title: string; aeoScore: number } | null>(null);

  // Derived data
  const citeMindIssueCount = useMemo(() => computeCiteMindIssueCount(assets), [assets]);

  const selectedAsset = useMemo(
    () => assets.find((a) => a.id === selectedDocId) || null,
    [assets, selectedDocId]
  );

  // Handlers
  const handleSelectDoc = useCallback((id: string) => setSelectedDocId(id), []);

  const handleSave = useCallback((data: { title: string; content: string }) => {
    // TODO: wire to API — save title + content for selectedDocId
    void data;
  }, []);

  const handlePublish = useCallback((assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    if (!asset) return;

    const aeoScore = asset.authoritySignals?.aiIngestionLikelihood ?? 35;
    setPublishGateAsset({ id: asset.id, title: asset.title, aeoScore });
    setPublishGateOpen(true);
  }, [assets]);

  const handlePublishConfirm = useCallback(() => {
    setPublishGateOpen(false);
    if (publishGateAsset) {
      onViewBrief?.(publishGateAsset.id);
    }
    setPublishGateAsset(null);
  }, [publishGateAsset, onViewBrief]);

  const handlePublishBypass = useCallback(() => {
    handlePublishConfirm();
  }, [handlePublishConfirm]);

  // Build context data for the selected document
  const contextData = useMemo(() => {
    if (!selectedAsset) return undefined;
    return {
      citeMindStatus: selectedAsset.citeMindStatus,
      citeMindIssues: selectedAsset.citeMindIssues,
      aeoScore: selectedAsset.authoritySignals?.aiIngestionLikelihood,
      entities: selectedAsset.entityAssociations,
      derivatives: [
        { type: 'pr_pitch_excerpt' as const, valid: true },
        { type: 'aeo_snippet' as const, valid: true },
        { type: 'ai_summary' as const, valid: false },
      ],
      crossPillar: { prHooks: 0, seoHooks: 0 },
    };
  }, [selectedAsset]);

  // Loading
  if (isLoading) {
    return <ContentLoadingSkeleton type="dashboard" />;
  }

  // Error
  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">Failed to load content</h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // Empty state — no data at all
  const hasData = signals || clusters.length > 0 || gaps.length > 0 || briefs.length > 0 || assets.length > 0;
  if (!hasData) {
    return (
      <ContentEmptyState
        view="work-queue"
        onAction={onGenerateBrief}
        actionLabel="Create Content"
      />
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar: Health strip + Manual CTAs */}
      <div className="px-4 py-3 border-b border-slate-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <HealthStrip signals={signals} citeMindIssueCount={citeMindIssueCount} />
          </div>
          <CTACluster
            mode="manual"
            hasIssues={citeMindIssueCount > 0}
            onGenerateBrief={onGenerateBrief}
            onImportContent={onImportContent}
            onFixIssues={onFixIssues}
            onGenerateDraft={onGenerateDraft}
          />
        </div>
      </div>

      {/* ManualWorkbench fills remaining viewport */}
      <div className="flex-1 min-h-0">
        <ManualWorkbench
          documents={assets}
          selectedId={selectedDocId}
          onSelect={handleSelectDoc}
          onCreateNew={onCreateContent ? () => onCreateContent('article') : () => {}}
          onSave={handleSave}
          onPublish={handlePublish}
          isLoading={isLoading}
          contextData={contextData}
        />
      </div>

      {/* CiteMind Publish Gate */}
      <CiteMindPublishGate
        isOpen={publishGateOpen}
        contentTitle={publishGateAsset?.title || ''}
        aeoScore={publishGateAsset?.aeoScore || 0}
        onPublish={handlePublishConfirm}
        onViewGaps={() => {
          setPublishGateOpen(false);
          setPublishGateAsset(null);
          onFixIssues?.();
        }}
        onBypass={handlePublishBypass}
        onClose={() => {
          setPublishGateOpen(false);
          setPublishGateAsset(null);
        }}
      />
    </div>
  );
}
