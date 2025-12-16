'use client';

/**
 * Outreach Sequence Editor Component (Sprint S44)
 * Create/edit outreach sequences with steps
 */

import { useEffect, useState } from 'react';

import type {
  CreateOutreachSequenceInput,
  CreateOutreachStepInput,
  OutreachSequence,
  OutreachSequenceStep,
} from '@pravado/types';

import {
  createOutreachSequence,
  createOutreachStep,
  generateOutreachDraft,
  getOutreachSequenceWithSteps,
  updateOutreachSequence,
} from '@/lib/prOutreachApi';

export interface OutreachSequenceEditorProps {
  sequence: OutreachSequence | null;
  onClose: () => void;
  onSave: () => void;
}

export function OutreachSequenceEditor({ sequence, onClose, onSave }: OutreachSequenceEditorProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxRunsPerDay, setMaxRunsPerDay] = useState(50);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [steps, setSteps] = useState<OutreachSequenceStep[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingStepIndex, setGeneratingStepIndex] = useState<number | null>(null);

  // Load sequence with steps if editing
  useEffect(() => {
    if (sequence) {
      setLoading(true);
      getOutreachSequenceWithSteps(sequence.id)
        .then((data) => {
          setName(data.name);
          setDescription(data.description || '');
          setMaxRunsPerDay(data.maxRunsPerDay);
          setStopOnReply(data.stopOnReply);
          setSteps(data.steps);
        })
        .catch((error) => {
          console.error('Failed to load sequence:', error);
          alert('Failed to load sequence');
        })
        .finally(() => setLoading(false));
    }
  }, [sequence]);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Name is required');
      return;
    }

    if (steps.length === 0) {
      alert('At least one step is required');
      return;
    }

    setSaving(true);
    try {
      let sequenceId: string;

      if (sequence) {
        // Update existing sequence
        await updateOutreachSequence(sequence.id, {
          name,
          description: description || undefined,
          maxRunsPerDay,
          stopOnReply,
        });
        sequenceId = sequence.id;
      } else {
        // Create new sequence
        const input: CreateOutreachSequenceInput = {
          name,
          description: description || undefined,
          maxRunsPerDay,
          stopOnReply,
        };

        const created = await createOutreachSequence(input);
        sequenceId = created.id;

        // Create steps
        for (const step of steps) {
          const stepInput: CreateOutreachStepInput = {
            stepNumber: step.stepNumber,
            delayHours: step.delayHours,
            subjectTemplate: step.subjectTemplate,
            bodyTemplate: step.bodyTemplate,
            useLlmGeneration: step.useLlmGeneration,
            llmPrompt: step.llmPrompt || undefined,
            llmModel: step.llmModel || undefined,
          };

          await createOutreachStep(sequenceId, stepInput);
        }
      }

      onSave();
    } catch (error) {
      console.error('Failed to save sequence:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    const newStep: Partial<OutreachSequenceStep> = {
      stepNumber: steps.length + 1,
      delayHours: steps.length === 0 ? 0 : 24,
      subjectTemplate: '',
      bodyTemplate: '',
      useLlmGeneration: false,
      llmPrompt: null,
      llmModel: null,
    };

    setSteps([...steps, newStep as OutreachSequenceStep]);
  };

  const handleUpdateStep = (index: number, field: string, value: any) => {
    const updated = [...steps];
    (updated[index] as any)[field] = value;
    setSteps(updated);
  };

  const handleDeleteStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    // Renumber steps
    updated.forEach((step, i) => {
      step.stepNumber = i + 1;
    });
    setSteps(updated);
  };

  const handleGenerateAIDraft = async (index: number) => {
    setGeneratingStepIndex(index);
    try {
      const step = steps[index];
      const draft = await generateOutreachDraft({
        action: index === 0 ? 'initial' : 'follow-up',
        stepNumber: step.stepNumber,
        topic: name || undefined,
      });

      handleUpdateStep(index, 'subjectTemplate', draft.subject);
      handleUpdateStep(index, 'bodyTemplate', draft.body);
    } catch (error) {
      console.error('Failed to generate AI draft:', error);
      alert('Failed to generate draft. Please try again.');
    } finally {
      setGeneratingStepIndex(null);
    }
  };

  return (
    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b sticky top-0 bg-white z-10">
        <h2 className="text-xl font-semibold">
          {sequence ? 'Edit Sequence' : 'New Outreach Sequence'}
        </h2>
      </div>

      {loading && (
        <div className="p-8 text-center text-gray-500">Loading...</div>
      )}

      {!loading && (
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name*</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Summer Product Launch Campaign"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                rows={3}
                placeholder="Optional description of this sequence"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Max Runs Per Day</label>
                <input
                  type="number"
                  value={maxRunsPerDay}
                  onChange={(e) => setMaxRunsPerDay(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                  min={1}
                  max={1000}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 mt-7">
                  <input
                    type="checkbox"
                    checked={stopOnReply}
                    onChange={(e) => setStopOnReply(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Stop sequence on journalist reply</span>
                </label>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Email Steps</h3>
              <button
                onClick={handleAddStep}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-sm"
              >
                + Add Step
              </button>
            </div>

            {steps.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed rounded">
                <p className="text-gray-500">No steps yet</p>
                <button
                  onClick={handleAddStep}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                >
                  Add your first step
                </button>
              </div>
            )}

            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={index} className="border rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      Step {step.stepNumber}
                      {index === 0 ? ' (Immediate)' : ` (${step.delayHours}h delay)`}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleGenerateAIDraft(index)}
                        disabled={generatingStepIndex === index}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-sm font-medium rounded hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {generatingStepIndex === index ? (
                          <>
                            <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>AI Draft</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteStep(index)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {index > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Delay (hours)</label>
                      <input
                        type="number"
                        value={step.delayHours}
                        onChange={(e) => handleUpdateStep(index, 'delayHours', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                        min={0}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Subject*</label>
                    <input
                      type="text"
                      value={step.subjectTemplate}
                      onChange={(e) => handleUpdateStep(index, 'subjectTemplate', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Hi {{journalist_name}}, ..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Body*</label>
                    <textarea
                      value={step.bodyTemplate}
                      onChange={(e) => handleUpdateStep(index, 'bodyTemplate', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                      rows={4}
                      placeholder="Email body template..."
                    />
                  </div>

                  <div className="text-xs text-gray-500">
                    Variables: {'{{journalist_name}}'}, {'{{outlet}}'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-6 border-t sticky bottom-0 bg-white flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 border rounded hover:bg-gray-50"
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          disabled={saving || loading}
        >
          {saving ? 'Saving...' : 'Save Sequence'}
        </button>
      </div>
    </div>
  );
}
