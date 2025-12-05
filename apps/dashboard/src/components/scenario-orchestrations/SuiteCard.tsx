'use client';

/**
 * SuiteCard Component (Sprint S72)
 * Card component for displaying a scenario suite
 */

import type { ScenarioSuite } from '@pravado/types';
import {
  SUITE_STATUS_LABELS,
  getStatusBadgeClass,
} from '../../lib/scenarioOrchestrationApi';

interface SuiteCardProps {
  suite: ScenarioSuite;
  itemCount?: number;
  runCount?: number;
  onView?: (suite: ScenarioSuite) => void;
  onEdit?: (suite: ScenarioSuite) => void;
  onRun?: (suite: ScenarioSuite) => void;
  onArchive?: (suite: ScenarioSuite) => void;
}

export function SuiteCard({
  suite,
  itemCount = 0,
  runCount = 0,
  onView,
  onEdit,
  onRun,
  onArchive,
}: SuiteCardProps) {
  const statusClass = getStatusBadgeClass(suite.status);
  const canRun = suite.status === 'configured' || suite.status === 'completed';
  const isArchived = suite.status === 'archived';

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${isArchived ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {suite.name}
          </h3>
          {suite.description && (
            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
              {suite.description}
            </p>
          )}
        </div>
        <span className={`ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
          {SUITE_STATUS_LABELS[suite.status]}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span>{itemCount} simulations</span>
        </div>
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{runCount} runs</span>
        </div>
      </div>

      {/* Config indicators */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suite.config.narrativeEnabled && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
            Narrative
          </span>
        )}
        {suite.config.riskMapEnabled && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
            Risk Map
          </span>
        )}
        {suite.config.stopOnFailure && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
            Stop on Fail
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onView?.(suite)}
          className="flex-1 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        >
          View
        </button>
        {!isArchived && (
          <>
            <button
              onClick={() => onEdit?.(suite)}
              className="flex-1 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              Edit
            </button>
            {canRun && (
              <button
                onClick={() => onRun?.(suite)}
                className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Run
              </button>
            )}
            <button
              onClick={() => onArchive?.(suite)}
              className="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
            >
              Archive
            </button>
          </>
        )}
      </div>
    </div>
  );
}
