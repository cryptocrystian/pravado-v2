/**
 * Overage Breakdown Component (Sprint S33.2)
 * Displays overage costs breakdown
 */

'use client';

import React from 'react';
import { formatCurrency } from '@/lib/billingApi';

interface OverageBreakdownProps {
  overages: {
    tokens: number;
    playbookRuns: number;
    seats: number;
    estimatedCost: number;
  };
  overageRates: {
    tokens: number; // milli-cents per token
    playbookRuns: number; // cents per run
    seats: number; // cents per seat per month
  };
}

export function OverageBreakdown({ overages, overageRates }: OverageBreakdownProps) {
  if (overages.estimatedCost === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800 font-medium">
          No overages this period
        </p>
      </div>
    );
  }

  const tokenCost = (overages.tokens * overageRates.tokens) / 1000; // Convert milli-cents to cents
  const runCost = overages.playbookRuns * overageRates.playbookRuns;
  const seatCost = overages.seats * overageRates.seats;

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900">Overage Charges</h3>
      </div>

      <div className="divide-y divide-gray-200">
        {overages.tokens > 0 && (
          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">Tokens</p>
              <p className="text-xs text-gray-500">
                {overages.tokens.toLocaleString()} @ {formatCurrency(overageRates.tokens / 1000)}/token
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(tokenCost)}
            </p>
          </div>
        )}

        {overages.playbookRuns > 0 && (
          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">Playbook Runs</p>
              <p className="text-xs text-gray-500">
                {overages.playbookRuns} @ {formatCurrency(overageRates.playbookRuns)}/run
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(runCost)}
            </p>
          </div>
        )}

        {overages.seats > 0 && (
          <div className="px-4 py-3 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">Additional Seats</p>
              <p className="text-xs text-gray-500">
                {overages.seats} @ {formatCurrency(overageRates.seats)}/seat
              </p>
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {formatCurrency(seatCost)}
            </p>
          </div>
        )}
      </div>

      <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
        <p className="text-sm font-semibold text-gray-900">Total Overage</p>
        <p className="text-lg font-bold text-red-600">
          {formatCurrency(overages.estimatedCost)}
        </p>
      </div>
    </div>
  );
}
