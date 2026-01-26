'use client';

/**
 * Derivatives Panel
 *
 * Displays derivative surfaces generated from a content asset.
 * Per canon: PR excerpt, AEO snippet, AI-ready summary, social fragments.
 *
 * Shows status (fresh/stale), lastGeneratedAt, regenerate action.
 * Editing the parent asset marks derivatives as stale.
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md Section 4.3
 */

import { useState, useCallback } from 'react';

import { derivativeStatus, card, text, interactive, label } from '../tokens';
import type { DerivativeType, DerivativeSurface, CiteMindStatus } from '../types';

// ============================================
// TYPES
// ============================================

interface DerivativeConfig {
  type: DerivativeType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

interface DerivativeItemProps {
  derivative: DerivativeSurface | null;
  config: DerivativeConfig;
  isStale: boolean;
  isGenerating: boolean;
  citeMindStatus: CiteMindStatus;
  onGenerate: () => void;
  onCopy: () => void;
}

export interface DerivativesPanelProps {
  /** Asset ID */
  assetId: string;
  /** Existing derivatives */
  derivatives: DerivativeSurface[];
  /** Whether parent asset was edited (marks all as stale) */
  parentEdited?: boolean;
  /** CiteMind status of the parent */
  citeMindStatus: CiteMindStatus;
  /** Callback when regenerate is triggered */
  onRegenerate?: (type: DerivativeType) => void;
  /** Whether regeneration is in progress */
  regeneratingTypes?: DerivativeType[];
  /** Loading state */
  isLoading?: boolean;
}

// ============================================
// DERIVATIVE CONFIGURATIONS
// ============================================

const DERIVATIVE_CONFIGS: DerivativeConfig[] = [
  {
    type: 'pr_pitch_excerpt',
    label: 'PR Pitch Excerpt',
    description: 'Key points for media outreach',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    type: 'aeo_snippet',
    label: 'AEO Snippet',
    description: 'AI Engine Optimized extract',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    type: 'ai_summary',
    label: 'AI-Ready Summary',
    description: 'Structured for AI ingestion',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    type: 'social_fragment',
    label: 'Social Fragments',
    description: 'Platform-ready snippets',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
  },
];

// ============================================
// DERIVATIVE ITEM COMPONENT
// ============================================

function DerivativeItem({
  derivative,
  config,
  isStale,
  isGenerating,
  citeMindStatus,
  onGenerate,
  onCopy,
}: DerivativeItemProps) {
  const [showContent, setShowContent] = useState(false);
  const hasContent = derivative && derivative.content;
  const isBlocked = citeMindStatus === 'blocked';

  // Determine status styling
  const getStatusStyle = () => {
    if (isGenerating) return derivativeStatus.generating;
    if (!hasContent) return { bg: 'bg-slate-4', text: 'text-white/40', border: 'border-slate-5', label: 'Not generated' };
    if (isStale) return derivativeStatus.stale;
    return derivativeStatus.fresh;
  };

  const statusStyle = getStatusStyle();

  return (
    <div className={`${card.base} p-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-md ${hasContent ? 'bg-brand-iris/10 text-brand-iris' : 'bg-slate-4 text-white/40'}`}>
            {config.icon}
          </div>
          <div>
            <h4 className={`text-sm font-medium ${hasContent ? text.primary : text.muted}`}>
              {config.label}
            </h4>
            <p className={`text-[10px] ${text.hint}`}>{config.description}</p>
          </div>
        </div>

        {/* Status Badge */}
        <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
          {statusStyle.label}
        </span>
      </div>

      {/* Content Preview */}
      {hasContent && (
        <div className="mb-3">
          <button
            onClick={() => setShowContent(!showContent)}
            className={`w-full text-left text-xs ${text.secondary} hover:${text.primary} transition-colors`}
          >
            {showContent ? (
              <div className="p-2 bg-slate-3 rounded border border-slate-4 max-h-32 overflow-y-auto">
                <p className="whitespace-pre-wrap">{derivative.content}</p>
              </div>
            ) : (
              <p className="truncate">
                {derivative.content.slice(0, 100)}...
                <span className="text-brand-iris ml-1">Show more</span>
              </p>
            )}
          </button>
        </div>
      )}

      {/* Timestamp */}
      {derivative?.generatedAt && (
        <p className={`text-[10px] ${text.hint} mb-2`}>
          Generated {new Date(derivative.generatedAt).toLocaleDateString()}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onGenerate}
          disabled={isBlocked || isGenerating}
          className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            isBlocked
              ? 'bg-slate-4 text-white/30 cursor-not-allowed'
              : isGenerating
              ? 'bg-brand-iris/20 text-brand-iris cursor-wait'
              : `${interactive.button}`
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-1.5">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generating...
            </span>
          ) : hasContent ? (
            'Regenerate'
          ) : (
            'Generate'
          )}
        </button>

        {hasContent && (
          <button
            onClick={onCopy}
            className={`px-3 py-1.5 text-xs font-medium rounded-md ${interactive.ghost}`}
            title="Copy to clipboard"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        )}
      </div>

      {/* Blocked Warning */}
      {isBlocked && (
        <p className="mt-2 text-[10px] text-semantic-danger">
          CiteMind blocked — resolve issues before generating
        </p>
      )}
    </div>
  );
}

