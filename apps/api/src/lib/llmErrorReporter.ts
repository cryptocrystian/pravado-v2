/**
 * LLM error reporter (Sprint: LLM model env-wiring hotfix)
 *
 * Bridges the provider-agnostic LlmRouter (in @pravado/utils, which stays free
 * of a Sentry dependency) to this app's Sentry client. Injected into LlmRouter
 * via the `errorReporter` config hook. Fires on stub-fallback so a degraded LLM
 * path raises an alert instead of silently masquerading as healthy.
 *
 * Sentry dedup: the fingerprint groups identical failures by
 * (provider, error_code, org_id) so a storm of the same failure is one issue,
 * not thousands — first occurrence per group in the alerting window fires.
 */
import type { LlmErrorContext } from '@pravado/utils';
import * as Sentry from '@sentry/node';

export function reportLlmFallback(err: Error, context: LlmErrorContext): void {
  Sentry.captureException(err, {
    tags: {
      provider: context.provider,
      model: context.model,
      error_code: context.error_code,
      http_status:
        context.http_status != null ? String(context.http_status) : 'none',
      org_id: context.org_id ?? 'unknown',
      phase: context.phase,
    },
    extra: {
      error_message: context.error_message,
    },
    fingerprint: [
      'llm_fallback',
      context.provider,
      context.error_code,
      context.org_id ?? 'unknown',
    ],
  });
}
