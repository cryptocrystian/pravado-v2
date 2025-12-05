/**
 * Downgrade Blocked Dialog Component (Sprint S33.2)
 * Shows when downgrade is prevented due to usage guardrails
 */

'use client';

import React from 'react';
import { BillingPlan, OrgBillingSummaryEnriched } from '@/lib/billingApi';

interface DowngradeBlockedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetPlan: BillingPlan | null;
  currentSummary: OrgBillingSummaryEnriched | null;
  errorMessage?: string;
}

export function DowngradeBlockedDialog({
  isOpen,
  onClose,
  targetPlan,
  currentSummary,
  errorMessage
}: DowngradeBlockedDialogProps) {
  if (!isOpen) return null;

  const usageExceeds: Array<{ resource: string; current: number; limit: number }> = [];

  if (currentSummary && targetPlan) {
    // Check tokens
    const currentTokenUsage = currentSummary.tokensUsedThisPeriod + (currentSummary.overages?.tokens || 0);
    if (currentTokenUsage > targetPlan.includedTokensMonthly) {
      usageExceeds.push({
        resource: 'Tokens',
        current: currentTokenUsage,
        limit: targetPlan.includedTokensMonthly
      });
    }

    // Check playbook runs
    const currentRunUsage = currentSummary.playbookRunsThisPeriod + (currentSummary.overages?.playbookRuns || 0);
    if (currentRunUsage > targetPlan.includedPlaybookRunsMonthly) {
      usageExceeds.push({
        resource: 'Playbook Runs',
        current: currentRunUsage,
        limit: targetPlan.includedPlaybookRunsMonthly
      });
    }

    // Check seats
    if (currentSummary.seatsUsed > targetPlan.includedSeats) {
      usageExceeds.push({
        resource: 'Seats',
        current: currentSummary.seatsUsed,
        limit: targetPlan.includedSeats
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Cannot Downgrade Plan
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm text-gray-700 mb-4">
              {errorMessage || 'Your current usage exceeds the limits of the selected plan. Please reduce your usage before downgrading.'}
            </p>

            {usageExceeds.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-900 mb-3">
                  Usage Exceeds Limits:
                </h4>
                <div className="space-y-2">
                  {usageExceeds.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-red-800">{item.resource}</span>
                      <span className="text-red-700">
                        {item.current.toLocaleString()} / {item.limit.toLocaleString()}
                        <span className="ml-2 text-xs text-red-600">
                          ({((item.current / item.limit - 1) * 100).toFixed(0)}% over)
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {targetPlan && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                To downgrade to {targetPlan.name}:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                {usageExceeds.find(item => item.resource === 'Tokens') && (
                  <li>Reduce token usage or wait for your billing period to reset</li>
                )}
                {usageExceeds.find(item => item.resource === 'Playbook Runs') && (
                  <li>Reduce playbook runs or wait for your billing period to reset</li>
                )}
                {usageExceeds.find(item => item.resource === 'Seats') && (
                  <li>Remove team members to reduce active seats</li>
                )}
              </ul>
            </div>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full px-4 py-2 rounded-md font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
