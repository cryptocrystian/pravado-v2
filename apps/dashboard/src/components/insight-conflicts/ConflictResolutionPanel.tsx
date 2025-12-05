'use client';

/**
 * ConflictResolutionPanel Component (Sprint S74)
 * Panel for resolving insight conflicts
 */

import { useState } from 'react';
import type {
  InsightConflict,
  InsightConflictResolution,
  ConflictResolutionType,
  ResolveConflictInput,
} from '@pravado/types';
import {
  getResolutionTypeLabel,
  getResolutionTypeDescription,
  getResolutionTypeColor,
  getResolutionTypeBgColor,
  formatConfidenceScore,
  getConfidenceScoreColor,
  getPriorityColor,
  getPriorityBgColor,
  formatDate,
} from '../../lib/insightConflictApi';

interface ConflictResolutionPanelProps {
  conflict: InsightConflict;
  resolutions?: InsightConflictResolution[];
  onResolve?: (input: ResolveConflictInput) => void;
  onReview?: (resolutionId: string, isAccepted: boolean, notes?: string) => void;
  resolving?: boolean;
}

const RESOLUTION_TYPES: ConflictResolutionType[] = [
  'ai_consensus',
  'weighted_truth',
  'source_priority',
  'hybrid',
];

export function ConflictResolutionPanel({
  conflict,
  resolutions = [],
  onResolve,
  onReview,
  resolving,
}: ConflictResolutionPanelProps) {
  const [selectedType, setSelectedType] = useState<ConflictResolutionType>('ai_consensus');
  const [customPrompt, setCustomPrompt] = useState('');
  const [autoAccept, setAutoAccept] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const canResolve = conflict.status === 'detected' || conflict.status === 'analyzing';
  const latestResolution = resolutions.length > 0 ? resolutions[0] : null;
  const needsReview = latestResolution && !latestResolution.humanReviewed;

  const handleSubmit = () => {
    if (!onResolve) return;
    onResolve({
      resolutionType: selectedType,
      customPrompt: customPrompt || null,
      autoAccept,
    });
  };

  const handleAccept = () => {
    if (!onReview || !latestResolution) return;
    onReview(latestResolution.id, true, reviewNotes || undefined);
  };

  const handleReject = () => {
    if (!onReview || !latestResolution) return;
    onReview(latestResolution.id, false, reviewNotes || undefined);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
      {/* Header */}
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900">Resolution</h3>
      </div>

      {/* Resolution Form */}
      {canResolve && (
        <div className="p-4">
          {/* Resolution Type Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Strategy
            </label>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTION_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    selectedType === type
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`text-sm font-medium ${
                    selectedType === type ? 'text-indigo-700' : 'text-gray-900'
                  }`}>
                    {getResolutionTypeLabel(type)}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {getResolutionTypeDescription(type)}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Instructions (Optional)
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Provide additional context or instructions for the AI..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
          </div>

          {/* Auto Accept */}
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoAccept}
                onChange={(e) => setAutoAccept(e.target.checked)}
                className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">
                Auto-accept resolution (skip review)
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={resolving}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {resolving ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating Resolution...
              </>
            ) : (
              'Generate Resolution'
            )}
          </button>
        </div>
      )}

      {/* Latest Resolution */}
      {latestResolution && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getResolutionTypeBgColor(latestResolution.resolutionType)} ${getResolutionTypeColor(latestResolution.resolutionType)}`}>
              {getResolutionTypeLabel(latestResolution.resolutionType)}
            </span>
            <span className="text-xs text-gray-500">{formatDate(latestResolution.createdAt)}</span>
          </div>

          {/* Resolved Summary */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-700 mb-1">Summary</div>
            <p className="text-sm text-gray-600">{latestResolution.resolvedSummary}</p>
          </div>

          {/* Consensus Narrative */}
          {latestResolution.consensusNarrative && (
            <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
              <div className="text-xs font-medium text-indigo-600 uppercase mb-1">Consensus Narrative</div>
              <p className="text-sm text-gray-700">{latestResolution.consensusNarrative}</p>
            </div>
          )}

          {/* Recommended Actions */}
          {latestResolution.recommendedActions && latestResolution.recommendedActions.length > 0 && (
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Recommended Actions</div>
              <div className="space-y-2">
                {latestResolution.recommendedActions.map((action, index) => (
                  <div key={index} className={`p-2 rounded-lg ${getPriorityBgColor(action.priority)}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{action.action}</span>
                      <span className={`text-xs font-medium ${getPriorityColor(action.priority)}`}>
                        {action.priority} priority
                      </span>
                    </div>
                    {action.description && (
                      <p className="text-xs text-gray-600">{action.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence & Rationale */}
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Confidence</div>
              <div className={`text-lg font-semibold ${getConfidenceScoreColor(latestResolution.resolutionConfidence)}`}>
                {formatConfidenceScore(latestResolution.resolutionConfidence)}
              </div>
            </div>
            {latestResolution.aiModelUsed && (
              <div>
                <div className="text-xs text-gray-500 mb-1">AI Model</div>
                <div className="text-sm text-gray-700">{latestResolution.aiModelUsed}</div>
              </div>
            )}
          </div>

          {latestResolution.resolutionRationale && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-1">Rationale</div>
              <p className="text-sm text-gray-600">{latestResolution.resolutionRationale}</p>
            </div>
          )}

          {/* Review Section */}
          {needsReview && (
            <div className="pt-4 border-t border-gray-100">
              <div className="text-sm font-medium text-gray-700 mb-3">Review Resolution</div>

              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes (optional)..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm mb-3"
              />

              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  Accept
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {/* Accepted status */}
          {latestResolution.isAccepted && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="text-sm font-medium text-green-800">Resolution Accepted</div>
                {latestResolution.reviewNotes && (
                  <p className="text-xs text-green-600 mt-0.5">{latestResolution.reviewNotes}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Previous Resolutions */}
      {resolutions.length > 1 && (
        <div className="p-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Previous Resolutions</div>
          <div className="space-y-2">
            {resolutions.slice(1).map((resolution) => (
              <div key={resolution.id} className="p-2 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium ${getResolutionTypeColor(resolution.resolutionType)}`}>
                    {getResolutionTypeLabel(resolution.resolutionType)}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(resolution.createdAt)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {resolution.resolvedSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
