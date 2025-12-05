'use client';

/**
 * ScenarioPlaybookStats Component (Sprint S67)
 * Displays summary statistics for scenario playbooks
 */

import { useState, useEffect } from 'react';
import type { ScenarioPlaybookStatsResponse, ScenarioStatsActivityItem } from '@pravado/types';
import { getScenarioPlaybookStats } from '../../lib/scenarioPlaybookApi';

interface ScenarioPlaybookStatsProps {
  className?: string;
  refreshTrigger?: number;
}

export function ScenarioPlaybookStats({ className = '', refreshTrigger }: ScenarioPlaybookStatsProps) {
  const [stats, setStats] = useState<ScenarioPlaybookStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getScenarioPlaybookStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
            <div className="h-8 bg-gray-100 rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg ${className}`}>
        {error}
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      label: 'Total Playbooks',
      value: stats.totalPlaybooks,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: 'blue',
      subtext: `${stats.activePlaybooks} active`,
    },
    {
      label: 'Total Scenarios',
      value: stats.totalScenarios,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      color: 'purple',
      subtext: `${stats.draftScenarios} drafts`,
    },
    {
      label: 'Total Runs',
      value: stats.totalRuns,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'green',
      subtext: `${stats.runningRuns} running`,
    },
    {
      label: 'Success Rate',
      value: `${stats.completedRuns > 0 ? ((stats.completedRuns / (stats.completedRuns + stats.failedRuns)) * 100).toFixed(0) : 0}%`,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'emerald',
      subtext: `${stats.completedRuns} completed`,
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      value: 'text-blue-700',
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'text-purple-600',
      value: 'text-purple-700',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      value: 'text-green-700',
    },
    emerald: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      value: 'text-emerald-700',
    },
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const colors = colorClasses[stat.color as keyof typeof colorClasses];
          return (
            <div
              key={stat.label}
              className={`${colors.bg} rounded-lg p-4 border border-transparent hover:border-gray-200 transition-colors`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={colors.icon}>{stat.icon}</span>
                <span className="text-sm font-medium text-gray-600">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold ${colors.value}`}>{stat.value}</p>
              {stat.subtext && (
                <p className="text-xs text-gray-500 mt-1">{stat.subtext}</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Awaiting Approval</p>
          <p className="text-lg font-semibold text-yellow-600">{stats.awaitingApprovalRuns}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Paused</p>
          <p className="text-lg font-semibold text-gray-600">{stats.pausedRuns}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Failed</p>
          <p className="text-lg font-semibold text-red-600">{stats.failedRuns}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Cancelled</p>
          <p className="text-lg font-semibold text-gray-400">{stats.cancelledRuns}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">Ready Scenarios</p>
          <p className="text-lg font-semibold text-blue-600">{stats.readyScenarios}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-3 text-center">
          <p className="text-xs text-gray-500">In Progress</p>
          <p className="text-lg font-semibold text-indigo-600">{stats.inProgressScenarios}</p>
        </div>
      </div>

      {/* Scenario Type Breakdown */}
      {stats.scenariosByType && Object.keys(stats.scenariosByType).length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Scenarios by Type</h4>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.scenariosByType).map(([type, count]: [string, number]) => (
              <div key={type} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                <span className="text-sm text-gray-600 capitalize">{type.replace(/_/g, ' ')}</span>
                <span className="text-sm font-medium text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="mt-4 bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-2">
            {stats.recentActivity.slice(0, 5).map((activity: ScenarioStatsActivityItem, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className={`w-2 h-2 rounded-full ${
                  activity.type === 'run_completed' ? 'bg-green-500' :
                  activity.type === 'run_started' ? 'bg-blue-500' :
                  activity.type === 'run_failed' ? 'bg-red-500' :
                  activity.type === 'scenario_created' ? 'bg-purple-500' :
                  'bg-gray-400'
                }`} />
                <span className="text-gray-600 flex-1">{activity.description}</span>
                <span className="text-gray-400 text-xs">
                  {new Date(activity.timestamp).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
