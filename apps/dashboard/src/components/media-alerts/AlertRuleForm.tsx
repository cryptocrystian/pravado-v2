/**
 * Alert Rule Form Component (Sprint S43)
 * Create and edit alert rules with dynamic field visibility
 */

import type { MediaAlertRule, MediaAlertType, CreateMediaAlertRuleInput } from '@pravado/types';
import { useState } from 'react';

import { createAlertRule, updateAlertRule } from '@/lib/mediaAlertsApi';

interface AlertRuleFormProps {
  rule: MediaAlertRule | null;
  onClose: () => void;
  onSave: () => void;
}

export function AlertRuleForm({ rule, onClose, onSave }: AlertRuleFormProps) {
  const [name, setName] = useState(rule?.name || '');
  const [description, setDescription] = useState(rule?.description || '');
  const [alertType, setAlertType] = useState<MediaAlertType>(rule?.alertType || 'mention_match');
  const [isActive, setIsActive] = useState(rule?.isActive ?? true);
  const [brandTerms, setBrandTerms] = useState(rule?.brandTerms?.join(', ') || '');
  const [competitorTerms, setCompetitorTerms] = useState(rule?.competitorTerms?.join(', ') || '');
  const [minMentions, setMinMentions] = useState(rule?.minMentions?.toString() || '');
  const [timeWindowMinutes, setTimeWindowMinutes] = useState(rule?.timeWindowMinutes?.toString() || '');
  const [minSentiment, setMinSentiment] = useState(rule?.minSentiment?.toString() || '');
  const [maxSentiment, setMaxSentiment] = useState(rule?.maxSentiment?.toString() || '');

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const input: CreateMediaAlertRuleInput = {
        name,
        description: description || undefined,
        alertType,
        isActive,
        brandTerms: brandTerms ? brandTerms.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        competitorTerms: competitorTerms ? competitorTerms.split(',').map((t) => t.trim()).filter(Boolean) : undefined,
        minMentions: minMentions ? parseInt(minMentions, 10) : undefined,
        timeWindowMinutes: timeWindowMinutes ? parseInt(timeWindowMinutes, 10) : undefined,
        minSentiment: minSentiment ? parseFloat(minSentiment) : undefined,
        maxSentiment: maxSentiment ? parseFloat(maxSentiment) : undefined,
      };

      if (rule) {
        await updateAlertRule(rule.id, input);
      } else {
        await createAlertRule(input);
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rule');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {rule ? 'Edit Alert Rule' : 'New Alert Rule'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Brand Negative Mentions"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Describe what this rule monitors..."
            />
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alert Type *
            </label>
            <select
              value={alertType}
              onChange={(e) => setAlertType(e.target.value as MediaAlertType)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="mention_match">Mention Match</option>
              <option value="volume_spike">Volume Spike</option>
              <option value="sentiment_shift">Sentiment Shift</option>
              <option value="tier_coverage">Tier Coverage</option>
            </select>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Active (rule will trigger alerts)
            </label>
          </div>

          {/* Dynamic Fields Based on Alert Type */}
          {(alertType === 'mention_match' || alertType === 'volume_spike') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Terms (comma-separated)
              </label>
              <input
                type="text"
                value={brandTerms}
                onChange={(e) => setBrandTerms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="pravado, saipien labs"
              />
            </div>
          )}

          {alertType === 'mention_match' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Competitor Terms (comma-separated)
              </label>
              <input
                type="text"
                value={competitorTerms}
                onChange={(e) => setCompetitorTerms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="competitor1, competitor2"
              />
            </div>
          )}

          {(alertType === 'mention_match' || alertType === 'sentiment_shift') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Sentiment (-1 to 1)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="-1"
                  max="1"
                  value={minSentiment}
                  onChange={(e) => setMinSentiment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Sentiment (-1 to 1)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="-1"
                  max="1"
                  value={maxSentiment}
                  onChange={(e) => setMaxSentiment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {alertType === 'volume_spike' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Mentions (threshold)
                </label>
                <input
                  type="number"
                  min="1"
                  value={minMentions}
                  onChange={(e) => setMinMentions(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Time Window (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={timeWindowMinutes}
                  onChange={(e) => setTimeWindowMinutes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 60"
                />
              </div>
            </>
          )}

          {alertType === 'sentiment_shift' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time Window (minutes)
              </label>
              <input
                type="number"
                min="1"
                value={timeWindowMinutes}
                onChange={(e) => setTimeWindowMinutes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 120"
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : rule ? 'Update Rule' : 'Create Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