// ============================================
// LOADING SKELETON
// ============================================

function DerivativesSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`${card.base} p-3 animate-pulse`}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-slate-4 rounded-md" />
            <div className="flex-1">
              <div className="h-4 w-24 bg-slate-4 rounded mb-1" />
              <div className="h-3 w-32 bg-slate-4 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-4 rounded-full" />
          </div>
          <div className="h-8 w-full bg-slate-4 rounded" />
        </div>
      ))}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DerivativesPanel({
  assetId: _assetId,
  derivatives,
  parentEdited = false,
  citeMindStatus,
  onRegenerate,
  regeneratingTypes = [],
  isLoading = false,
}: DerivativesPanelProps) {
  const [copiedType, setCopiedType] = useState<DerivativeType | null>(null);

  // Find derivative by type
  const getDerivative = (type: DerivativeType): DerivativeSurface | null => {
    return derivatives.find((d) => d.surfaceType === type) || null;
  };

  // Copy to clipboard
  const handleCopy = useCallback(async (type: DerivativeType, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, []);

  // Handle regenerate
  const handleRegenerate = useCallback((type: DerivativeType) => {
    onRegenerate?.(type);
  }, [onRegenerate]);

  if (isLoading) {
    return (
      <div className="p-4">
        <h3 className={`${label} mb-3`}>Multi-Surface Derivatives</h3>
        <DerivativesSkeleton />
      </div>
    );
  }

  const isBlocked = citeMindStatus === 'blocked';
  const isWarning = citeMindStatus === 'warning';

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className={label}>Multi-Surface Derivatives</h3>
        {parentEdited && (
          <span className="px-2 py-0.5 text-[10px] font-medium text-semantic-warning bg-semantic-warning/10 border border-semantic-warning/20 rounded-full">
            Parent edited
          </span>
        )}
      </div>

      {/* Info banner for blocked/warning state */}
      {isBlocked && (
        <div className="mb-4 p-3 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <p className="text-xs text-semantic-danger font-medium">
            CiteMind has blocked this content. Derivative generation is disabled until issues are resolved.
          </p>
        </div>
      )}

      {isWarning && (
        <div className="mb-4 p-3 bg-semantic-warning/10 border border-semantic-warning/20 rounded-lg">
          <p className="text-xs text-semantic-warning">
            CiteMind has warnings. Derivatives can be generated but may require review.
          </p>
        </div>
      )}

      {/* Derivatives List */}
      <div className="space-y-3">
        {DERIVATIVE_CONFIGS.map((config) => {
          const derivative = getDerivative(config.type);
          const isStale = parentEdited || (derivative ? !derivative.valid : false);
          const isGenerating = regeneratingTypes.includes(config.type);

          return (
            <DerivativeItem
              key={config.type}
              derivative={derivative}
              config={config}
              isStale={isStale}
              isGenerating={isGenerating}
              citeMindStatus={citeMindStatus}
              onGenerate={() => handleRegenerate(config.type)}
              onCopy={() => derivative && handleCopy(config.type, derivative.content)}
            />
          );
        })}
      </div>

      {/* Copy Feedback Toast */}
      {copiedType && (
        <div className="fixed bottom-4 right-4 px-4 py-2 bg-semantic-success text-white text-sm font-medium rounded-lg shadow-lg animate-in slide-in-from-bottom-2">
          Copied to clipboard!
        </div>
      )}

      {/* Generate All Button */}
      <button
        onClick={() => {
          DERIVATIVE_CONFIGS.forEach((config) => {
            if (!regeneratingTypes.includes(config.type)) {
              handleRegenerate(config.type);
            }
          });
        }}
        disabled={isBlocked || regeneratingTypes.length > 0}
        className={`w-full mt-4 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isBlocked || regeneratingTypes.length > 0
            ? 'bg-slate-4 text-white/30 cursor-not-allowed'
            : interactive.primary
        }`}
      >
        {regeneratingTypes.length > 0 ? 'Generating...' : 'Generate All Derivatives'}
      </button>
    </div>
  );
}

export default DerivativesPanel;
