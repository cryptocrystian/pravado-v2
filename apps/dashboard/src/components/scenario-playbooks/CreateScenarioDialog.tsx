'use client';

/**
 * CreateScenarioDialog Component (Sprint S67)
 * Modal dialog for creating new scenarios
 */

import { useState, useEffect } from 'react';
import type { Scenario, ScenarioPlaybook } from '@pravado/types';
import { ScenarioType, ScenarioRiskLevel, SCENARIO_TYPE_LABELS, SCENARIO_RISK_LEVEL_LABELS } from '@pravado/types';
import { createScenario, listPlaybooks } from '../../lib/scenarioPlaybookApi';

interface CreateScenarioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (scenario: Scenario) => void;
  preselectedPlaybookId?: string;
}

interface FormData {
  name: string;
  description: string;
  scenarioType: ScenarioType;
  playbookId: string;
  baselineRiskLevel: ScenarioRiskLevel;
  contextParameters: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

const SCENARIO_TYPES: ScenarioType[] = [
  ScenarioType.CRISIS_SIM,
  ScenarioType.CAMPAIGN_SIM,
  ScenarioType.REPUTATION_SIM,
  ScenarioType.STRATEGIC_SIM,
  ScenarioType.OUTREACH_SIM,
  ScenarioType.COMPETITIVE_SIM,
  ScenarioType.CUSTOM,
];

const RISK_LEVELS: ScenarioRiskLevel[] = [
  ScenarioRiskLevel.LOW,
  ScenarioRiskLevel.MEDIUM,
  ScenarioRiskLevel.HIGH,
  ScenarioRiskLevel.CRITICAL,
];

const DEFAULT_FORM_DATA: FormData = {
  name: '',
  description: '',
  scenarioType: ScenarioType.CUSTOM,
  playbookId: '',
  baselineRiskLevel: ScenarioRiskLevel.LOW,
  contextParameters: {},
  metadata: {},
};

export function CreateScenarioDialog({
  isOpen,
  onClose,
  onCreated,
  preselectedPlaybookId,
}: CreateScenarioDialogProps) {
  const [formData, setFormData] = useState<FormData>({
    ...DEFAULT_FORM_DATA,
    playbookId: preselectedPlaybookId || '',
  });
  const [playbooks, setPlaybooks] = useState<ScenarioPlaybook[]>([]);
  const [loadingPlaybooks, setLoadingPlaybooks] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchPlaybooks();
    }
  }, [isOpen]);

  useEffect(() => {
    if (preselectedPlaybookId) {
      setFormData((prev) => ({ ...prev, playbookId: preselectedPlaybookId }));
    }
  }, [preselectedPlaybookId]);

  const fetchPlaybooks = async () => {
    setLoadingPlaybooks(true);
    try {
      const response = await listPlaybooks({ limit: 100 });
      setPlaybooks(response.playbooks);
    } catch (err) {
      console.error('Failed to load playbooks:', err);
    } finally {
      setLoadingPlaybooks(false);
    }
  };

  const handleClose = () => {
    setFormData({
      ...DEFAULT_FORM_DATA,
      playbookId: preselectedPlaybookId || '',
    });
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Scenario name is required');
      return;
    }

    if (!formData.playbookId) {
      setError('Please select a playbook');
      return;
    }

    setLoading(true);

    try {
      const scenario = await createScenario({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        scenarioType: formData.scenarioType,
        defaultPlaybookId: formData.playbookId,
        metadata: {
          ...formData.metadata,
          baselineRiskLevel: formData.baselineRiskLevel,
          contextParameters: formData.contextParameters,
        },
      });

      onCreated?.(scenario);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scenario');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlaybook = playbooks.find((p) => p.id === formData.playbookId);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Create New Scenario</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Scenario Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scenario Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Q4 Product Launch Response"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the scenario context and goals..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Playbook Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Playbook *
                </label>
                {loadingPlaybooks ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Loading playbooks...
                  </div>
                ) : playbooks.length === 0 ? (
                  <div className="px-3 py-2 border border-yellow-300 rounded-lg bg-yellow-50 text-yellow-700">
                    No active playbooks available. Create a playbook first.
                  </div>
                ) : (
                  <select
                    value={formData.playbookId}
                    onChange={(e) => setFormData({ ...formData, playbookId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select a playbook</option>
                    {playbooks.map((playbook) => (
                      <option key={playbook.id} value={playbook.id}>
                        {playbook.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Selected Playbook Preview */}
              {selectedPlaybook && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-purple-900 mb-1">
                    {selectedPlaybook.name}
                  </h4>
                  {selectedPlaybook.description && (
                    <p className="text-sm text-purple-700 mb-2">{selectedPlaybook.description}</p>
                  )}
                  {selectedPlaybook.category && (
                    <div className="text-xs text-purple-600">
                      <span className="capitalize">{selectedPlaybook.category.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Type and Risk Level Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scenario Type *
                  </label>
                  <select
                    value={formData.scenarioType}
                    onChange={(e) => setFormData({ ...formData, scenarioType: e.target.value as ScenarioType })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {SCENARIO_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {SCENARIO_TYPE_LABELS[type] || type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Baseline Risk Level
                  </label>
                  <select
                    value={formData.baselineRiskLevel}
                    onChange={(e) => setFormData({ ...formData, baselineRiskLevel: e.target.value as ScenarioRiskLevel })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    {RISK_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {SCENARIO_RISK_LEVEL_LABELS[level] || level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Context Parameters */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Context Parameters (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.contextParameters, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, contextParameters: parsed });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder={`{
  "target_audience": "enterprise",
  "region": "north_america",
  "product_line": "saas_platform"
}`}
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  These parameters will be available during playbook execution and simulation.
                </p>
              </div>

              {/* Metadata */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Metadata (JSON)
                </label>
                <textarea
                  value={JSON.stringify(formData.metadata, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setFormData({ ...formData, metadata: parsed });
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder="{}"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.name.trim() || !formData.playbookId}
                className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Scenario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
