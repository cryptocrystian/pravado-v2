'use client';

/**
 * PlaybookStepEditor Component (Sprint S67)
 * Editor for creating and modifying playbook steps with drag-and-drop reordering
 */

import { useState } from 'react';
import type { ScenarioPlaybookStep } from '@pravado/types';
import { ScenarioStepActionType, SCENARIO_STEP_ACTION_TYPE_LABELS } from '@pravado/types';

/**
 * Editable step type for the UI editor - contains only UI-relevant fields
 * Full ScenarioPlaybookStep properties are populated when saving to API
 */
export type EditablePlaybookStep = Pick<
  ScenarioPlaybookStep,
  | 'id'
  | 'playbookId'
  | 'stepIndex'
  | 'name'
  | 'description'
  | 'actionType'
  | 'actionPayload'
  | 'requiresApproval'
  | 'approvalRoles'
  | 'waitDurationMinutes'
  | 'createdAt'
  | 'updatedAt'
>;

interface PlaybookStepEditorProps {
  steps: EditablePlaybookStep[];
  onChange: (steps: EditablePlaybookStep[]) => void;
  disabled?: boolean;
}

interface StepFormData {
  name: string;
  description: string;
  actionType: ScenarioStepActionType;
  actionPayload: Record<string, unknown>;
  requiresApproval: boolean;
  approvalRoles: string[];
  waitDurationMinutes: number;
}

const DEFAULT_STEP: StepFormData = {
  name: '',
  description: '',
  actionType: ScenarioStepActionType.CUSTOM,
  actionPayload: {},
  requiresApproval: false,
  approvalRoles: [],
  waitDurationMinutes: 30,
};

const ACTION_TYPES: ScenarioStepActionType[] = [
  ScenarioStepActionType.OUTREACH,
  ScenarioStepActionType.CRISIS_RESPONSE,
  ScenarioStepActionType.GOVERNANCE,
  ScenarioStepActionType.REPORT_GENERATION,
  ScenarioStepActionType.MEDIA_ALERT,
  ScenarioStepActionType.REPUTATION_ACTION,
  ScenarioStepActionType.COMPETITIVE_ANALYSIS,
  ScenarioStepActionType.STAKEHOLDER_NOTIFY,
  ScenarioStepActionType.CONTENT_PUBLISH,
  ScenarioStepActionType.ESCALATION,
  ScenarioStepActionType.APPROVAL_GATE,
  ScenarioStepActionType.WAIT,
  ScenarioStepActionType.CONDITIONAL,
  ScenarioStepActionType.CUSTOM,
];

