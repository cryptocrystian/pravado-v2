/**
 * Enrichment Suggestions Panel Component (Sprint S50)
 * Panel showing merge suggestions for deduplication
 */

import React, { useState } from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';
import {
  LightBulbIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface MergeSuggestion {
  targetId: string;
  targetName?: string;
  targetEmail?: string;
  targetOutlet?: string;
  confidence: number; // 0-1
  reason: string;
  fieldsToMerge: string[];
  matchScore: number; // 0-1
  matchFields: string[];
  potentialConflicts?: {
    field: string;
    currentValue: any;
    newValue: any;
  }[];
}

interface EnrichmentSuggestionsPanelProps {
  suggestions: MergeSuggestion[];
  onAccept?: (suggestion: MergeSuggestion) => void;
  onReject?: (suggestion: MergeSuggestion) => void;
  loading?: boolean;
}

export function EnrichmentSuggestionsPanel({
  suggestions,
  onAccept,
  onReject,
  loading = false,
}: EnrichmentSuggestionsPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="text-sm text-gray-600">Analyzing suggestions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <LightBulbIcon className="h-6 w-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            Merge Suggestions
          </h3>
        </div>
        <div className="text-center py-12">
          <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="text-gray-600">No duplicate suggestions found</p>
          <p className="text-sm text-gray-500 mt-1">
            This enrichment record appears to be unique
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <LightBulbIcon className="h-6 w-6 text-yellow-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Merge Suggestions
        </h3>
        <span className="ml-auto text-sm text-gray-600">
          {suggestions.length} potential {suggestions.length === 1 ? 'match' : 'matches'}
        </span>
      </div>

      {/* Suggestions List */}
      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.targetId}
            suggestion={suggestion}
            expanded={expandedId === suggestion.targetId}
            onToggle={() =>
              setExpandedId(
                expandedId === suggestion.targetId ? null : suggestion.targetId
              )
            }
            onAccept={onAccept}
            onReject={onReject}
          />
        ))}
      </div>
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: MergeSuggestion;
  expanded: boolean;
  onToggle: () => void;
  onAccept?: (suggestion: MergeSuggestion) => void;
  onReject?: (suggestion: MergeSuggestion) => void;
}

function SuggestionCard({
  suggestion,
  expanded,
  onToggle,
  onAccept,
  onReject,
}: SuggestionCardProps) {
  const hasConflicts =
    suggestion.potentialConflicts && suggestion.potentialConflicts.length > 0;

  return (
    <div
      className={`border-2 rounded-lg transition-all ${
        hasConflicts ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Card Header */}
      <div
        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {suggestion.targetName && (
                <h4 className="font-medium text-gray-900">
                  {suggestion.targetName}
                </h4>
              )}
              {suggestion.targetEmail && (
                <span className="text-sm text-gray-600">
                  {suggestion.targetEmail}
                </span>
              )}
            </div>
            {suggestion.targetOutlet && (
              <p className="text-sm text-gray-600">{suggestion.targetOutlet}</p>
            )}
          </div>
          <ConfidenceBadge
            score={suggestion.confidence * 100}
            label=""
            size="sm"
            showPercentage={false}
          />
        </div>

        <p className="text-sm text-gray-700 mb-3">{suggestion.reason}</p>

        {/* Match Fields */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <span className="text-xs text-gray-600">Matching fields:</span>
          {suggestion.matchFields.map((field) => (
            <span
              key={field}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
            >
              {field}
            </span>
          ))}
        </div>

        {hasConflicts && (
          <div className="flex items-center gap-1 text-sm text-yellow-700">
            <ExclamationTriangleIcon className="h-4 w-4" />
            {suggestion.potentialConflicts!.length} potential conflict
            {suggestion.potentialConflicts!.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* Fields to Merge */}
          <div className="mb-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">
              Fields to Merge ({suggestion.fieldsToMerge.length})
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {suggestion.fieldsToMerge.map((field) => (
                <span
                  key={field}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>

          {/* Conflicts */}
          {hasConflicts && (
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">
                Conflicts to Review
              </h5>
              <div className="space-y-2">
                {suggestion.potentialConflicts!.map((conflict, index) => (
                  <div
                    key={index}
                    className="bg-white border border-yellow-200 rounded p-3"
                  >
                    <p className="text-xs font-medium text-gray-700 mb-2">
                      {conflict.field}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">Current:</span>
                        <p className="text-gray-900 font-medium mt-1">
                          {String(conflict.currentValue)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">New:</span>
                        <p className="text-gray-900 font-medium mt-1">
                          {String(conflict.newValue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {onAccept && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAccept(suggestion);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Accept Merge
              </button>
            )}
            {onReject && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReject(suggestion);
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
                Reject
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
