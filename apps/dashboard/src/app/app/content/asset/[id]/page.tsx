'use client';

/**
 * Content Asset Work Surface
 *
 * Full asset editing page with:
 * - Structured editor area (simple sections)
 * - Right rail: Lifecycle stepper, CiteMind status, Cross-pillar hooks
 * - Derivatives panel (multi-surface generation)
 * - Version history with events
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import { CiteMindGatingPanel } from '@/components/content/components/CiteMindGatingPanel';
import { CrossPillarHooksPanel } from '@/components/content/components/CrossPillarHooksPanel';
import { DerivativesPanel } from '@/components/content/components/DerivativesPanel';
import { LifecycleStepper, type LifecycleStatus } from '@/components/content/components/LifecycleStepper';
import { VersionHistoryPanel, type VersionEvent } from '@/components/content/components/VersionHistoryPanel';
import { card, text, label, interactive, surface, border } from '@/components/content/tokens';
import type {
  ContentAsset,
  CiteMindStatus,
  DerivativeSurface,
  DerivativeType,
} from '@/components/content/types';

// ============================================
// TYPES
// ============================================

interface AssetPageProps {
  params: {
    id: string;
  };
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_ASSET: ContentAsset = {
  id: '1',
  organizationId: 'org-1',
  title: 'Ultimate Guide to Marketing Automation',
  contentType: 'long_form',
  status: 'draft',
  authorityIntent: 'Establish thought leadership in marketing automation space',
  wordCount: 4500,
  citeMindStatus: 'warning',
  citeMindIssues: [
    { type: 'unverified_claim', severity: 'warning', message: 'Statistics need source attribution', section: 'Introduction' },
    { type: 'missing_citation', severity: 'warning', message: 'Industry benchmark claim requires citation', section: 'Benefits' },
  ],
  entityAssociations: ['Marketing Automation', 'B2B Marketing', 'Lead Generation'],
  authoritySignals: {
    authorityContributionScore: 72,
    citationEligibilityScore: 65,
    aiIngestionLikelihood: 78,
    crossPillarImpact: 54,
    competitiveAuthorityDelta: 8,
    measuredAt: '2025-01-20T12:00:00.000Z',
  },
  body: `# Ultimate Guide to Marketing Automation

## Introduction

Marketing automation has become essential for modern businesses. Companies that implement automation see significant improvements in efficiency and conversion rates.

## What is Marketing Automation?

Marketing automation refers to software platforms designed to help marketers automate repetitive tasks...

## Key Benefits

- Increased efficiency
- Better lead nurturing
- Improved ROI tracking
- Personalized customer journeys

## Implementation Best Practices

When implementing marketing automation, consider these factors:

1. Define clear goals
2. Segment your audience
3. Create relevant content
4. Test and optimize

## Conclusion

Marketing automation is no longer optional for competitive businesses.`,
  createdAt: '2024-12-25T12:00:00.000Z',
  updatedAt: '2025-01-23T12:00:00.000Z',
};

const MOCK_DERIVATIVES: DerivativeSurface[] = [
  {
    id: 'deriv-1',
    parentAssetId: '1',
    surfaceType: 'pr_pitch_excerpt',
    content: 'New research shows marketing automation delivers 3x ROI improvement. Our comprehensive guide reveals the key strategies behind successful implementations.',
    valid: true,
    generatedAt: '2025-01-20T12:00:00.000Z',
  },
  {
    id: 'deriv-2',
    parentAssetId: '1',
    surfaceType: 'aeo_snippet',
    content: 'Marketing automation is software that automates repetitive marketing tasks like email campaigns, social media posting, and lead nurturing to improve efficiency and personalization.',
    valid: true,
    generatedAt: '2025-01-20T12:00:00.000Z',
  },
];

const MOCK_VERSION_EVENTS: VersionEvent[] = [
  { id: 'ev-1', version: 3, type: 'edited', description: 'Added conclusion section', author: 'Jane Smith', timestamp: '2025-01-23T14:30:00.000Z' },
  { id: 'ev-2', version: 3, type: 'citemind_check', description: 'CiteMind analysis: 2 warnings', author: 'System', timestamp: '2025-01-23T14:25:00.000Z' },
  { id: 'ev-3', version: 2, type: 'derivative_generated', description: 'Generated PR pitch excerpt', author: 'System', timestamp: '2025-01-20T10:00:00.000Z' },
  { id: 'ev-4', version: 2, type: 'edited', description: 'Updated benefits section', author: 'John Doe', timestamp: '2025-01-18T16:45:00.000Z' },
  { id: 'ev-5', version: 1, type: 'created', description: 'Initial draft created', author: 'John Doe', timestamp: '2025-01-11T09:00:00.000Z' },
];

const MOCK_CITATIONS = [
  'HubSpot State of Marketing Report 2024',
  'Gartner Marketing Technology Survey',
  'Forrester B2B Marketing Automation Wave',
];

// ============================================
// EDITOR SECTION COMPONENT
// ============================================

function EditorSection({
  title,
  content,
  onChange,
  placeholder,
}: {
  title: string;
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className={`${card.base} p-4`}>
      <h3 className={`${label} mb-2`}>{title}</h3>
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full min-h-[120px] p-3 text-sm ${text.primary} bg-slate-1 border ${border.default} rounded-lg resize-y focus:outline-none focus:border-brand-iris/40 focus:ring-1 focus:ring-brand-iris/20 placeholder:${text.hint}`}
      />
    </div>
  );
}

// ============================================
// ACTION BAR COMPONENT
// ============================================

function ActionBar({
  status,
  citeMindStatus,
  warningAcknowledged,
  onSave,
  isSaving,
  hasEdits,
}: {
  status: LifecycleStatus;
  citeMindStatus: CiteMindStatus;
  warningAcknowledged: boolean;
  onSave: () => void;
  isSaving: boolean;
  hasEdits: boolean;
}) {
  const isBlocked = citeMindStatus === 'blocked';
  const needsAck = citeMindStatus === 'warning' && !warningAcknowledged;

  return (
    <div className={`flex items-center justify-between p-4 border-t ${border.default} bg-slate-1`}>
      {/* Status indicator */}
      <div className="flex items-center gap-3">
        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
          status === 'published' ? 'bg-semantic-success/10 text-semantic-success' :
          status === 'approved' ? 'bg-brand-cyan/10 text-brand-cyan' :
          status === 'review' ? 'bg-semantic-warning/10 text-semantic-warning' :
          'bg-slate-4 text-white/60'
        }`}>
          {status}
        </span>
        {isBlocked && (
          <span className="text-xs text-semantic-danger">CiteMind blocked</span>
        )}
        {needsAck && (
          <span className="text-xs text-semantic-warning">Acknowledge warnings to proceed</span>
        )}
        {hasEdits && (
          <span className="text-xs text-semantic-warning">Unsaved changes</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onSave}
          disabled={isSaving || !hasEdits}
          className={`px-4 py-2 text-sm font-medium rounded-lg ${
            hasEdits && !isSaving ? interactive.primary : 'bg-slate-4 text-white/30 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function AssetWorkSurfacePage({ params }: AssetPageProps) {
  const router = useRouter();
  const [asset, setAsset] = useState<ContentAsset | null>(null);
  const [derivatives, setDerivatives] = useState<DerivativeSurface[]>([]);
  const [versionEvents, setVersionEvents] = useState<VersionEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [regeneratingTypes, setRegeneratingTypes] = useState<DerivativeType[]>([]);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const [lifecycleStatus, setLifecycleStatus] = useState<LifecycleStatus>('draft');

  // Editable content sections
  const [editedBody, setEditedBody] = useState('');
  const [editedTitle, setEditedTitle] = useState('');
  const [editedIntent, setEditedIntent] = useState('');

  // Fetch asset data
  useEffect(() => {
    async function fetchAsset() {
      setIsLoading(true);
      try {
        // In production, use: const res = await fetch(`/api/content/items/${params.id}`);
        // For now, use mock data
        await new Promise((resolve) => setTimeout(resolve, 500));
        setAsset(MOCK_ASSET);
        setDerivatives(MOCK_DERIVATIVES);
        setVersionEvents(MOCK_VERSION_EVENTS);
        setEditedBody(MOCK_ASSET.body || '');
        setEditedTitle(MOCK_ASSET.title);
        setEditedIntent(MOCK_ASSET.authorityIntent || '');
        setLifecycleStatus(MOCK_ASSET.status as LifecycleStatus);
      } catch {
        // Error handled by loading state
      } finally {
        setIsLoading(false);
      }
    }
    fetchAsset();
  }, [params.id]);

  // Track edits
  useEffect(() => {
    if (asset) {
      const bodyChanged = editedBody !== (asset.body || '');
      const titleChanged = editedTitle !== asset.title;
      const intentChanged = editedIntent !== (asset.authorityIntent || '');
      setHasEdits(bodyChanged || titleChanged || intentChanged);
    }
  }, [asset, editedBody, editedTitle, editedIntent]);

  // Handlers
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // In production: await fetch(`/api/content/items/${params.id}`, { method: 'PATCH', body: ... });
      setHasEdits(false);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // In production: await fetch(`/api/content/items/${params.id}/analyze`, { method: 'POST' });
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleRegenerate = useCallback(async (type: DerivativeType) => {
    setRegeneratingTypes((prev) => [...prev, type]);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // In production: await fetch(`/api/content/items/${params.id}/derivatives`, { method: 'POST', body: { type } });
    } finally {
      setRegeneratingTypes((prev) => prev.filter((t) => t !== type));
    }
  }, []);

  const handleLifecycleTransition = useCallback(async (from: LifecycleStatus, to: LifecycleStatus) => {
    setIsTransitioning(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In production: await fetch(`/api/content/items/${params.id}/status`, { method: 'PATCH', body: { status: to } });
      setLifecycleStatus(to);

      // Add version event for the transition
      const newEvent: VersionEvent = {
        id: `ev-${Date.now()}`,
        version: versionEvents[0]?.version || 1,
        type: 'status_change',
        description: `Status changed from ${from} to ${to}`,
        author: 'Current User',
        timestamp: new Date().toISOString(),
      };
      setVersionEvents((prev) => [newEvent, ...prev]);
    } finally {
      setIsTransitioning(false);
    }
  }, [versionEvents]);

  const handleGeneratePRHooks = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In production: await fetch(`/api/content/items/${params.id}/hooks/pr-pitch`, { method: 'POST' });
  }, []);

  const handleSendAEOBundle = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In production: await fetch(`/api/content/items/${params.id}/hooks/aeo-bundle`, { method: 'POST' });
  }, []);

  const handleAddToCommandCenter = useCallback(async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    // In production: await fetch(`/api/content/items/${params.id}/hooks/command-center`, { method: 'POST' });
  }, []);

  const handleRestoreVersion = useCallback(async (_eventId: string, version: number) => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // In production: await fetch(`/api/content/items/${params.id}/restore`, { method: 'POST', body: { version } });

    const newEvent: VersionEvent = {
      id: `ev-${Date.now()}`,
      version: version,
      type: 'restored',
      description: `Restored to version ${version}`,
      author: 'Current User',
      timestamp: new Date().toISOString(),
    };
    setVersionEvents((prev) => [newEvent, ...prev]);
  }, []);

  if (isLoading || !asset) {
    return (
      <div className={`min-h-screen ${surface.page} flex items-center justify-center`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-iris border-t-transparent rounded-full animate-spin" />
          <span className={text.secondary}>Loading asset...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${surface.page}`}>
      {/* Header */}
      <div className={`border-b ${border.default} bg-slate-1`}>
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/app/content')}
              className={`p-2 rounded-lg ${interactive.ghost}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className={`text-xl font-semibold ${text.primary} bg-transparent border-none focus:outline-none w-full`}
                placeholder="Asset title..."
              />
              <p className={`text-xs ${text.muted} mt-1`}>
                {asset.wordCount?.toLocaleString()} words · {asset.contentType.replace('_', ' ')} · Last updated {new Date(asset.updatedAt).toLocaleDateString()}
              </p>
            </div>
            {hasEdits && (
              <span className="px-2 py-1 text-[10px] font-medium text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/20 rounded-full">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-140px)]">
        {/* Editor Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Authority Intent */}
          <EditorSection
            title="Authority Intent"
            content={editedIntent}
            onChange={setEditedIntent}
            placeholder="What authority does this content reinforce?"
          />

          {/* Entity Associations */}
          <div className={`${card.base} p-4`}>
            <h3 className={`${label} mb-2`}>Entity Associations</h3>
            <div className="flex flex-wrap gap-2">
              {asset.entityAssociations?.map((entity, i) => (
                <span
                  key={i}
                  className="px-2 py-1 text-xs font-medium text-brand-iris bg-brand-iris/10 border border-brand-iris/20 rounded-full"
                >
                  {entity}
                </span>
              ))}
              <button className={`px-2 py-1 text-xs ${text.muted} ${interactive.ghost} rounded-full`}>
                + Add entity
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className={`${card.base} p-4`}>
            <h3 className={`${label} mb-2`}>Content Body</h3>
            <textarea
              value={editedBody}
              onChange={(e) => setEditedBody(e.target.value)}
              className={`w-full min-h-[400px] p-4 text-sm ${text.primary} bg-slate-1 border ${border.default} rounded-lg resize-y focus:outline-none focus:border-brand-iris/40 focus:ring-1 focus:ring-brand-iris/20 font-mono`}
              placeholder="Write your content here (Markdown supported)..."
            />
          </div>
        </div>

        {/* Right Rail */}
        <div className={`w-[360px] border-l ${border.default} bg-slate-1 overflow-y-auto`}>
          {/* Lifecycle Stepper */}
          <LifecycleStepper
            currentStatus={lifecycleStatus}
            citeMindStatus={asset.citeMindStatus}
            warningAcknowledged={warningAcknowledged}
            onTransition={handleLifecycleTransition}
            isTransitioning={isTransitioning}
          />

          <div className={`border-t ${border.default}`} />

          {/* CiteMind Gating */}
          <CiteMindGatingPanel
            status={asset.citeMindStatus}
            issues={asset.citeMindIssues}
            requiredCitations={MOCK_CITATIONS}
            warningAcknowledged={warningAcknowledged}
            onAcknowledgmentChange={setWarningAcknowledged}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            lastAnalyzedAt={asset.updatedAt}
          />

          <div className={`border-t ${border.default}`} />

          {/* Cross-Pillar Hooks */}
          <CrossPillarHooksPanel
            assetId={asset.id}
            assetTitle={asset.title}
            derivatives={derivatives}
            citeMindStatus={asset.citeMindStatus}
            onGeneratePRHooks={handleGeneratePRHooks}
            onSendAEOBundle={handleSendAEOBundle}
            onAddToCommandCenter={handleAddToCommandCenter}
          />

          <div className={`border-t ${border.default}`} />

          {/* Derivatives Panel */}
          <DerivativesPanel
            assetId={asset.id}
            derivatives={derivatives}
            parentEdited={hasEdits}
            citeMindStatus={asset.citeMindStatus}
            onRegenerate={handleRegenerate}
            regeneratingTypes={regeneratingTypes}
          />

          <div className={`border-t ${border.default}`} />

          {/* Version History */}
          <VersionHistoryPanel
            events={versionEvents}
            currentVersion={3}
            onRestore={handleRestoreVersion}
          />
        </div>
      </div>

      {/* Action Bar */}
      <ActionBar
        status={lifecycleStatus}
        citeMindStatus={asset.citeMindStatus}
        warningAcknowledged={warningAcknowledged}
        onSave={handleSave}
        isSaving={isSaving}
        hasEdits={hasEdits}
      />
    </div>
  );
}