export function PlaybookStepEditor({ steps, onChange, disabled }: PlaybookStepEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState<StepFormData>(DEFAULT_STEP);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [newRole, setNewRole] = useState('');

  const handleAddStep = () => {
    setEditingIndex(-1);
    setFormData(DEFAULT_STEP);
  };

  const handleEditStep = (index: number) => {
    const step = steps[index];
    setEditingIndex(index);
    setFormData({
      name: step.name,
      description: step.description || '',
      actionType: step.actionType,
      actionPayload: step.actionPayload || {},
      requiresApproval: step.requiresApproval,
      approvalRoles: step.approvalRoles || [],
      waitDurationMinutes: step.waitDurationMinutes || 30,
    });
  };

  const handleSaveStep = () => {
    if (!formData.name.trim()) return;

    const newStep: EditablePlaybookStep = {
      id: editingIndex === -1 ? `temp-${Date.now()}` : steps[editingIndex!].id,
      playbookId: editingIndex === -1 ? '' : steps[editingIndex!].playbookId,
      stepIndex: editingIndex === -1 ? steps.length : steps[editingIndex!].stepIndex,
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      actionType: formData.actionType,
      actionPayload: formData.actionPayload,
      requiresApproval: formData.requiresApproval,
      approvalRoles: formData.approvalRoles,
      waitDurationMinutes: formData.waitDurationMinutes,
      createdAt: editingIndex === -1 ? new Date().toISOString() : steps[editingIndex!].createdAt,
      updatedAt: new Date().toISOString(),
    };

    if (editingIndex === -1) {
      onChange([...steps, newStep]);
    } else {
      const newSteps = [...steps];
      newSteps[editingIndex!] = newStep;
      onChange(newSteps);
    }

    setEditingIndex(null);
    setFormData(DEFAULT_STEP);
  };

  const handleDeleteStep = (index: number) => {
    if (!confirm('Are you sure you want to delete this step?')) return;

    const newSteps = steps.filter((_, i) => i !== index);
    // Update step orders
    newSteps.forEach((step, i) => {
      step.stepIndex = i;
    });
    onChange(newSteps);
  };

  const handleCancel = () => {
    setEditingIndex(null);
    setFormData(DEFAULT_STEP);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(index);
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      const newSteps = [...steps];
      const [removed] = newSteps.splice(dragIndex, 1);
      newSteps.splice(dropIndex, 0, removed);
      // Update step orders
      newSteps.forEach((step, i) => {
        step.stepIndex = i;
      });
      onChange(newSteps);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const addApprovalRole = () => {
    if (!newRole.trim()) return;
    if (!formData.approvalRoles.includes(newRole.trim())) {
      setFormData({
        ...formData,
        approvalRoles: [...formData.approvalRoles, newRole.trim()],
      });
    }
    setNewRole('');
  };

  const removeApprovalRole = (role: string) => {
    setFormData({
      ...formData,
      approvalRoles: formData.approvalRoles.filter((r) => r !== role),
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Playbook Steps</h3>
        {!disabled && editingIndex === null && (
          <button
            onClick={handleAddStep}
            className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            + Add Step
          </button>
        )}
      </div>

      {/* Step List */}
      {steps.length === 0 && editingIndex === null ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <svg
            className="mx-auto h-10 w-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">No steps defined</p>
          {!disabled && (
            <button
              onClick={handleAddStep}
              className="mt-3 px-3 py-1.5 text-sm text-purple-600 hover:text-purple-700"
            >
              Add your first step
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              draggable={!disabled && editingIndex === null}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`bg-white border rounded-lg p-4 ${
                dragIndex === index
                  ? 'opacity-50 border-purple-500'
                  : dropIndex === index && dragIndex !== null
                    ? 'border-purple-500 border-2'
                    : 'border-gray-200'
              } ${!disabled && editingIndex === null ? 'cursor-move' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Step Number */}
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 rounded-full text-sm font-medium">
                  {index + 1}
                </div>

                {/* Step Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 truncate">{step.name}</h4>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                      {SCENARIO_STEP_ACTION_TYPE_LABELS[step.actionType] || step.actionType}
                    </span>
                    {step.requiresApproval && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700">
                        Requires Approval
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-sm text-gray-500 line-clamp-2">{step.description}</p>
                  )}
                  <div className="mt-1 text-xs text-gray-400">
                    Est. {step.waitDurationMinutes || 30} minutes
                    {step.approvalRoles && step.approvalRoles.length > 0 && (
                      <span className="ml-2">
                        · Roles: {step.approvalRoles.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!disabled && editingIndex === null && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEditStep(index)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded"
                      title="Edit step"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteStep(index)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded"
                      title="Delete step"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step Editor Form */}
      {editingIndex !== null && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
          <h4 className="font-medium text-purple-900">
            {editingIndex === -1 ? 'Add New Step' : 'Edit Step'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Step Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Generate Press Release"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action Type *
              </label>
              <select
                value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value as ScenarioStepActionType })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              >
                {ACTION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {SCENARIO_STEP_ACTION_TYPE_LABELS[type] || type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this step does..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Estimated Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration (minutes)
              </label>
              <input
                type="number"
                min={1}
                value={formData.waitDurationMinutes}
                onChange={(e) => setFormData({ ...formData, waitDurationMinutes: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Requires Approval */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approval Required
              </label>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={formData.requiresApproval}
                  onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Require approval before execution</span>
              </label>
            </div>
          </div>

          {/* Approval Roles */}
          {formData.requiresApproval && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Approval Roles
              </label>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  placeholder="e.g., PR Manager"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addApprovalRole())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={addApprovalRole}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200"
                >
                  Add
                </button>
              </div>
              {formData.approvalRoles.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {formData.approvalRoles.map((role) => (
                    <span
                      key={role}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs"
                    >
                      {role}
                      <button
                        type="button"
                        onClick={() => removeApprovalRole(role)}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Payload (JSON) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action Payload (JSON)
            </label>
            <textarea
              value={JSON.stringify(formData.actionPayload, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  setFormData({ ...formData, actionPayload: parsed });
                } catch {
                  // Invalid JSON, ignore
                }
              }}
              placeholder="{}"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStep}
              disabled={!formData.name.trim()}
              className="px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {editingIndex === -1 ? 'Add Step' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Drag hint */}
      {!disabled && steps.length > 1 && editingIndex === null && (
        <p className="text-xs text-gray-400 text-center">
          Drag and drop to reorder steps
        </p>
      )}
    </div>
  );
}
