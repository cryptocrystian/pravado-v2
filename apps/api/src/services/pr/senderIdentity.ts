/**
 * Per-customer outreach sender identity (multi-tenant PR).
 *
 * The From EMAIL always stays the provider-authenticated platform address
 * (ProviderConfig.fromEmail) so DKIM/SPF/DMARC hold — you cannot send as an
 * arbitrary customer domain without authenticating it. What varies per customer:
 *   - fromName: the display name on the From line (the brand / org).
 *   - replyTo:  where journalist replies land (the customer's real mailbox).
 *
 * Resolution precedence:
 *   fromName = orgs.metadata.outreach_from_name → orgs.name
 *   replyTo  = actingUser.email (the human approver — the launch path, since
 *              Autopilot is off and every real send has a human) →
 *              orgs.metadata.outreach_reply_to
 *
 * Best-effort ONLY: identity resolution must NEVER block or fail a governed
 * send. Any error returns an empty identity and the send proceeds with the
 * platform-default from-name and no reply-to.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export interface ResolvedSenderIdentity {
  /** Display name for the From line; falls back to ProviderConfig.fromName downstream. */
  fromName?: string;
  /** Reply-To (customer mailbox); omitted when neither an acting user nor a configured address exists. */
  replyTo?: { email: string; name?: string };
}

export interface ActingUser {
  id?: string;
  email?: string;
  name?: string;
}

const cleanStr = (v: unknown): string | undefined =>
  typeof v === 'string' && v.trim() ? v.trim() : undefined;

export async function resolveSenderIdentity(
  supabase: SupabaseClient,
  orgId: string,
  actingUser?: ActingUser
): Promise<ResolvedSenderIdentity> {
  try {
    const { data: org } = await supabase
      .from('orgs')
      .select('name, metadata')
      .eq('id', orgId)
      .maybeSingle();

    const meta = (org?.metadata ?? {}) as Record<string, unknown>;
    const fromName = cleanStr(meta.outreach_from_name) ?? cleanStr(org?.name);
    const replyEmail =
      cleanStr(actingUser?.email) ?? cleanStr(meta.outreach_reply_to);

    if (!replyEmail) {
      return { fromName };
    }
    const replyName = cleanStr(actingUser?.name) ?? fromName;
    return {
      fromName,
      replyTo: replyName
        ? { email: replyEmail, name: replyName }
        : { email: replyEmail },
    };
  } catch {
    // Identity is best-effort; never block a governed send on it.
    return {};
  }
}
