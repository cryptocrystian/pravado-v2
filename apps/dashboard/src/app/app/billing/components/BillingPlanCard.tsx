/**
 * Billing Plan Card Component (Sprint S33.2)
 * Displays a billing plan with pricing, limits, and action buttons
 */

'use client';

import React, { useState } from 'react';
import { BillingPlan, formatCurrency, canDowngradeToPlan, OrgBillingSummaryEnriched } from '@/lib/billingApi';
import { PlanRecommendationBadge } from './PlanRecommendationBadge';

interface BillingPlanCardProps {
  plan: BillingPlan;
  isCurrentPlan: boolean;
  isRecommended: boolean;
  currentSummary: OrgBillingSummaryEnriched;
  onUpgrade: (planSlug: string) => Promise<void>;
  onDowngrade: (planSlug: string) => Promise<{ success: boolean; error?: string }>;
  onContactSales?: () => void;
}

export function BillingPlanCard({
  plan,
  isCurrentPlan,
  isRecommended,
  currentSummary,
  onUpgrade,
  onDowngrade,
  onContactSales
}: BillingPlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleActionClick = async () => {
    if (isCurrentPlan) return;

    setIsLoading(true);
    try {
      if (plan.slug === 'enterprise') {
        onContactSales?.();
        return;
      }

      // Determine if this is an upgrade or downgrade
      const currentPlanPrice = currentSummary.plan?.monthlyPriceCents || 0;
      const targetPlanPrice = plan.monthlyPriceCents;
      const isUpgrade = targetPlanPrice > currentPlanPrice;

      if (isUpgrade) {
        // Upgrade flow: open checkout session
        await onUpgrade(plan.slug);
      } else {
        // Downgrade flow: attempt to switch plan
        const result = await onDowngrade(plan.slug);
        if (!result.success) {
          // Error will be handled by parent component (show DowngradeBlockedDialog)
          console.error('Downgrade failed:', result.error);
        }
      }
    } catch (error) {
      console.error('Failed to change plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionButton = () => {
    if (isCurrentPlan) {
      return (
        <button
          disabled
          className="w-full px-4 py-2 rounded-md font-medium bg-gray-100 text-gray-500 cursor-not-allowed"
        >
          Current Plan
        </button>
      );
    }

    if (plan.slug === 'enterprise') {
      return (
        <button
          onClick={handleActionClick}
          disabled={isLoading}
          className="w-full px-4 py-2 rounded-md font-medium bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Contact Sales'}
        </button>
      );
    }

    const currentPlanPrice = currentSummary.plan?.monthlyPriceCents || 0;
    const isUpgrade = plan.monthlyPriceCents > currentPlanPrice;

    return (
      <button
        onClick={handleActionClick}
        disabled={isLoading}
        className={`w-full px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
          isUpgrade
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }`}
      >
        {isLoading ? 'Processing...' : isUpgrade ? 'Upgrade' : 'Downgrade'}
      </button>
    );
  };

  // Check if downgrade would be allowed
  const downgradeCheck = !isCurrentPlan && plan.monthlyPriceCents < (currentSummary.plan?.monthlyPriceCents || 0)
    ? canDowngradeToPlan(currentSummary, plan)
    : { allowed: true };

  return (
    <div
      className={`relative border rounded-lg p-6 transition-all ${
        isCurrentPlan
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
          : isRecommended
          ? 'border-blue-300 bg-blue-50/50'
          : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
          {isCurrentPlan && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
              Current
            </span>
          )}
        </div>

        {plan.description && (
          <p className="text-sm text-gray-600">{plan.description}</p>
        )}

        {isRecommended && !isCurrentPlan && (
          <PlanRecommendationBadge recommendedPlanSlug={plan.slug} />
        )}
      </div>

      {/* Price */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">
            {plan.monthlyPriceCents === 0 ? 'Free' : formatCurrency(plan.monthlyPriceCents)}
          </span>
          {plan.monthlyPriceCents > 0 && (
            <span className="ml-2 text-gray-500">/month</span>
          )}
        </div>
      </div>

      {/* Included Limits */}
      <div className="space-y-3 mb-6">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Included</h4>
        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">
              <strong>{plan.includedTokensMonthly.toLocaleString()}</strong> tokens/month
            </span>
          </div>

          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">
              <strong>{plan.includedPlaybookRunsMonthly}</strong> playbook runs/month
            </span>
          </div>

          <div className="flex items-center text-sm">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">
              <strong>{plan.includedSeats}</strong> seats
            </span>
          </div>
        </div>
      </div>

      {/* Overage Rates */}
      <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Overage Rates</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div>Tokens: {formatCurrency(plan.overageTokenPriceMilliCents / 1000)}/token</div>
          <div>Runs: {formatCurrency(plan.overagePlaybookRunPriceCents)}/run</div>
        </div>
      </div>

      {/* Downgrade Warning */}
      {!downgradeCheck.allowed && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            ⚠️ {downgradeCheck.reason}
          </p>
        </div>
      )}

      {/* Action Button */}
      {getActionButton()}
    </div>
  );
}
