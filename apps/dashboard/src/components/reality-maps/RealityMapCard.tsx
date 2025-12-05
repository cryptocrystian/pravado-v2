'use client';

/**
 * RealityMapCard Component (Sprint S73)
 * Card component for displaying a reality map
 */

import type { RealityMap } from '@pravado/types';
import {
  STATUS_LABELS,
  getStatusBadgeClass,
} from '../../lib/realityMapApi';

interface RealityMapCardProps {
  map: RealityMap;
  onView?: (map: RealityMap) => void;
  onEdit?: (map: RealityMap) => void;
  onGenerate?: (map: RealityMap) => void;
  onDelete?: (map: RealityMap) => void;
}

export function RealityMapCard({
  map,
  onView,
  onEdit,
  onGenerate,
  onDelete,
}: RealityMapCardProps) {
  const statusClass = getStatusBadgeClass(map.status);
  const canGenerate = map.status === 'draft' || map.status === 'completed' || map.status === 'failed';
  const isGenerating = map.status === 'generating' || map.status === 'analyzing';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {map.name}
          </h3>
          {map.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {map.description}
            </p>
          )}
        </div>
        <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
          {STATUS_LABELS[map.status]}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
          <span>{map.totalNodes} nodes</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{map.totalPaths} paths</span>
        </div>
        {map.maxDepthReached > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
            <span>Depth {map.maxDepthReached}</span>
          </div>
        )}
      </div>

      {/* Config indicators */}
      <div className="flex flex-wrap gap-2 mb-4">
        {map.parameters.includeRiskAnalysis && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Risk Analysis
          </span>
        )}
        {map.parameters.includeOpportunityAnalysis && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
            Opportunities
          </span>
        )}
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
          {map.parameters.narrativeStyle}
        </span>
      </div>

      {/* Loading indicator */}
      {isGenerating && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {map.status === 'generating' ? 'Generating reality map...' : 'Running analysis...'}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onView?.(map)}
          className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          View
        </button>
        <button
          onClick={() => onEdit?.(map)}
          className="flex-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
        >
          Edit
        </button>
        {canGenerate && (
          <button
            onClick={() => onGenerate?.(map)}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            {map.status === 'draft' ? 'Generate' : 'Regenerate'}
          </button>
        )}
        <button
          onClick={() => onDelete?.(map)}
          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
