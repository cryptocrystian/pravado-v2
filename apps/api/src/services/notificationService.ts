/**
 * Notification Service (Sprint S32 - Stub Implementation)
 *
 * Stub implementation for billing usage alert notifications.
 * Full email/SMS/push notification implementation will arrive in a future sprint.
 *
 * For S32, all methods are logging-only to demonstrate integration points.
 */

import type { BillingAlertRecord } from '@pravado/types';
import { createLogger } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

const logger = createLogger('notification-service');

/**
 * NotificationService
 *
 * Handles sending notifications for billing usage alerts.
 * Current implementation is stub-only (logging) for S32.
 *
 * Note: Accepts SupabaseClient in constructor for future use,
 * but current stub implementation only logs to console.
 */
export class NotificationService {
  constructor(_supabase: SupabaseClient) {
    // SupabaseClient will be used in future implementation for email/SMS delivery
  }

  /**
   * Send org alert email
   *
   * Sends an email notification for a billing usage alert.
   * (Stub implementation - logs only for S32)
   *
   * @param orgId - Organization ID
   * @param alertRecord - Alert record to send notification for
   */
  async sendOrgAlertEmail(orgId: string, alertRecord: BillingAlertRecord): Promise<void> {
    logger.info('Dispatching org alert email', {
      orgId,
      alertId: alertRecord.id,
      alertType: alertRecord.alertType,
      severity: alertRecord.severity,
      message: alertRecord.message,
    });

    // TODO: Future implementation will:
    // - Fetch org owner email from database
    // - Render email template with alert details
    // - Send via SendGrid/AWS SES
    // - Track delivery status
  }

  /**
   * Send trial expiring notice
   *
   * Sends a notification when trial is expiring soon.
   * (Stub implementation - logs only for S32)
   *
   * @param orgId - Organization ID
   * @param daysRemaining - Number of days remaining in trial
   * @param trialEndsAt - ISO timestamp when trial ends
   */
  async sendTrialExpiringNotice(
    orgId: string,
    daysRemaining: number,
    trialEndsAt: string
  ): Promise<void> {
    logger.info('Dispatching trial expiring notice', {
      orgId,
      daysRemaining,
      trialEndsAt,
    });

    // TODO: Future implementation will:
    // - Fetch org owner and admin emails
    // - Render trial expiring email template
    // - Include upgrade CTA and pricing info
    // - Send multi-channel (email + in-app)
  }

  /**
   * Send overage incurred notice
   *
   * Sends a notification when usage exceeds plan limits.
   * (Stub implementation - logs only for S32)
   *
   * @param orgId - Organization ID
   * @param metricType - Type of metric that exceeded (tokens, playbook_runs, seats)
   * @param overageAmount - Amount exceeded beyond limit
   * @param estimatedCost - Estimated cost of overage in cents
   */
  async sendOverageIncurredNotice(
    orgId: string,
    metricType: 'tokens' | 'playbook_runs' | 'seats',
    overageAmount: number,
    estimatedCost: number
  ): Promise<void> {
    logger.info('Dispatching overage incurred notice', {
      orgId,
      metricType,
      overageAmount,
      estimatedCostCents: estimatedCost,
      estimatedCostUSD: (estimatedCost / 100).toFixed(2),
    });

    // TODO: Future implementation will:
    // - Fetch billing admin emails
    // - Render overage notice email with cost breakdown
    // - Include billing dashboard link
    // - Send immediate notification (high priority)
    // - Track notification delivery and opens
  }
}
