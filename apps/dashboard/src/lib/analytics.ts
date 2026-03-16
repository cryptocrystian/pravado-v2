/**
 * Product Analytics — Typed Event Tracking (Sprint S-INT-08)
 *
 * Typed wrapper around PostHog to prevent typos and enforce consistency.
 * All tracked events are defined here as constants.
 */

import posthog from 'posthog-js';

// ============================================================================
// Event Definitions
// ============================================================================

export const Events = {
  // Onboarding
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP_SKIPPED: 'onboarding_step_skipped',
  GSC_CONNECTED: 'gsc_connected',

  // Command Center
  SAGE_PROPOSAL_VIEWED: 'sage_proposal_viewed',
  SAGE_PROPOSAL_CLICKED: 'sage_proposal_clicked',
  SAGE_PROPOSAL_DISMISSED: 'sage_proposal_dismissed',

  // Content
  CONTENT_ITEM_CREATED: 'content_item_created',
  CONTENT_CITEMIND_SCORED: 'content_citemind_scored',
  CONTENT_PUBLISHED: 'content_published',
  CONTENT_PUBLISH_BLOCKED: 'content_publish_blocked',

  // PR
  PITCH_SENT: 'pitch_sent',
  JOURNALIST_ENRICHED: 'journalist_enriched',

  // SEO
  KEYWORD_ADDED: 'keyword_added',

  // EVI
  EVI_SCORE_VIEWED: 'evi_score_viewed',

  // Billing
  UPGRADE_CLICKED: 'upgrade_clicked',
  PLAN_SELECTED: 'plan_selected',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

// ============================================================================
// Track Function
// ============================================================================

/**
 * Track a product analytics event.
 * No-ops if PostHog is not initialized.
 */
export function track(event: EventName, properties?: Record<string, unknown>) {
  try {
    posthog.capture(event, properties);
  } catch {
    // Silently fail if PostHog is not loaded
  }
}

// ============================================================================
// Identity
// ============================================================================

/**
 * Identify a user in PostHog after login.
 */
export function identifyUser(userId: string, traits?: Record<string, unknown>) {
  try {
    posthog.identify(userId, traits);
  } catch {
    // Silently fail
  }
}

/**
 * Reset PostHog identity on logout.
 */
export function resetIdentity() {
  try {
    posthog.reset();
  } catch {
    // Silently fail
  }
}
