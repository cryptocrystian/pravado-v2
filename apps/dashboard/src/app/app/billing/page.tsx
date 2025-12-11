/**
 * Billing Self-Service Portal (Sprint S33.2)
 * Complete UI for plan management, usage tracking, and subscription control
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getBillingSummaryEnriched,
  getAvailablePlans,
  switchPlan,
  cancelSubscription,
  resumeSubscription,
  createCheckoutSession,
  getUsageAlerts,
  acknowledgeAlert,
  formatCurrency,
  type BillingPlan,
  type OrgBillingSummaryEnriched,
  type BillingAlertRecord
} from '@/lib/billingApi';
import { UsageBar } from './components/UsageBar';
import { PlanRecommendationBadge } from './components/PlanRecommendationBadge';
import { TrialBanner } from './components/TrialBanner';
import { OverageBreakdown } from './components/OverageBreakdown';
import { StripePortalButton } from './components/StripePortalButton';
import { BillingPlanCard } from './components/BillingPlanCard';
import { CancelSubscriptionModal } from './components/CancelSubscriptionModal';
import { DowngradeBlockedDialog } from './components/DowngradeBlockedDialog';

export default function BillingPage() {
  // State
  const [summary, setSummary] = useState<OrgBillingSummaryEnriched | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [alerts, setAlerts] = useState<BillingAlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [blockedDowngradePlan, setBlockedDowngradePlan] = useState<BillingPlan | null>(null);
  const [downgradeError, setDowngradeError] = useState<string>('');

  // Load data on mount
  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load summary, plans, and alerts in parallel
      const [summaryData, plansData, alertsData] = await Promise.all([
        getBillingSummaryEnriched(),
        getAvailablePlans(),
        getUsageAlerts()
      ]);

      setSummary(summaryData);
      setPlans(plansData);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error('Failed to load billing data:', err);
      setError(err.message || 'Failed to load billing information');
    } finally {
      setLoading(false);
    }
  };

  // Handle upgrade flow (opens Stripe checkout)
  const handleUpgrade = async (planSlug: string) => {
    try {
      const result = await createCheckoutSession(planSlug);
      if (result.success && result.data?.sessionUrl) {
        // Redirect to Stripe checkout
        window.location.href = result.data.sessionUrl;
      } else {
        alert('Failed to create checkout session. Please try again.');
      }
    } catch (error) {
      console.error('Failed to upgrade:', error);
      alert('Failed to start upgrade process. Please try again.');
    }
  };

  // Handle downgrade flow (direct plan switch)
  const handleDowngrade = async (planSlug: string) => {
    try {
      const result = await switchPlan(planSlug);

      if (result.success) {
        // Reload billing data to reflect changes
        await loadBillingData();
        return { success: true };
      } else if (result.error?.code === '422_UPGRADE_REQUIRED') {
        // Show downgrade blocked dialog
        const targetPlan = plans.find(p => p.slug === planSlug);
        setBlockedDowngradePlan(targetPlan || null);
        setDowngradeError(result.error.message || 'Your usage exceeds the limits of this plan');
        setShowDowngradeDialog(true);
        return { success: false, error: result.error.message };
      } else {
        alert(result.error?.message || 'Failed to downgrade plan');
        return { success: false, error: result.error?.message };
      }
    } catch (error: any) {
      console.error('Failed to downgrade:', error);
      return { success: false, error: error.message };
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async (immediate: boolean) => {
    try {
      const result = await cancelSubscription(immediate);
      if (result.success) {
        await loadBillingData();
        alert(immediate
          ? 'Subscription cancelled immediately'
          : 'Subscription will be cancelled at the end of the billing period'
        );
      } else {
        alert(result.error?.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  };

  // Handle subscription resumption
  const handleResumeSubscription = async () => {
    try {
      const result = await resumeSubscription();
      if (result.success) {
        await loadBillingData();
        alert('Subscription resumed successfully');
      } else {
        alert(result.error?.message || 'Failed to resume subscription');
      }
    } catch (error) {
      console.error('Failed to resume subscription:', error);
      alert('Failed to resume subscription. Please try again.');
    }
  };

  // Handle alert acknowledgment
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      const success = await acknowledgeAlert(alertId);
      if (success) {
        // Remove alert from list
        setAlerts(alerts.filter(a => a.id !== alertId));
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
          <p className="mt-4 text-muted">Loading billing information...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error || !summary) {
    return (
      <div className="p-8">
        <div className="alert-error">
          {error || 'Failed to load billing information'}
        </div>
      </div>
    );
  }

  const isCancelled = summary.billingStatus === 'canceled';

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white-0 mb-2">Billing & Subscription</h1>
        <p className="text-muted">Manage your plan, track usage, and control your subscription</p>
      </div>

      {/* Trial Banner */}
      {summary.trialDaysRemaining && summary.trialDaysRemaining > 0 && (
        <div className="mb-6">
          <TrialBanner
            daysRemaining={summary.trialDaysRemaining}
            onUpgradeClick={() => {
              // Scroll to plan selection
              document.getElementById('plan-selection')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Alerts Panel (S32 Integration) */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <div className="panel-card p-6">
            <h2 className="text-lg font-semibold text-white-0 mb-4">Usage Alerts</h2>
            <div className="space-y-3">
              {alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`flex items-start justify-between p-3 rounded-lg border ${
                    alert.severity === 'critical'
                      ? 'bg-semantic-danger/10 border-semantic-danger/20'
                      : alert.severity === 'warning'
                      ? 'bg-semantic-warning/10 border-semantic-warning/20'
                      : 'bg-brand-cyan/10 border-brand-cyan/20'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white-0">{alert.message}</p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!alert.acknowledgedAt && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      className="ml-4 text-sm text-slate-6 hover:text-white-0 underline"
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Current Plan Card */}
      <div className="mb-8">
        <div className="panel-card p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white-0 mb-1">Current Plan</h2>
              {summary.plan && (
                <div className="mt-2">
                  <div className="text-3xl font-bold text-white-0">{summary.plan.name}</div>
                  <div className="text-lg text-muted mt-1">
                    {formatCurrency(summary.plan.monthlyPriceCents)} / month
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                summary.billingStatus === 'active'
                  ? 'bg-semantic-success/10 text-semantic-success'
                  : summary.billingStatus === 'trial'
                  ? 'bg-brand-cyan/10 text-brand-cyan'
                  : summary.billingStatus === 'past_due'
                  ? 'bg-semantic-danger/10 text-semantic-danger'
                  : 'bg-slate-5 text-slate-6'
              }`}>
                {summary.billingStatus.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Renewal / Trial Info */}
          {summary.nextBillingDate && (
            <div className="mb-4 text-sm text-muted">
              {summary.trialDaysRemaining && summary.trialDaysRemaining > 0
                ? `Trial ends on ${new Date(summary.nextBillingDate).toLocaleDateString()}`
                : `Next billing date: ${new Date(summary.nextBillingDate).toLocaleDateString()}`
              }
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {isCancelled ? (
              <button
                onClick={handleResumeSubscription}
                className="px-4 py-2 rounded-md font-medium bg-semantic-success hover:bg-semantic-success/90 text-white transition-colors"
              >
                Resume Subscription
              </button>
            ) : (
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-4 py-2 rounded-md font-medium bg-semantic-danger hover:bg-semantic-danger/90 text-white transition-colors"
              >
                Cancel Subscription
              </button>
            )}
            <StripePortalButton variant="secondary" />
          </div>
        </div>
      </div>

      {/* Usage Tracking */}
      <div className="mb-8">
        <div className="panel-card p-6">
          <h2 className="text-xl font-semibold text-white-0 mb-6">Usage This Period</h2>

          <div className="space-y-6 mb-6">
            {/* Token Usage */}
            {summary.plan && (
              <UsageBar
                label="LLM Tokens"
                used={summary.tokensUsedThisPeriod}
                limit={summary.plan.includedTokensMonthly}
                unit="tokens"
                overage={summary.overages?.tokens || 0}
              />
            )}

            {/* Playbook Runs */}
            {summary.plan && (
              <UsageBar
                label="Playbook Runs"
                used={summary.playbookRunsThisPeriod}
                limit={summary.plan.includedPlaybookRunsMonthly}
                unit="runs"
                overage={summary.overages?.playbookRuns || 0}
              />
            )}

            {/* Seats */}
            {summary.plan && (
              <UsageBar
                label="Team Seats"
                used={summary.seatsUsed}
                limit={summary.plan.includedSeats}
                unit="seats"
                overage={summary.overages?.seats || 0}
              />
            )}
          </div>

          {/* Recommended Plan Badge */}
          {summary.recommendedPlanSlug && summary.recommendedPlanSlug !== summary.plan?.slug && (
            <div className="mb-4">
              <PlanRecommendationBadge recommendedPlanSlug={summary.recommendedPlanSlug} />
            </div>
          )}

          {/* Projected Cost */}
          {summary.projectedMonthlyCost !== null && summary.projectedMonthlyCost !== undefined && (
            <div className="pt-4 border-t border-border-subtle">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted">Projected Monthly Cost</span>
                <span className="text-lg font-bold text-white-0">
                  {formatCurrency(summary.projectedMonthlyCost)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overage Breakdown */}
      {summary.overages && summary.overages.estimatedCost > 0 && summary.plan && (
        <div className="mb-8">
          <OverageBreakdown
            overages={summary.overages}
            overageRates={{
              tokens: summary.plan.overageTokenPriceMilliCents,
              playbookRuns: summary.plan.overagePlaybookRunPriceCents,
              seats: 0 // TODO: Add seat overage rate to plan if needed
            }}
          />
        </div>
      )}

      {/* Plan Selection Grid */}
      <div id="plan-selection" className="mb-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white-0 mb-2">Available Plans</h2>
          <p className="text-muted">Choose the plan that best fits your needs</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map(plan => (
            <BillingPlanCard
              key={plan.id}
              plan={plan}
              isCurrentPlan={summary.plan?.id === plan.id}
              isRecommended={summary.recommendedPlanSlug === plan.slug}
              currentSummary={summary}
              onUpgrade={handleUpgrade}
              onDowngrade={handleDowngrade}
              onContactSales={() => {
                alert('Contact sales at sales@pravado.com for Enterprise pricing');
              }}
            />
          ))}
        </div>
      </div>

      {/* Billing History CTA */}
      <div className="mb-8">
        <div className="panel-card p-6 text-center">
          <h3 className="text-lg font-semibold text-white-0 mb-2">Billing History</h3>
          <p className="text-muted mb-4">View past invoices and payment history</p>
          <Link
            href="/app/billing/history"
            className="btn-primary inline-block"
          >
            View Invoices
          </Link>
        </div>
      </div>

      {/* Modals */}
      <CancelSubscriptionModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancelSubscription}
        renewalDate={summary.nextBillingDate || undefined}
      />

      <DowngradeBlockedDialog
        isOpen={showDowngradeDialog}
        onClose={() => setShowDowngradeDialog(false)}
        targetPlan={blockedDowngradePlan}
        currentSummary={summary}
        errorMessage={downgradeError}
      />
    </div>
  );
}
