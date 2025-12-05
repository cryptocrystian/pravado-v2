'use client';

/**
 * Sequence Editor Component (Sprint S39)
 * Form for creating and editing pitch sequences with steps
 */

import type {
  CreatePRPitchSequenceInput,
  PRPitchSequenceWithSteps,
  PRPitchStepType,
} from '@pravado/types';
import { useState } from 'react';

interface SequenceEditorProps {
  sequence: PRPitchSequenceWithSteps | null;
  pressReleases: { id: string; headline: string }[];
  onSave: (input: CreatePRPitchSequenceInput) => Promise<void>;
  onUpdate: (id: string, input: Partial<CreatePRPitchSequenceInput>) => Promise<void>;
  isSaving?: boolean;
}

const STEP_TYPES: { value: PRPitchStepType; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'social_dm', label: 'Social DM' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'other', label: 'Other' },
];

interface StepFormData {
  id?: string;
  position: number;
  stepType: PRPitchStepType;
  subjectTemplate: string;
  bodyTemplate: string;
  waitDays: number;
}

export function SequenceEditor({
  sequence,
  pressReleases,
  onSave,
  onUpdate,
  isSaving,
}: SequenceEditorProps) {
  const [name, setName] = useState(sequence?.name || '');
  const [pressReleaseId, setPressReleaseId] = useState(sequence?.pressReleaseId || '');
  const [defaultSubject, setDefaultSubject] = useState(sequence?.defaultSubject || '');
  const [steps, setSteps] = useState<StepFormData[]>(
    sequence?.steps.map((s) => ({
      id: s.id,
      position: s.position,
      stepType: s.stepType,
      subjectTemplate: s.subjectTemplate || '',
      bodyTemplate: s.bodyTemplate,
      waitDays: s.waitDays,
    })) || [
      {
        position: 1,
        stepType: 'email' as PRPitchStepType,
        subjectTemplate: '',
        bodyTemplate: `Hi {{journalist.firstName}},

I've been following your coverage of {{journalist.beat}} and thought this might be of interest.

{{pressRelease.headline}}

Would you be interested in learning more? Happy to provide additional details or arrange an interview.

Best regards,
{{organization.name}}`,
        waitDays: 0,
      },
    ]
  );

  const handleAddStep = () => {
    const newPosition = steps.length + 1;
    setSteps([
      ...steps,
      {
        position: newPosition,
        stepType: 'email',
        subjectTemplate: '',
        bodyTemplate: `Hi {{journalist.firstName}},

I wanted to follow up on my previous email about {{pressRelease.headline}}.

Would you have a few minutes to discuss this further?

Best regards,
{{organization.name}}`,
        waitDays: 3,
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    if (steps.length <= 1) return;
    const newSteps = steps.filter((_, i) => i !== index);
    // Reorder positions
    setSteps(newSteps.map((s, i) => ({ ...s, position: i + 1 })));
  };

  const handleStepChange = (index: number, field: keyof StepFormData, value: unknown) => {
    setSteps(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input: CreatePRPitchSequenceInput = {
      name,
      pressReleaseId: pressReleaseId || undefined,
      defaultSubject: defaultSubject || undefined,
      steps: steps.map((s) => ({
        position: s.position,
        stepType: s.stepType,
        subjectTemplate: s.subjectTemplate || undefined,
        bodyTemplate: s.bodyTemplate,
        waitDays: s.waitDays,
      })),
    };

    if (sequence) {
      await onUpdate(sequence.id, input);
    } else {
      await onSave(input);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {sequence ? 'Edit Sequence' : 'Create New Sequence'}
        </h3>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Sequence Name *
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Q1 Product Launch Outreach"
            required
          />
        </div>

        <div>
          <label htmlFor="pressRelease" className="block text-sm font-medium text-gray-700">
            Associated Press Release
          </label>
          <select
            id="pressRelease"
            value={pressReleaseId}
            onChange={(e) => setPressReleaseId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">None</option>
            {pressReleases.map((pr) => (
              <option key={pr.id} value={pr.id}>
                {pr.headline}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="defaultSubject" className="block text-sm font-medium text-gray-700">
            Default Subject Line
          </label>
          <input
            type="text"
            id="defaultSubject"
            value={defaultSubject}
            onChange={(e) => setDefaultSubject(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Story Idea: {{pressRelease.headline}}"
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Sequence Steps</h3>
          <button
            type="button"
            onClick={handleAddStep}
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            + Add Follow-up
          </button>
        </div>

        <div className="space-y-6">
          {steps.map((step, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 bg-white relative"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  {index === 0 ? 'Initial Pitch' : `Follow-up ${index}`}
                </h4>
                {steps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    value={step.stepType}
                    onChange={(e) =>
                      handleStepChange(index, 'stepType', e.target.value as PRPitchStepType)
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    {STEP_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {index > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Wait Days
                    </label>
                    <input
                      type="number"
                      value={step.waitDays}
                      onChange={(e) =>
                        handleStepChange(index, 'waitDays', parseInt(e.target.value) || 0)
                      }
                      min={0}
                      max={30}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Subject Template
                </label>
                <input
                  type="text"
                  value={step.subjectTemplate}
                  onChange={(e) => handleStepChange(index, 'subjectTemplate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  placeholder="Use {{variables}} for personalization"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Body Template *
                </label>
                <textarea
                  value={step.bodyTemplate}
                  onChange={(e) => handleStepChange(index, 'bodyTemplate', e.target.value)}
                  rows={6}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm font-mono text-sm"
                  placeholder="Email body with {{journalist.firstName}}, {{organization.name}}, etc."
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Available variables: {'{{journalist.firstName}}'}, {'{{journalist.beat}}'},
                  {'{{journalist.outlet}}'}, {'{{organization.name}}'}, {'{{pressRelease.headline}}'},
                  {'{{pressRelease.angle}}'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSaving || !name}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : sequence ? 'Update Sequence' : 'Create Sequence'}
        </button>
      </div>
    </form>
  );
}
