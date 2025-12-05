'use client';

/**
 * StepApprovalPanel Component (Sprint S67)
 * Panel for reviewing and approving/rejecting scenario run steps
 */

import { useState } from 'react';
import type { ScenarioRunStep, ScenarioPlaybookStep, ScenarioStepStatus } from '@pravado/types';
import { SCENARIO_STEP_STATUS_LABELS, STEP_STATUS_COLORS, SCENARIO_STEP_ACTION_TYPE_LABELS } from '@pravado/types';
import { approveScenarioStep } from '../../lib/scenarioPlaybookApi';

interface StepApprovalPanelProps {
  runStep: ScenarioRunStep;
  playbookStep?: ScenarioPlaybookStep;
  onApproved?: (step: ScenarioRunStep) => void;
  onRejected?: (step: ScenarioRunStep) => void;
  onError?: (error: string) => void;
}

export function StepApprovalPanel({
  runStep,
  playbookStep,
  onApproved,
  onRejected,
  onError,
}: StepApprovalPanelProps) {
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const statusLabel = SCENARIO_STEP_STATUS_LABELS[runStep.status as ScenarioStepStatus] || runStep.status;
  const statusColor = STEP_STATUS_COLORS[runStep.status as ScenarioStepStatus] || 'bg-gray-100 text-gray-800';
  const actionLabel = playbookStep
    ? SCENARIO_STEP_ACTION_TYPE_LABELS[playbookStep.actionType] || playbookStep.actionType
    : 'Unknown';

  const isReady = runStep.status === 'ready';

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approveScenarioStep(runStep.id, true, notes);
      onApproved?.(result);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to approve step');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      onError?.('Please provide a reason for rejection');
      return;
    }

    setLoading(true);
    try {
      const result = await approveScenarioStep(runStep.id, false, notes);
      onRejected?.(result);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to reject step');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-purple-50 px-6 py-4 border-b border-purple-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-900">
                {playbookStep?.name || `Step ${runStep.stepIndex + 1}`}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
                {statusLabel}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-0.5">{actionLabel}</p>
          </div>
          <span className="text-2xl font-bold text-purple-600">
            #{runStep.stepIndex + 1}
          </span>
        </div>
      </div>

      {/* Step Details */}
      <div className="p-6 space-y-4">
        {playbookStep?.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
            <p className="text-sm text-gray-600">{playbookStep.description}</p>
          </div>
        )}

        {playbookStep?.actionPayload && Object.keys(playbookStep.actionPayload).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Action Details</h4>
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">
              {JSON.stringify(playbookStep.actionPayload, null, 2)}
            </pre>
          </div>
        )}

        {runStep.executionContext && Object.keys(runStep.executionContext).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Execution Context</h4>
            <pre className="text-xs bg-gray-50 p-3 rounded-lg overflow-auto max-h-40">
              {JSON.stringify(runStep.executionContext, null, 2)}
            </pre>
          </div>
        )}

        {runStep.simulatedImpact && Object.keys(runStep.simulatedImpact).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Simulated Impact</h4>
            <div className="grid grid-cols-3 gap-3">
              {runStep.simulatedImpact.sentimentDelta !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Sentiment</p>
                  <p className={`text-lg font-semibold ${
                    runStep.simulatedImpact.sentimentDelta >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {runStep.simulatedImpact.sentimentDelta >= 0 ? '+' : ''}
                    {runStep.simulatedImpact.sentimentDelta}
                  </p>
                </div>
              )}
              {runStep.simulatedImpact.coverageDelta !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Coverage</p>
                  <p className={`text-lg font-semibold ${
                    runStep.simulatedImpact.coverageDelta >= 0 ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {runStep.simulatedImpact.coverageDelta >= 0 ? '+' : ''}
                    {runStep.simulatedImpact.coverageDelta}%
                  </p>
                </div>
              )}
              {runStep.simulatedImpact.engagementDelta !== undefined && (
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Engagement</p>
                  <p className={`text-lg font-semibold ${
                    runStep.simulatedImpact.engagementDelta >= 0 ? 'text-purple-600' : 'text-red-600'
                  }`}>
                    {runStep.simulatedImpact.engagementDelta >= 0 ? '+' : ''}
                    {runStep.simulatedImpact.engagementDelta}%
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {playbookStep?.approvalRoles && playbookStep.approvalRoles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-1">Required Approval Roles</h4>
            <div className="flex flex-wrap gap-1">
              {playbookStep.approvalRoles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes Input */}
        {isReady && (
          <div>
            <label htmlFor="approval-notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes {!loading && '(required for rejection)'}
            </label>
            <textarea
              id="approval-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes or comments..."
              rows={3}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-50"
            />
          </div>
        )}
      </div>

      {/* Actions */}
      {isReady && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Reject & Skip'}
          </button>
          <button
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Approve & Execute'}
          </button>
        </div>
      )}

      {/* Already Processed */}
      {!isReady && runStep.approvedAt && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Processed on {new Date(runStep.approvedAt).toLocaleString()}
            {runStep.approvalNotes && (
              <span className="text-gray-400">: {runStep.approvalNotes}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
