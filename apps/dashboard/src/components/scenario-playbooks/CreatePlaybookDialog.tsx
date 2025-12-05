'use client';

/**
 * CreatePlaybookDialog Component (Sprint S67)
 * Modal dialog for creating new scenario playbooks
 */

import { useState } from 'react';
import type { ScenarioPlaybook } from '@pravado/types';
import { PlaybookStepEditor, type EditablePlaybookStep } from './PlaybookStepEditor';
import { createPlaybook } from '../../lib/scenarioPlaybookApi';

interface CreatePlaybookDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (playbook: ScenarioPlaybook) => void;
}

// Playbook category options (category is stored as string)
type PlaybookCategory =
  | 'crisis_management'
  | 'product_launch'
  | 'reputation_repair'
  | 'media_outreach'
  | 'content_amplification'
  | 'competitor_response'
  | 'custom';

const CATEGORY_LABELS: Record<PlaybookCategory, string> = {
  crisis_management: 'Crisis Management',
  product_launch: 'Product Launch',
  reputation_repair: 'Reputation Repair',
  media_outreach: 'Media Outreach',
  content_amplification: 'Content Amplification',
  competitor_response: 'Competitor Response',
  custom: 'Custom',
};

interface FormData {
  name: string;
  description: string;
  category: PlaybookCategory;
  metadata: Record<string, unknown>;
}

const CATEGORIES: PlaybookCategory[] = [
  'crisis_management',
  'product_launch',
  'reputation_repair',
  'media_outreach',
  'content_amplification',
  'competitor_response',
  'custom',
];

const DEFAULT_FORM_DATA: FormData = {
  name: '',
  description: '',
  category: 'custom',
  metadata: {},
};

export function CreatePlaybookDialog({
  isOpen,
  onClose,
  onCreated,
}: CreatePlaybookDialogProps) {
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM_DATA);
  const [steps, setSteps] = useState<EditablePlaybookStep[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'steps'>('details');

  const handleClose = () => {
    setFormData(DEFAULT_FORM_DATA);
    setSteps([]);
    setError(null);
    setActiveTab('details');
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Playbook name is required');
      return;
    }

    if (steps.length === 0) {
      setError('At least one step is required');
      setActiveTab('steps');
      return;
    }

    setLoading(true);

    try {
      const playbook = await createPlaybook({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category,
        metadata: formData.metadata,
        steps: steps.map((step, index) => ({
          name: step.name,
          description: step.description || undefined,
          actionType: step.actionType,
          actionPayload: step.actionPayload,
          requiresApproval: step.requiresApproval,
          approvalRoles: step.approvalRoles,
          waitDurationMinutes: step.waitDurationMinutes || undefined,
          stepOrder: index,
        })),
      });

      onCreated?.(playbook);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create playbook');
    } finally {
      setLoading(false);
    }
  };

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
        <div className="relative w-full max-w-3xl bg-white rounded-xl shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Create New Playbook</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'details'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'steps'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Steps ({steps.length})
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit}>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Playbook Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Crisis Response Protocol"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what this playbook does and when it should be used..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as PlaybookCategory })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_LABELS[cat] || cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Metadata (JSON)
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
              )}

              {/* Steps Tab */}
              {activeTab === 'steps' && (
                <PlaybookStepEditor
                  steps={steps}
                  onChange={setSteps}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-500">
                {steps.length} step{steps.length !== 1 ? 's' : ''} defined
              </div>
              <div className="flex items-center gap-3">
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
                  disabled={loading || !formData.name.trim()}
                  className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Playbook'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
