'use client';

/**
 * SuiteMetricsPanel Component (Sprint S72)
 * Display aggregated metrics for a suite run
 */

import type { ScenarioSuiteRun, ScenarioSuiteRunItem } from '@pravado/types';
import { formatDuration, getRiskBadgeClass } from '../../lib/scenarioOrchestrationApi';

interface SuiteMetricsPanelProps {
  run: ScenarioSuiteRun;
  items?: ScenarioSuiteRunItem[];
}

export function SuiteMetricsPanel({ run, items = [] }: SuiteMetricsPanelProps) {
  // Calculate aggregated metrics
  const totalSteps = items.reduce((sum, item) => sum + (item.stepsExecuted || 0), 0);
  const totalTokens = items.reduce((sum, item) => sum + (item.tokensUsed || 0), 0);
  const totalDuration = items.reduce((sum, item) => sum + (item.durationMs || 0), 0);

  const completedItems = items.filter(i => i.status === 'completed').length;
  const failedItems = items.filter(i => i.status === 'failed').length;
  const skippedItems = items.filter(i => i.status === 'skipped').length;

  // Risk distribution
  const riskCounts = items.reduce((acc, item) => {
    if (item.riskLevel) {
      acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Condition evaluation stats
  const conditionsEvaluated = items.filter(i => i.conditionEvaluated).length;
  const conditionsMet = items.filter(i => i.conditionEvaluated && i.conditionResult).length;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Run Metrics</h3>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Steps"
          value={totalSteps.toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <MetricCard
          label="Total Tokens"
          value={totalTokens.toLocaleString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          }
        />
        <MetricCard
          label="Duration"
          value={formatDuration(run.totalDurationMs || totalDuration)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <MetricCard
          label="Items Run"
          value={`${completedItems + failedItems}/${items.length}`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
        />
      </div>

      {/* Item Status Breakdown */}
      <div className="mb-6">
        <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
          Item Status
        </h4>
        <div className="flex gap-3">
          <StatusBadge label="Completed" count={completedItems} color="green" />
          <StatusBadge label="Failed" count={failedItems} color="red" />
          <StatusBadge label="Skipped" count={skippedItems} color="gray" />
          <StatusBadge
            label="Pending"
            count={items.length - completedItems - failedItems - skippedItems}
            color="blue"
          />
        </div>
      </div>

      {/* Risk Distribution */}
      {Object.keys(riskCounts).length > 0 && (
        <div className="mb-6">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Risk Distribution
          </h4>
          <div className="flex gap-2">
            {['low', 'medium', 'high', 'critical'].map(level => {
              const count = riskCounts[level] || 0;
              if (count === 0) return null;
              return (
                <span
                  key={level}
                  className={`px-2 py-1 rounded text-xs font-medium ${getRiskBadgeClass(level)}`}
                >
                  {level}: {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Condition Evaluation */}
      {conditionsEvaluated > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Conditions
          </h4>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {conditionsEvaluated} evaluated
            </span>
            <span className="text-green-600">
              {conditionsMet} met
            </span>
            <span className="text-yellow-600">
              {conditionsEvaluated - conditionsMet} not met
            </span>
          </div>
        </div>
      )}

      {/* Run Timestamps */}
      <div className="pt-4 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Started</span>
          <span>{run.startedAt ? new Date(run.startedAt).toLocaleString() : '-'}</span>
        </div>
        {run.completedAt && (
          <div className="flex justify-between mt-1">
            <span>Completed</span>
            <span>{new Date(run.completedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function StatusBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: 'green' | 'red' | 'gray' | 'blue' | 'yellow';
}) {
  const colorClasses = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    gray: 'bg-gray-100 text-gray-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
  };

  return (
    <div className={`px-2 py-1 rounded text-xs font-medium ${colorClasses[color]}`}>
      {label}: {count}
    </div>
  );
}
