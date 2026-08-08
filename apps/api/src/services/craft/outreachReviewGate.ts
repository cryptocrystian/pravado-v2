/**
 * CRAFT Outreach Human-Review Gate (Wave-2 — Autopilot prerequisites / SAFETY FLOOR).
 *
 * Scaffolds the REQUIRED human review/approval state a `pr.send_pitch` must pass before
 * real external egress. Outreach is IRREVERSIBLE (CRAFT §4.2/§5.4 "Email/Outreach →
 * Irreversible → Manual") — a sent pitch cannot be un-sent — so canon's "No Silent
 * Automation" (§1.2) means a pitch must never reach the provider without a human having
 * reviewed the ACTUAL composed subject/body.
 *
 * TWO GATES BEFORE REAL SENDS (documented invariant):
 *   1. THIS review gate — a human must review-and-approve the composed pitch. Inert today
 *      because there is no approver UI wired yet; `requireOutreachReview` returns
 *      `review_required` for a real egress path so nothing can silently send.
 *   2. SendGrid provisioning — prod egress is a STUB (`EMAIL_PROVIDER` unset →
 *      resolveProviderConfig() returns the stub). Real sends are impossible until
 *      SendGrid is provisioned AND this gate is satisfied.
 *
 * While egress is a stub, this gate is INERT (a stub send is not real egress, so no review
 * is required to keep the current human-initiated stub flow working). The gate ACTIVATES —
 * blocking sends that lack an approval — the instant a real provider is configured. That
 * ordering guarantees the review requirement lands BEFORE the first real send is possible.
 *
 * CRITICAL: this does NOT enable autonomous sending. `AUTONOMOUS_AUTOPILOT_ENABLED` stays
 * false; the pitch executor remains human-initiated inside the CRAFT lifecycle.
 */

export type EmailEgressMode = 'stub' | 'real';

/**
 * Resolve whether prod egress is real (a provider is provisioned) or a stub. Mirrors
 * prSendPitchExecutor.resolveProviderConfig: anything other than an explicit real
 * provider is the stub.
 */
export function resolveEgressMode(
  provider: string | undefined = process.env.EMAIL_PROVIDER
): EmailEgressMode {
  return provider === 'sendgrid' || provider === 'mailgun' ? 'real' : 'stub';
}

export type OutreachReviewDecision =
  | {
      proceed: true;
      egress: EmailEgressMode;
      reason: 'stub_egress_no_review_required';
    }
  | { proceed: true; egress: 'real'; reason: 'review_approved' }
  | { proceed: false; egress: 'real'; reason: 'review_required' };

export interface OutreachReviewContext {
  /** Real vs stub egress. Defaults to the env-resolved mode. */
  egress?: EmailEgressMode;
  /**
   * Whether a human has recorded an approval of THIS composed pitch. Wired to a future
   * approver surface; while that surface does not exist this is always false, so any real
   * egress path is blocked pending review — fail-closed.
   */
  humanReviewApproved?: boolean;
}

/**
 * The gate. For a STUB egress path it is a no-op (proceed) — the current human-initiated
 * stub flow is preserved. For a REAL egress path it REQUIRES a recorded human approval;
 * without one it returns `review_required` and the caller must NOT send. Fail-closed by
 * construction: the only way to send for real is `egress: 'real' && humanReviewApproved`.
 */
export function requireOutreachReview(
  ctx: OutreachReviewContext = {}
): OutreachReviewDecision {
  const egress = ctx.egress ?? resolveEgressMode();

  if (egress === 'stub') {
    return {
      proceed: true,
      egress,
      reason: 'stub_egress_no_review_required',
    };
  }

  if (ctx.humanReviewApproved) {
    return { proceed: true, egress: 'real', reason: 'review_approved' };
  }

  return { proceed: false, egress: 'real', reason: 'review_required' };
}
