'use client';

/**
 * ConflictDetail Component (Sprint S74)
 * Detailed view for a single insight conflict
 */

import type { InsightConflict, InsightConflictItem } from '@pravado/types';
import {
  getConflictTypeLabel,
  getConflictTypeBgColor,
  getConflictTypeColor,
  getConflictSeverityLabel,
  getConflictSeverityBadgeColor,
  getConflictStatusLabel,
  getConflictStatusBadgeColor,
  getItemRoleLabel,
  getItemRoleColor,
  getSourceSystemLabel,
  getSourceSystemColor,
  formatConfidenceScore,
  getConfidenceScoreColor,
  formatDate,
  formatRelativeTime,
} from '../../lib/insightConflictApi';

interface ConflictDetailProps {
  conflict: InsightConflict;
  items?: InsightConflictItem[];
  onClose?: () => void;
  onAnalyze?: () => void;
  onResolve?: () => void;
  onDismiss?: () => void;
}

export function ConflictDetail({
  conflict,
  items = [],
  onClose,
  onAnalyze,
  onResolve,
  onDismiss,
}: ConflictDetailProps) {
  const canAnalyze = conflict.status === 'detected';
  const canResolve = conflict.status === 'detected' || conflict.status === 'analyzing';
  const canDismiss = conflict.status !== 'resolved' && conflict.status !== 'dismissed';

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getConflictTypeBgColor(conflict.conflictType)} ${getConflictTypeColor(conflict.conflictType)}`}>
                {getConflictTypeLabel(conflict.conflictType)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConflictSeverityBadgeColor(conflict.severity)}`}>
                {getConflictSeverityLabel(conflict.severity)}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getConflictStatusBadgeColor(conflict.status)}`}>
                {getConflictStatusLabel(conflict.status)}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">{conflict.title}</h2>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>Created {formatRelativeTime(conflict.createdAt)}</span>
              {conflict.updatedAt !== conflict.createdAt && (
                <span>Updated {formatRelativeTime(conflict.updatedAt)}</span>
              )}
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4">
          {canAnalyze && onAnalyze && (
            <button
              onClick={onAnalyze}
              className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Analyze
            </button>
          )}
          {canResolve && onResolve && (
            <button
              onClick={onResolve}
              className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Resolve
            </button>
          )}
          {canDismiss && onDismiss && (
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      {conflict.conflictSummary && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
          <p className="text-sm text-gray-600">{conflict.conflictSummary}</p>
        </div>
      )}

      {/* Affected Systems */}
      {conflict.affectedSystems.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Affected Systems</h3>
          <div className="flex flex-wrap gap-2">
            {conflict.affectedSystems.map((system) => (
              <span
                key={system}
                className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 ${getSourceSystemColor(system)}`}
              >
                {getSourceSystemLabel(system)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source Entities */}
      {conflict.sourceEntities && conflict.sourceEntities.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Source Entities</h3>
          <div className="space-y-2">
            {conflict.sourceEntities.map((entity, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {entity.displayName || entity.entityType}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entity.sourceSystem} • {entity.entityType}
                  </div>
                </div>
                {entity.url && (
                  <a
                    href={entity.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conflict Items */}
      {items.length > 0 && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Conflicting Insights</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {item.itemRole && (
                      <span className={`text-xs font-medium ${getItemRoleColor(item.itemRole)}`}>
                        {getItemRoleLabel(item.itemRole)}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{getSourceSystemLabel(item.sourceSystem)}</span>
                  </div>
                  {item.confidenceScore !== null && item.confidenceScore !== undefined && (
                    <span className={`text-xs font-medium ${getConfidenceScoreColor(item.confidenceScore)}`}>
                      {formatConfidenceScore(item.confidenceScore)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700">{item.rawInsight}</p>
                {item.processedInsight && item.processedInsight !== item.rawInsight && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    Processed: {item.processedInsight}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{item.entityType}</span>
                  {item.sourceTimestamp && (
                    <span>Source: {formatDate(item.sourceTimestamp)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reality Map Link */}
      {conflict.linkedRealityMapId && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Linked Reality Map</h3>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="text-sm text-gray-600 font-mono">{conflict.linkedRealityMapId}</span>
            {conflict.linkedNodeIds && conflict.linkedNodeIds.length > 0 && (
              <span className="text-xs text-gray-400">
                ({conflict.linkedNodeIds.length} nodes linked)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Cluster Info */}
      {conflict.cluster && (
        <div className="p-4 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Conflict Cluster</h3>
          <div className="p-3 bg-indigo-50 rounded-lg">
            <div className="font-medium text-indigo-900">{conflict.cluster.name}</div>
            {conflict.cluster.description && (
              <p className="text-sm text-indigo-700 mt-1">{conflict.cluster.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-xs text-indigo-600">
              <span>{conflict.cluster.conflictCount} conflicts in cluster</span>
              {conflict.clusterSimilarity !== null && conflict.clusterSimilarity !== undefined && (
                <span>{Math.round(conflict.clusterSimilarity * 100)}% similarity</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="p-4 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>ID: {conflict.id}</span>
          <span>Last updated: {formatDate(conflict.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
