'use client';

/**
 * Content Library View
 *
 * Asset-centric grid view for the Content pillar.
 * Displays content assets with density-adaptive cards.
 * Includes filtering, search, and pagination.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useState, useMemo } from 'react';
import type { ContentAsset, DensityLevel, ContentStatus, ContentType } from '../types';
import { ContentAssetCard } from '../components/ContentAssetCard';
import { ContentFiltersPanel } from '../components/ContentFiltersPanel';
import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';

interface ContentLibraryViewProps {
  /** Content assets to display */
  assets: ContentAsset[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Currently selected asset ID */
  selectedAssetId?: string;
  /** Action handlers */
  onSelectAsset?: (assetId: string) => void;
  onCreateAsset?: () => void;
  /** Available filter options */
  availableEntities?: string[];
}

// ============================================
// DENSITY CALCULATION
// ============================================

function calculateDensity(itemCount: number): DensityLevel {
  if (itemCount <= 12) return 'comfortable';
  if (itemCount <= 24) return 'standard';
  return 'compact';
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentLibraryView({
  assets,
  isLoading,
  error,
  selectedAssetId,
  onSelectAsset,
  onCreateAsset,
  availableEntities = [],
}: ContentLibraryViewProps) {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<ContentType | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 24;

  // Filter and search assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      // Status filter
      if (statusFilter && asset.status !== statusFilter) return false;
      // Type filter
      if (typeFilter && asset.contentType !== typeFilter) return false;
      // Entity filter
      if (entityFilter && !asset.entityAssociations?.includes(entityFilter)) return false;
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !asset.title.toLowerCase().includes(q) &&
          !asset.authorityIntent?.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [assets, statusFilter, typeFilter, entityFilter, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / pageSize);
  const paginatedAssets = filteredAssets.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Calculate density based on visible items
  const density = calculateDensity(paginatedAssets.length);

  // Reset page when filters change
  const handleFilterChange = <T,>(setter: (val: T) => void) => (val: T) => {
    setter(val);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden">
        <ContentFiltersPanel
          statusFilter=""
          typeFilter=""
          searchQuery=""
          onStatusChange={() => {}}
          onTypeChange={() => {}}
          onSearchChange={() => {}}
        />
        <div className="flex-1 p-4">
          <ContentLoadingSkeleton type="card" density="standard" count={12} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">Failed to load library</h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <ContentEmptyState
        view="library"
        onAction={onCreateAsset}
        actionLabel="Create Content"
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Filters */}
      <ContentFiltersPanel
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        searchQuery={searchQuery}
        onStatusChange={handleFilterChange(setStatusFilter)}
        onTypeChange={handleFilterChange(setTypeFilter)}
        onSearchChange={handleFilterChange(setSearchQuery)}
        entityFilter={entityFilter}
        onEntityChange={handleFilterChange(setEntityFilter)}
        availableEntities={availableEntities}
      />

      {/* Results count */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-slate-4">
        <span className="text-xs text-white/40">
          {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
          {(statusFilter || typeFilter || entityFilter || searchQuery) && ' (filtered)'}
        </span>
        <span className="text-[10px] text-white/30 uppercase tracking-wider">
          {density} density
        </span>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {paginatedAssets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-white/50">No assets match your filters</p>
            <button
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setSearchQuery('');
                setEntityFilter('');
              }}
              className="mt-2 text-xs text-brand-iris hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div
            className={`grid gap-3 ${
              density === 'comfortable'
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                : density === 'standard'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            {paginatedAssets.map((asset) => (
              <ContentAssetCard
                key={asset.id}
                asset={asset}
                density={density}
                isSelected={asset.id === selectedAssetId}
                onClick={() => onSelectAsset?.(asset.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 flex items-center justify-center gap-2 border-t border-slate-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs text-white/70 bg-[#1A1A24] hover:bg-slate-4 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-white/50">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs text-white/70 bg-[#1A1A24] hover:bg-slate-4 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// ASSET DETAIL PREVIEW (for right rail)
// ============================================

interface AssetDetailPreviewProps {
  asset: ContentAsset;
  onEdit?: () => void;
  onClose?: () => void;
}

export function AssetDetailPreview({ asset, onEdit, onClose }: AssetDetailPreviewProps) {
  return (
    <div className="h-full flex flex-col bg-slate-0">
      {/* Header */}
      <div className="p-4 border-b border-slate-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white line-clamp-2">{asset.title}</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status */}
        <div>
          <span className="text-[10px] text-white/40 uppercase tracking-wider">Status</span>
          <p className="text-sm text-white capitalize mt-1">{asset.status}</p>
        </div>

        {/* Authority Intent */}
        {asset.authorityIntent && (
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Authority Intent</span>
            <p className="text-sm text-white/70 mt-1">{asset.authorityIntent}</p>
          </div>
        )}

        {/* Metrics */}
        {asset.authoritySignals && (
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Authority Metrics</span>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <MetricItem label="Authority" value={asset.authoritySignals.authorityContributionScore} />
              <MetricItem label="Citation" value={asset.authoritySignals.citationEligibilityScore} />
              <MetricItem label="AI Ready" value={asset.authoritySignals.aiIngestionLikelihood} />
              <MetricItem label="Cross-Pillar" value={asset.authoritySignals.crossPillarImpact} />
            </div>
          </div>
        )}

        {/* Entity Associations */}
        {asset.entityAssociations && asset.entityAssociations.length > 0 && (
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Entities</span>
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.entityAssociations.map((entity, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 text-[10px] bg-brand-iris/10 text-brand-iris rounded"
                >
                  {entity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Word Count */}
        {asset.wordCount && (
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Word Count</span>
            <p className="text-sm text-white mt-1">{asset.wordCount.toLocaleString()}</p>
          </div>
        )}

        {/* Timestamps */}
        <div className="pt-2 border-t border-slate-4">
          <div className="text-[10px] text-white/30">
            Created: {new Date(asset.createdAt).toLocaleDateString()}
          </div>
          <div className="text-[10px] text-white/30">
            Updated: {new Date(asset.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Actions */}
      {onEdit && (
        <div className="p-4 border-t border-slate-4">
          <button
            onClick={onEdit}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors"
          >
            Edit Asset
          </button>
        </div>
      )}
    </div>
  );
}

function MetricItem({ label, value }: { label: string; value: number }) {
  const getColor = (v: number) => {
    if (v >= 80) return 'text-semantic-success';
    if (v >= 60) return 'text-brand-cyan';
    if (v >= 40) return 'text-semantic-warning';
    return 'text-semantic-danger';
  };

  return (
    <div className="p-2 bg-slate-2 border border-border-subtle rounded-lg text-center">
      <div className={`text-sm font-bold ${getColor(value)}`}>{value}</div>
      <div className="text-[9px] text-white/40 uppercase">{label}</div>
    </div>
  );
}
