'use client';

/**
 * CreateSimulationModal Component (Sprint S71)
 * Modal for creating a new AI scenario simulation
 */

import { useState } from 'react';
import type { CreateAISimulationInput, AIScenarioSimulation } from '@pravado/types';
import { createSimulation } from '../../lib/aiScenarioSimulationApi';

interface CreateSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (simulation: AIScenarioSimulation) => void;
}

const OBJECTIVE_OPTIONS = [
  { value: 'crisis_comms', label: 'Crisis Communications', description: 'Simulate crisis response scenarios' },
  { value: 'investor_relations', label: 'Investor Relations', description: 'Practice investor Q&A and earnings calls' },
  { value: 'reputation', label: 'Reputation Management', description: 'Test reputation protection strategies' },
  { value: 'go_to_market', label: 'Go-to-Market', description: 'Simulate product launch scenarios' },
  { value: 'regulatory', label: 'Regulatory', description: 'Practice regulatory response scenarios' },
  { value: 'competitive', label: 'Competitive', description: 'Simulate competitive intelligence scenarios' },
  { value: 'earnings', label: 'Earnings', description: 'Prepare for earnings announcements' },
  { value: 'leadership_change', label: 'Leadership Change', description: 'Plan leadership transition communications' },
  { value: 'm_and_a', label: 'M&A', description: 'Simulate merger/acquisition scenarios' },
  { value: 'custom', label: 'Custom', description: 'Define your own scenario type' },
];

const MODE_OPTIONS = [
  { value: 'single_run', label: 'Single Run', description: 'One complete simulation run' },
  { value: 'multi_run', label: 'Multi-Run', description: 'Multiple runs with variations' },
  { value: 'what_if', label: 'What-If Analysis', description: 'Explore alternative outcomes' },
];

export function CreateSimulationModal({
  isOpen,
  onClose,
  onCreated,
}: CreateSimulationModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [objectiveType, setObjectiveType] = useState<string>('crisis_comms');
  const [simulationMode, setSimulationMode] = useState<string>('single_run');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const input: CreateAISimulationInput = {
        name: name.trim(),
        description: description.trim() || undefined,
        objectiveType: objectiveType as CreateAISimulationInput['objectiveType'],
        simulationMode: simulationMode as CreateAISimulationInput['simulationMode'],
      };

      const result = await createSimulation(input);
      onCreated(result.simulation);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setObjectiveType('crisis_comms');
    setSimulationMode('single_run');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Create New Simulation
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Set up a new AI-powered scenario simulation
              </p>
            </div>

            {/* Body */}
            <div className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Simulation Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={200}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., Q4 Crisis Response Drill"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Describe the scenario you want to simulate..."
                />
              </div>

              {/* Objective Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario Objective *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {OBJECTIVE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-start p-3 border rounded-lg cursor-pointer transition-colors ${
                        objectiveType === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="objectiveType"
                        value={opt.value}
                        checked={objectiveType === opt.value}
                        onChange={(e) => setObjectiveType(e.target.value)}
                        className="sr-only"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Simulation Mode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Simulation Mode
                </label>
                <div className="space-y-2">
                  {MODE_OPTIONS.map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        simulationMode === opt.value
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="simulationMode"
                        value={opt.value}
                        checked={simulationMode === opt.value}
                        onChange={(e) => setSimulationMode(e.target.value)}
                        className="mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                        <p className="text-xs text-gray-500">{opt.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Simulation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
