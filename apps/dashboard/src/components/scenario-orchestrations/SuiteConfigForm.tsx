'use client';

/**
 * SuiteConfigForm Component (Sprint S72)
 * Form for creating/editing a scenario suite
 */

import { useState, useEffect } from 'react';
import type {
  CreateScenarioSuiteInput,
  UpdateScenarioSuiteInput,
  ScenarioSuite,
  CreateSuiteItemInput,
  AIScenarioSimulation,
} from '@pravado/types';
import {
  CONDITION_TYPE_LABELS,
  CONDITION_TYPE_DESCRIPTIONS,
} from '../../lib/scenarioOrchestrationApi';
import { listSimulations } from '../../lib/aiScenarioSimulationApi';

interface SuiteConfigFormProps {
  suite?: ScenarioSuite;
  onSubmit: (input: CreateScenarioSuiteInput | UpdateScenarioSuiteInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const CONDITION_TYPES = [
  'always',
  'risk_threshold',
  'sentiment_shift',
  'keyword_match',
  'agent_response',
  'outcome_match',
] as const;

export function SuiteConfigForm({
  suite,
  onSubmit,
  onCancel,
  loading = false,
}: SuiteConfigFormProps) {
  const [name, setName] = useState(suite?.name || '');
  const [description, setDescription] = useState(suite?.description || '');
  const [narrativeEnabled, setNarrativeEnabled] = useState(suite?.config.narrativeEnabled ?? true);
  const [riskMapEnabled, setRiskMapEnabled] = useState(suite?.config.riskMapEnabled ?? true);
  const [stopOnFailure, setStopOnFailure] = useState(suite?.config.stopOnFailure ?? true);
  const [maxConcurrent, setMaxConcurrent] = useState(suite?.config.maxConcurrentSimulations ?? 1);
  const [timeoutSeconds, setTimeoutSeconds] = useState(suite?.config.timeoutSeconds ?? 3600);
  const [items, setItems] = useState<CreateSuiteItemInput[]>([]);
  const [simulations, setSimulations] = useState<AIScenarioSimulation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSimulations();
  }, []);

  const loadSimulations = async () => {
    try {
      const result = await listSimulations({ limit: 100, status: 'configured' });
      setSimulations(result.simulations);
    } catch (err) {
      console.error('Failed to load simulations', err);
    }
  };

  const handleAddItem = () => {
    if (simulations.length === 0) return;
    setItems([
      ...items,
      {
        simulationId: simulations[0].id,
        orderIndex: items.length,
        triggerConditionType: 'always',
        triggerCondition: { type: 'always' },
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, updates: Partial<CreateSuiteItemInput>) => {
    setItems(items.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const input: CreateScenarioSuiteInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        config: {
          narrativeEnabled,
          riskMapEnabled,
          stopOnFailure,
          maxConcurrentSimulations: maxConcurrent,
          timeoutSeconds,
        },
        items: suite ? undefined : items,
      };
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save suite');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Suite Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., Crisis Response Chain"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Describe the purpose of this suite..."
        />
      </div>

      {/* Configuration */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration</h4>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={narrativeEnabled}
              onChange={(e) => setNarrativeEnabled(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span className="text-sm text-gray-700">Generate Narrative</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={riskMapEnabled}
              onChange={(e) => setRiskMapEnabled(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span className="text-sm text-gray-700">Generate Risk Map</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={stopOnFailure}
              onChange={(e) => setStopOnFailure(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span className="text-sm text-gray-700">Stop on Failure</span>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Max Concurrent</label>
            <input
              type="number"
              value={maxConcurrent}
              onChange={(e) => setMaxConcurrent(Number(e.target.value))}
              min={1}
              max={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Timeout (sec)</label>
            <input
              type="number"
              value={timeoutSeconds}
              onChange={(e) => setTimeoutSeconds(Number(e.target.value))}
              min={60}
              max={7200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Items (only for new suites) */}
      {!suite && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">Simulations</h4>
            <button
              type="button"
              onClick={handleAddItem}
              disabled={simulations.length === 0}
              className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
            >
              + Add Simulation
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No simulations added. Click &quot;Add Simulation&quot; to add items.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      #{index + 1}
                    </span>
                    <select
                      value={item.simulationId}
                      onChange={(e) => handleItemChange(index, { simulationId: e.target.value })}
                      className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      {simulations.map((sim) => (
                        <option key={sim.id} value={sim.id}>
                          {sim.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center gap-2 ml-9">
                    <label className="text-xs text-gray-500">Trigger:</label>
                    <select
                      value={item.triggerConditionType}
                      onChange={(e) => handleItemChange(index, {
                        triggerConditionType: e.target.value as CreateSuiteItemInput['triggerConditionType'],
                        triggerCondition: { type: e.target.value },
                      })}
                      className="px-2 py-1 border border-gray-300 rounded text-xs"
                    >
                      {CONDITION_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {CONDITION_TYPE_LABELS[type]}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-gray-400" title={CONDITION_TYPE_DESCRIPTIONS[item.triggerConditionType || 'always']}>
                      ?
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Saving...' : suite ? 'Update Suite' : 'Create Suite'}
        </button>
      </div>
    </form>
  );
}
