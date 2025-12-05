'use client';

/**
 * ConflictCard Component (Sprint S74)
 * Card component for displaying an insight conflict
 */

import type { InsightConflict } from '@pravado/types';
import {
  getConflictTypeLabel,
  getConflictTypeBgColor,
  getConflictTypeColor,
  getConflictSeverityLabel,
  getConflictSeverityBadgeColor,
  getConflictStatusLabel,
  getConflictStatusBadgeColor,
  formatRelativeTime,
} from '../../lib/insightConflictApi';

interface ConflictCardProps {
  conflict: InsightConflict;
  onView?: (conflict: InsightConflict) => void;
  onAnalyze?: (conflict: InsightConflict) => void;
  onResolve?: (conflict: InsightConflict) => void;
  onDismiss?: (conflict: InsightConflict) => void;
  selected?: boolean;
  onSelect?: (conflict: InsightConflict) => void;
}

export function ConflictCard({
  conflict,
  onView,
  onAnalyze,
  onResolve,
  onDismiss,
  selected,
  onSelect,
}: ConflictCardProps) {
  const canAnalyze = conflict.status === 'detected';
  const canResolve = conflict.status === 'detected' || conflict.status === 'analyzing';
  const isAnalyzing = conflict.status === 'analyzing';
  const isResolved = conflict.status === 'resolved';
  const isDismissed = conflict.status === 'dismissed';

  return (
    <div
      className={`bg-white rounded-lg border ${
        selected ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'
      } p-4 hover:shadow-md transition-shadow cursor-pointer`}
      onClick={() => onSelect?.(conflict)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConflictTypeBgColor(conflict.conflictType)} ${getConflictTypeColor(conflict.conflictType)}`}>
              {getConflictTypeLabel(conflict.conflictType)}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConflictSeverityBadgeColor(conflict.severity)}`}>
              {getConflictSeverityLabel(conflict.severity)}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {conflict.title}
          </h3>
          {conflict.conflictSummary && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {conflict.conflictSummary}
            </p>
          )}
        </div>
        <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${getConflictStatusBadgeColor(conflict.status)}`}>
          {getConflictStatusLabel(conflict.status)}
        </span>
      </div>

      {/* Affected Systems */}
      {conflict.affectedSystems.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {conflict.affectedSystems.slice(0, 3).map((system) => (
            <span
              key={system}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
            >
              {system}
            </span>
          ))}
          {conflict.affectedSystems.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
              +{conflict.affectedSystems.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{conflict.sourceEntities?.length || 0} sources</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatRelativeTime(conflict.createdAt)}</span>
        </div>
        {conflict.items && conflict.items.length > 0 && (
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{conflict.items.length} items</span>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isAnalyzing && (
        <div className="mb-4 flex items-center gap-2 text-sm text-blue-600">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Analyzing conflict...
        </div>
      )}

      {/* Resolution indicator */}
      {isResolved && conflict.resolutions && conflict.resolutions.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-green-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Resolved with {conflict.resolutions[0].resolutionType.replace('_', ' ')}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => onView?.(conflict)}
          className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          View
        </button>
        {canAnalyze && (
          <button
            onClick={() => onAnalyze?.(conflict)}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            Analyze
          </button>
        )}
        {canResolve && (
          <button
            onClick={() => onResolve?.(conflict)}
            className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
          >
            Resolve
          </button>
        )}
        {!isDismissed && !isResolved && (
          <button
            onClick={() => onDismiss?.(conflict)}
            className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}
