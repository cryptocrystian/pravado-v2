'use client';

/**
 * SuiteRunTimeline Component (Sprint S72)
 * Timeline visualization of suite run items
 */

import type { ScenarioSuiteRunItem, ScenarioSuiteItem } from '@pravado/types';
import {
  SUITE_ITEM_STATUS_LABELS,
  SUITE_ITEM_STATUS_COLORS,
  getRiskBadgeClass,
  formatDuration,
} from '../../lib/scenarioOrchestrationApi';

interface SuiteRunTimelineProps {
  items: ScenarioSuiteRunItem[];
  suiteItems?: Map<string, ScenarioSuiteItem>;
  currentItemIndex?: number;
  onItemClick?: (item: ScenarioSuiteRunItem) => void;
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  running: (
    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  completed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  failed: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  skipped: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  ),
  condition_met: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  condition_unmet: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function SuiteRunTimeline({
  items,
  suiteItems,
  currentItemIndex,
  onItemClick,
}: SuiteRunTimelineProps) {
  const sortedItems = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  if (sortedItems.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No items in this run yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200" />

      <div className="space-y-4">
        {sortedItems.map((item, index) => {
          const suiteItem = suiteItems?.get(item.suiteItemId);
          const statusColor = SUITE_ITEM_STATUS_COLORS[item.status] || 'gray';
          const isCurrent = index === currentItemIndex;

          const colorClasses: Record<string, string> = {
            gray: 'bg-gray-100 text-gray-600 border-gray-300',
            blue: 'bg-blue-100 text-blue-600 border-blue-300',
            yellow: 'bg-yellow-100 text-yellow-600 border-yellow-300',
            green: 'bg-green-100 text-green-600 border-green-300',
            red: 'bg-red-100 text-red-600 border-red-300',
            indigo: 'bg-indigo-100 text-indigo-600 border-indigo-300',
          };

          const iconClass = colorClasses[statusColor] || colorClasses.gray;

          return (
            <div
              key={item.id}
              className={`relative flex items-start gap-4 cursor-pointer ${isCurrent ? 'bg-indigo-50 -mx-2 px-2 py-1 rounded' : ''}`}
              onClick={() => onItemClick?.(item)}
            >
              {/* Status icon */}
              <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${iconClass}`}>
                {STATUS_ICONS[item.status] || STATUS_ICONS.pending}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    {suiteItem?.label || `Item ${index + 1}`}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-xs ${iconClass}`}>
                    {SUITE_ITEM_STATUS_LABELS[item.status]}
                  </span>
                  {item.riskLevel && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${getRiskBadgeClass(item.riskLevel)}`}>
                      {item.riskLevel}
                    </span>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                  {item.stepsExecuted !== null && (
                    <span>{item.stepsExecuted} steps</span>
                  )}
                  {item.tokensUsed != null && (
                    <span>{item.tokensUsed.toLocaleString()} tokens</span>
                  )}
                  {item.durationMs != null && (
                    <span>{formatDuration(item.durationMs)}</span>
                  )}
                </div>

                {/* Condition info */}
                {item.conditionEvaluated && (
                  <div className="mt-1 text-xs">
                    <span className={item.conditionResult ? 'text-green-600' : 'text-yellow-600'}>
                      Condition {item.conditionResult ? 'met' : 'not met'}
                    </span>
                  </div>
                )}

                {/* Error message */}
                {item.errorMessage && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {item.errorMessage}
                  </div>
                )}

                {/* Key findings */}
                {item.keyFindings && (item.keyFindings as unknown[]).length > 0 && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <span className="font-medium">Key findings:</span>
                    <ul className="list-disc list-inside mt-1">
                      {(item.keyFindings as string[]).slice(0, 3).map((finding, i) => (
                        <li key={i}>{finding}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
