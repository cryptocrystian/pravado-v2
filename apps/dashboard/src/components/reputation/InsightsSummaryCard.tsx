/**
 * InsightsSummaryCard Component (Sprint S57)
 *
 * Displays a summary card with key reputation insights for dashboards.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GetReputationReportInsightsResponse } from '@pravado/types';
import {
  getReputationInsights,
  getScoreColor,
  getScoreBgColor,
  getScoreLabel,
  formatDelta,
  getTrendIcon,
  getTrendColor,
  getComponentKeyLabel,
  getComponentKeyIcon,
} from '@/lib/brandReputationAlertsApi';

interface InsightsSummaryCardProps {
  periodStart?: string;
  periodEnd?: string;
  refreshTrigger?: number;
  compact?: boolean;
}

export function InsightsSummaryCard({
  periodStart,
  periodEnd,
  refreshTrigger = 0,
  compact = false,
}: InsightsSummaryCardProps) {
  const [insights, setInsights] = useState<GetReputationReportInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getReputationInsights({
        periodStart,
        periodEnd,
        includeCompetitors: true,
        includeCrisisData: true,
        maxDrivers: 3,
      });
      setInsights(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [periodStart, periodEnd]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, refreshTrigger]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchInsights}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!insights) {
    return null;
  }

  const { text: deltaText, colorClass: deltaColor } = formatDelta(insights.scoreDelta);
  const trendIcon = getTrendIcon(insights.trend);
  const trendColorClass = getTrendColor(insights.trend);

  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className={`text-3xl font-bold ${getScoreColor(insights.currentOverallScore)}`}>
              {insights.currentOverallScore.toFixed(0)}
            </div>
            <div>
              <p className="text-sm text-gray-500">Reputation Score</p>
              <div className="flex items-center space-x-1">
                <span className={`text-sm ${deltaColor}`}>{deltaText}</span>
                <span className={`${trendColorClass}`}>{trendIcon}</span>
              </div>
            </div>
          </div>
          {insights.alertSummary && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Unresolved Alerts</p>
              <p className="text-xl font-semibold text-gray-900">
                {insights.alertSummary.totalUnresolved}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Reputation Insights</h2>
      </div>

      <div className="p-6">
        {/* Main Score */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center ${getScoreBgColor(insights.currentOverallScore)}`}
            >
              <span className={`text-2xl font-bold ${getScoreColor(insights.currentOverallScore)}`}>
                {insights.currentOverallScore.toFixed(0)}
              </span>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">Overall Reputation</p>
              <p className={`text-sm ${getScoreColor(insights.currentOverallScore)}`}>
                {getScoreLabel(insights.currentOverallScore)}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-sm font-medium ${deltaColor}`}>{deltaText}</span>
                <span className={`text-lg ${trendColorClass}`}>{trendIcon}</span>
                <span className="text-xs text-gray-400">vs previous period</span>
              </div>
            </div>
          </div>

          {/* Alert Summary */}
          {insights.alertSummary && (
            <div className="text-right">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-semibold text-red-600">
                    {insights.alertSummary.newAlerts}
                  </p>
                  <p className="text-xs text-gray-500">New Alerts</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold text-yellow-600">
                    {insights.alertSummary.acknowledgedAlerts}
                  </p>
                  <p className="text-xs text-gray-500">Acknowledged</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Component Scores */}
        {insights.componentScores && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Component Breakdown</h3>
            <div className="grid grid-cols-5 gap-4">
              {(Object.entries(insights.componentScores) as [string, number | undefined][]).map(([key, value]) => {
                if (value === undefined) return null;
                return (
                  <div key={key} className="text-center">
                    <span className="text-xl mb-1 block">{getComponentKeyIcon(key as any)}</span>
                    <p className={`text-lg font-semibold ${getScoreColor(value)}`}>
                      {value.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {getComponentKeyLabel(key as any)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Drivers */}
        <div className="grid grid-cols-2 gap-6">
          {insights.topPositiveDrivers && insights.topPositiveDrivers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center">
                <span className="mr-1">+</span> Top Positive Drivers
              </h3>
              <ul className="space-y-2">
                {insights.topPositiveDrivers.slice(0, 3).map((driver, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">+{driver.impact.toFixed(1)}</span>
                    <span className="truncate">{driver.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {insights.topNegativeDrivers && insights.topNegativeDrivers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-red-700 mb-2 flex items-center">
                <span className="mr-1">-</span> Top Negative Drivers
              </h3>
              <ul className="space-y-2">
                {insights.topNegativeDrivers.slice(0, 3).map((driver, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-red-500 mr-2">{driver.impact.toFixed(1)}</span>
                    <span className="truncate">{driver.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Crisis Summary */}
        {insights.crisisSummary && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Crisis Status</h3>
            <div className="flex items-center space-x-6 text-sm">
              <div>
                <span className="text-gray-500">Active Incidents: </span>
                <span className={`font-medium ${insights.crisisSummary.activeIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {insights.crisisSummary.activeIncidents}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Resolved: </span>
                <span className="font-medium text-gray-900">
                  {insights.crisisSummary.resolvedThisPeriod}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Avg Severity: </span>
                <span className="font-medium text-gray-900">
                  {insights.crisisSummary.averageSeverity.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Calculated At */}
        <div className="mt-4 pt-2 text-xs text-gray-400 text-right">
          Updated: {new Date(insights.calculatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
