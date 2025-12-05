/**
 * AlertRulesList Component (Sprint S57)
 *
 * Displays a list of alert rules with actions to toggle, edit, and delete.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BrandReputationAlertRule } from '@pravado/types';
import {
  listAlertRules,
  deleteAlertRule,
  toggleAlertRule,
  getChannelLabel,
  getChannelIcon,
  getComponentKeyLabel,
  formatRelativeTime,
} from '@/lib/brandReputationAlertsApi';

interface AlertRulesListProps {
  onEditRule?: (rule: BrandReputationAlertRule) => void;
  onCreateRule?: () => void;
  refreshTrigger?: number;
}

export function AlertRulesList({
  onEditRule,
  onCreateRule,
  refreshTrigger = 0,
}: AlertRulesListProps) {
  const [rules, setRules] = useState<BrandReputationAlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listAlertRules({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' });
      setRules(response.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules, refreshTrigger]);

  const handleToggle = async (rule: BrandReputationAlertRule) => {
    try {
      const updated = await toggleAlertRule(rule.id, !rule.isActive);
      setRules((prev) => prev.map((r) => (r.id === rule.id ? updated : r)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle rule');
    }
  };

  const handleDelete = async (rule: BrandReputationAlertRule) => {
    if (!confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      return;
    }
    try {
      await deleteAlertRule(rule.id);
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete rule');
    }
  };

  const getRuleDescription = (rule: BrandReputationAlertRule): string => {
    const conditions: string[] = [];
    if (rule.minOverallScore !== undefined) {
      conditions.push(`Score < ${rule.minOverallScore}`);
    }
    if (rule.maxOverallScore !== undefined) {
      conditions.push(`Score > ${rule.maxOverallScore}`);
    }
    if (rule.componentKey && rule.minComponentScore !== undefined) {
      conditions.push(`${getComponentKeyLabel(rule.componentKey)} < ${rule.minComponentScore}`);
    }
    if (rule.competitorSlug) {
      if (rule.minCompetitorGap !== undefined) {
        conditions.push(`Gap with ${rule.competitorSlug} < ${rule.minCompetitorGap}`);
      }
      if (rule.maxCompetitorGap !== undefined) {
        conditions.push(`Gap with ${rule.competitorSlug} > ${rule.maxCompetitorGap}`);
      }
    }
    if (rule.linkCrisisIncidents) {
      conditions.push(`Crisis severity >= ${rule.minIncidentSeverity || 1}`);
    }
    return conditions.length > 0 ? conditions.join(', ') : 'No conditions set';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Alert Rules</h2>
        {onCreateRule && (
          <button
            onClick={onCreateRule}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            + New Rule
          </button>
        )}
      </div>

      {error && (
        <div className="px-6 py-3 bg-red-50 border-b border-red-200">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {rules.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <p className="text-gray-500">No alert rules configured yet.</p>
          {onCreateRule && (
            <button
              onClick={onCreateRule}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Create Your First Alert Rule
            </button>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {rules.map((rule) => (
            <li key={rule.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleToggle(rule)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      rule.isActive ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                    title={rule.isActive ? 'Disable rule' : 'Enable rule'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        rule.isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{rule.name}</h3>
                    <p className="text-sm text-gray-500">{getRuleDescription(rule)}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500 flex items-center">
                    <span className="mr-1">{getChannelIcon(rule.channel)}</span>
                    {getChannelLabel(rule.channel)}
                  </div>

                  {rule.lastTriggeredAt && (
                    <div className="text-xs text-gray-400">
                      Last triggered: {formatRelativeTime(rule.lastTriggeredAt)}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    {onEditRule && (
                      <button
                        onClick={() => onEditRule(rule)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="Edit rule"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(rule)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Delete rule"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
