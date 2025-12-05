/**
 * CompetitorCard Component (Sprint S53)
 *
 * Displays competitor profile card with tier, metrics, and actions
 */

'use client';

import React from 'react';
import type { Competitor } from '@pravado/types';
import { getTierColor, getTierBgColor, getTierLabel, formatNumber } from '@/lib/competitorIntelligenceApi';

interface CompetitorCardProps {
  competitor: Competitor;
  metrics?: {
    mentionCount: number;
    avgSentiment?: number;
    eviScore?: number;
  };
  onSelect?: (competitor: Competitor) => void;
  onEdit?: (competitor: Competitor) => void;
  onDelete?: (competitor: Competitor) => void;
  isSelected?: boolean;
  className?: string;
}

export default function CompetitorCard({
  competitor,
  metrics,
  onSelect,
  onEdit,
  onDelete,
  isSelected = false,
  className = '',
}: CompetitorCardProps) {
  return (
    <div
      className={`
        border rounded-lg p-4 transition-all cursor-pointer
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${className}
      `}
      onClick={() => onSelect?.(competitor)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-gray-900">{competitor.name}</h3>
            {!competitor.isActive && (
              <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                Inactive
              </span>
            )}
          </div>
          {competitor.domain && (
            <a
              href={`https://${competitor.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {competitor.domain}
            </a>
          )}
        </div>

        {/* Tier Badge */}
        <div className={`px-3 py-1 rounded-full ${getTierBgColor(competitor.tier)}`}>
          <span className={`text-sm font-medium ${getTierColor(competitor.tier)}`}>
            {getTierLabel(competitor.tier)}
          </span>
        </div>
      </div>

      {/* Description */}
      {competitor.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{competitor.description}</p>
      )}

      {/* Industry */}
      {competitor.industry && (
        <div className="text-xs text-gray-500 mb-3">
          Industry: <span className="font-medium">{competitor.industry}</span>
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500">Mentions</div>
            <div className="text-sm font-semibold text-gray-900">
              {formatNumber(metrics.mentionCount)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">Sentiment</div>
            <div className="text-sm font-semibold text-gray-900">
              {metrics.avgSentiment !== undefined
                ? metrics.avgSentiment.toFixed(2)
                : 'N/A'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500">EVI</div>
            <div className="text-sm font-semibold text-gray-900">
              {metrics.eviScore !== undefined ? metrics.eviScore.toFixed(0) : 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Keywords Preview */}
      {competitor.keywords && competitor.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {competitor.keywords.slice(0, 3).map((keyword, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded"
            >
              {keyword}
            </span>
          ))}
          {competitor.keywords.length > 3 && (
            <span className="px-2 py-0.5 text-xs text-gray-500">
              +{competitor.keywords.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      {(onEdit || onDelete) && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(competitor);
              }}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(competitor);
              }}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* Tracked Since */}
      <div className="mt-2 text-xs text-gray-400">
        Tracking since {new Date(competitor.trackedSince).toLocaleDateString()}
      </div>
    </div>
  );
}
