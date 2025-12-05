'use client';

/**
 * RealityCreateForm Component (Sprint S73)
 * Form for creating/editing a reality map
 */

import { useState, useEffect } from 'react';
import type {
  RealityMap,
  CreateRealityMapInput,
  UpdateRealityMapInput,
  RealityMapParameters,
  NarrativeStyle,
  ProbabilityModelType,
} from '@pravado/types';
import { PROBABILITY_MODELS, NARRATIVE_STYLES } from '../../lib/realityMapApi';
import { listSuites } from '../../lib/scenarioOrchestrationApi';

interface RealityCreateFormProps {
  map?: RealityMap;
  onSubmit: (input: CreateRealityMapInput | UpdateRealityMapInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function RealityCreateForm({
  map,
  onSubmit,
  onCancel,
  loading = false,
}: RealityCreateFormProps) {
  const [name, setName] = useState(map?.name || '');
  const [description, setDescription] = useState(map?.description || '');
  const [suiteId, setSuiteId] = useState(map?.suiteId || '');
  const [maxDepth, setMaxDepth] = useState(map?.parameters.maxDepth || 5);
  const [branchingFactor, setBranchingFactor] = useState(map?.parameters.branchingFactor || 3);
  const [minProbability, setMinProbability] = useState(map?.parameters.minProbability || 0.05);
  const [includeRiskAnalysis, setIncludeRiskAnalysis] = useState(map?.parameters.includeRiskAnalysis ?? true);
  const [includeOpportunityAnalysis, setIncludeOpportunityAnalysis] = useState(map?.parameters.includeOpportunityAnalysis ?? true);
  const [narrativeStyle, setNarrativeStyle] = useState<NarrativeStyle>(map?.parameters.narrativeStyle || 'executive');
  const [probabilityModel, setProbabilityModel] = useState<ProbabilityModelType>(map?.parameters.probabilityModel || 'weighted_average');
  const [suites, setSuites] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuites();
  }, []);

  const loadSuites = async () => {
    try {
      const result = await listSuites({ limit: 100, status: 'configured' });
      setSuites(result.suites.map(s => ({ id: s.id, name: s.name })));
    } catch (err) {
      console.error('Failed to load suites', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const parameters: Partial<RealityMapParameters> = {
        maxDepth,
        branchingFactor,
        minProbability,
        includeRiskAnalysis,
        includeOpportunityAnalysis,
        narrativeStyle,
        probabilityModel,
      };

      const input: CreateRealityMapInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        suiteId: suiteId || undefined,
        parameters,
      };

      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reality map');
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
          Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={255}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="e.g., Crisis Response Reality Map"
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
          maxLength={5000}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Describe the purpose of this reality map..."
        />
      </div>

      {/* Source Suite */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Source Suite (Optional)
        </label>
        <select
          value={suiteId}
          onChange={(e) => setSuiteId(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">No source suite</option>
          {suites.map((suite) => (
            <option key={suite.id} value={suite.id}>
              {suite.name}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Link to a scenario orchestration suite to use its simulation data.
        </p>
      </div>

      {/* Generation Parameters */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Generation Parameters</h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Max Depth</label>
            <input
              type="number"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              min={1}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="mt-1 text-xs text-gray-500">1-10 levels deep</p>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Branching Factor</label>
            <input
              type="number"
              value={branchingFactor}
              onChange={(e) => setBranchingFactor(Number(e.target.value))}
              min={1}
              max={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            <p className="mt-1 text-xs text-gray-500">Max branches per node</p>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm text-gray-700 mb-1">
            Min Probability Threshold ({(minProbability * 100).toFixed(0)}%)
          </label>
          <input
            type="range"
            value={minProbability}
            onChange={(e) => setMinProbability(Number(e.target.value))}
            min={0}
            max={0.5}
            step={0.01}
            className="w-full"
          />
          <p className="mt-1 text-xs text-gray-500">
            Exclude branches with probability below this threshold.
          </p>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Analysis Options</h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeRiskAnalysis}
              onChange={(e) => setIncludeRiskAnalysis(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span className="text-sm text-gray-700">Include Risk Analysis</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={includeOpportunityAnalysis}
              onChange={(e) => setIncludeOpportunityAnalysis(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span className="text-sm text-gray-700">Include Opportunity Analysis</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Narrative Style</label>
            <select
              value={narrativeStyle}
              onChange={(e) => setNarrativeStyle(e.target.value as NarrativeStyle)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.entries(NARRATIVE_STYLES).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Probability Model</label>
            <select
              value={probabilityModel}
              onChange={(e) => setProbabilityModel(e.target.value as ProbabilityModelType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.entries(PROBABILITY_MODELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

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
          {loading ? 'Saving...' : map ? 'Update' : 'Create Reality Map'}
        </button>
      </div>
    </form>
  );
}
