/**
 * AlertRuleForm Component (Sprint S57)
 *
 * Form for creating and editing alert rules.
 */

'use client';

import { useState, useEffect } from 'react';
import type {
  BrandReputationAlertRule,
  CreateReputationAlertRuleInput,
  ReputationAlertChannel,
  ReputationComponentKey,
} from '@pravado/types';
import {
  createAlertRule,
  updateAlertRule,
  getChannelLabel,
  getComponentKeyLabel,
} from '@/lib/brandReputationAlertsApi';

interface AlertRuleFormProps {
  rule?: BrandReputationAlertRule;
  onSave?: (rule: BrandReputationAlertRule) => void;
  onCancel?: () => void;
}

const CHANNELS: ReputationAlertChannel[] = ['in_app', 'email', 'slack', 'webhook'];
const COMPONENTS: ReputationComponentKey[] = ['sentiment', 'coverage', 'crisis_impact', 'competitive_position', 'engagement'];

export function AlertRuleForm({ rule, onSave, onCancel }: AlertRuleFormProps) {
  const [formData, setFormData] = useState<Partial<CreateReputationAlertRuleInput>>({
    name: '',
    description: '',
    isActive: true,
    channel: 'in_app',
    cooldownMinutes: 60,
    timeWindowMinutes: 60,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rule) {
      setFormData({
        name: rule.name,
        description: rule.description,
        isActive: rule.isActive,
        channel: rule.channel,
        minOverallScore: rule.minOverallScore,
        maxOverallScore: rule.maxOverallScore,
        minDeltaOverallScore: rule.minDeltaOverallScore,
        maxDeltaOverallScore: rule.maxDeltaOverallScore,
        componentKey: rule.componentKey,
        minComponentScore: rule.minComponentScore,
        competitorSlug: rule.competitorSlug,
        minCompetitorGap: rule.minCompetitorGap,
        maxCompetitorGap: rule.maxCompetitorGap,
        minIncidentSeverity: rule.minIncidentSeverity,
        linkCrisisIncidents: rule.linkCrisisIncidents,
        timeWindowMinutes: rule.timeWindowMinutes,
        cooldownMinutes: rule.cooldownMinutes,
      });
    }
  }, [rule]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      setError('Rule name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let savedRule: BrandReputationAlertRule;
      if (rule) {
        savedRule = await updateAlertRule(rule.id, formData);
      } else {
        savedRule = await createAlertRule(formData as CreateReputationAlertRuleInput);
      }

      onSave?.(savedRule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateReputationAlertRuleInput, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700">Rule Name *</label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Low Score Alert"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Describe when this alert should trigger..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Notification Channel</label>
            <select
              value={formData.channel || 'in_app'}
              onChange={(e) => updateField('channel', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {CHANNELS.map((channel) => (
                <option key={channel} value={channel}>
                  {getChannelLabel(channel)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center pt-6">
            <input
              type="checkbox"
              checked={formData.isActive ?? true}
              onChange={(e) => updateField('isActive', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Active</label>
          </div>
        </div>
      </div>

      {/* Overall Score Thresholds */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Overall Score Thresholds</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Overall Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.minOverallScore ?? ''}
              onChange={(e) => updateField('minOverallScore', e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Alert if score below..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Overall Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.maxOverallScore ?? ''}
              onChange={(e) => updateField('maxOverallScore', e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Alert if score above..."
            />
          </div>
        </div>
      </div>

      {/* Component Thresholds */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Component Thresholds</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Component</label>
            <select
              value={formData.componentKey || ''}
              onChange={(e) => updateField('componentKey', e.target.value || undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select component...</option>
              {COMPONENTS.map((comp) => (
                <option key={comp} value={comp}>
                  {getComponentKeyLabel(comp)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Component Score</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.minComponentScore ?? ''}
              onChange={(e) => updateField('minComponentScore', e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Alert if below..."
              disabled={!formData.componentKey}
            />
          </div>
        </div>
      </div>

      {/* Competitor Gap */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Competitor Gap</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Competitor Slug</label>
            <input
              type="text"
              value={formData.competitorSlug || ''}
              onChange={(e) => updateField('competitorSlug', e.target.value || undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g., competitor-name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Gap</label>
            <input
              type="number"
              min="-100"
              max="100"
              value={formData.minCompetitorGap ?? ''}
              onChange={(e) => updateField('minCompetitorGap', e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={!formData.competitorSlug}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Gap</label>
            <input
              type="number"
              min="-100"
              max="100"
              value={formData.maxCompetitorGap ?? ''}
              onChange={(e) => updateField('maxCompetitorGap', e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={!formData.competitorSlug}
            />
          </div>
        </div>
      </div>

      {/* Crisis Integration */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Crisis Integration</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.linkCrisisIncidents ?? false}
              onChange={(e) => updateField('linkCrisisIncidents', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-900">Link Crisis Incidents</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Incident Severity</label>
            <input
              type="number"
              min="1"
              max="5"
              value={formData.minIncidentSeverity ?? ''}
              onChange={(e) => updateField('minIncidentSeverity', e.target.value ? Number(e.target.value) : undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              disabled={!formData.linkCrisisIncidents}
            />
          </div>
        </div>
      </div>

      {/* Timing */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Timing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Window (minutes)</label>
            <input
              type="number"
              min="1"
              max="10080"
              value={formData.timeWindowMinutes ?? 60}
              onChange={(e) => updateField('timeWindowMinutes', Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Evaluation window for delta calculations</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cooldown (minutes)</label>
            <input
              type="number"
              min="0"
              max="10080"
              value={formData.cooldownMinutes ?? 60}
              onChange={(e) => updateField('cooldownMinutes', Number(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum time between alerts</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}
