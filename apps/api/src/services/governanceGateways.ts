/**
 * Supabase-backed implementation of the send-chokepoint GovernanceGateways.
 *
 * Lane B+C. Reads the authoritative contact_state from the NEW firewall tables
 * (media_contacts / contact_emails / contact_state_transitions from migrations
 * 102-103), with a DUAL-READ fallback to the legacy `journalists` table so
 * existing send flows keep working while the 784K-row backfill is staged.
 *
 * Dual-read policy (documented, intentional):
 *   - If a media_contacts row exists for the contact/email, its contact_state
 *     is AUTHORITATIVE (suppression + eligibility come from the firewall).
 *   - If no media_contacts row exists yet (pre-backfill / not-yet-migrated),
 *     fall back to legacy behavior: a legacy journalist WITH an email is
 *     treated as provisionally `pitch_eligible`. This preserves today's
 *     behavior (which has NO suppression at all) without regressing, and the
 *     firewall wins automatically once the contact is migrated.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { hashEmail } from './emailSuppression';
import type {
  ContactGovernanceState,
  ContactState,
  GovernanceGateways,
  GuardedSendContext,
  PlanTier,
} from './sendGuardedEmail';

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function sevenDaysAgoIso(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function createSupabaseGovernanceGateways(
  supabase: SupabaseClient
): GovernanceGateways {
  return {
    async getContactGovernanceState(
      ctx: GuardedSendContext
    ): Promise<ContactGovernanceState> {
      let contactId = ctx.contactId ?? null;

      // FAIL CLOSED (CAN-SPAM): on ANY read error we must NOT grant
      // eligibility. We return a blocking snapshot with readError=true so the
      // chokepoint refuses the send rather than defaulting to pitch_eligible.
      const failClosed = (): ContactGovernanceState => ({
        contactId,
        state: null,
        orgDoNotContact: false,
        readError: true,
      });

      // 0. Durable, backfill-INDEPENDENT suppression: check the opt-out/bounce
      //    hash store first. This blocks even when no contact row exists yet
      //    (opt-outs received before the 784K backfill). Canon §12.3.
      if (ctx.recipientEmail) {
        const { data: hashRow, error: hashErr } = await supabase
          .from('suppressed_email_hashes')
          .select('email_hash, reason')
          .eq('email_hash', hashEmail(ctx.recipientEmail))
          .maybeSingle();
        if (hashErr) return failClosed();
        if (hashRow) {
          const state: ContactState =
            hashRow.reason === 'bounce' ? 'bounced' : 'suppressed';
          return { contactId, state, orgDoNotContact: false };
        }
      }

      let state: ContactState | null = null;

      // 1. Resolve contactId from the email firewall when not supplied.
      if (!contactId && ctx.recipientEmail) {
        const { data: emailRow, error } = await supabase
          .from('contact_emails')
          .select('contact_id')
          .ilike('email', ctx.recipientEmail)
          .limit(1)
          .maybeSingle();
        if (error) return failClosed();
        if (emailRow?.contact_id) contactId = emailRow.contact_id;
      }

      // 2. Authoritative read from media_contacts.
      if (contactId) {
        const { data: mc, error } = await supabase
          .from('media_contacts')
          .select('id, contact_state')
          .eq('id', contactId)
          .maybeSingle();
        if (error) return failClosed();
        if (mc) {
          state = mc.contact_state as ContactState;
        }
      }

      // 3. Dual-read fallback: no firewall row -> legacy journalists table.
      if (state === null) {
        let legacyEmail: string | null = null;
        if (ctx.journalistId) {
          const { data: j, error } = await supabase
            .from('journalists')
            .select('email')
            .eq('id', ctx.journalistId)
            .maybeSingle();
          if (error) return failClosed();
          legacyEmail = j?.email ?? null;
        }
        if (!legacyEmail && ctx.recipientEmail)
          legacyEmail = ctx.recipientEmail;
        // Provisional legacy eligibility: a resolvable email => pitch_eligible.
        state = legacyEmail ? 'pitch_eligible' : null;
      }

      const orgDoNotContact = await isOrgDoNotContact(
        supabase,
        ctx.orgId,
        contactId
      );

      return { contactId, state, orgDoNotContact };
    },

    async getOrgTier(orgId: string): Promise<PlanTier> {
      // orgs.plan_id -> billing_plans.slug. Default to the MOST restrictive
      // tier (starter) on any ambiguity — fail-safe for send caps.
      try {
        const { data: org } = await supabase
          .from('orgs')
          .select('plan_id')
          .eq('id', orgId)
          .maybeSingle();
        if (!org?.plan_id) return 'starter';
        const { data: plan } = await supabase
          .from('billing_plans')
          .select('slug')
          .eq('id', org.plan_id)
          .maybeSingle();
        return normalizeTier(plan?.slug);
      } catch {
        return 'starter';
      }
    },

    async countPitchesSentToday(orgId: string): Promise<number> {
      const { count } = await supabase
        .from('pr_outreach_email_messages')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', startOfTodayIso());
      return count ?? 0;
    },

    async countActiveSequences(orgId: string): Promise<number> {
      const { count } = await supabase
        .from('pr_outreach_runs')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('status', 'running');
      return count ?? 0;
    },

    async countFollowUpsLast7Days(
      orgId: string,
      keys: {
        contactId: string | null;
        journalistId?: string | null;
        email: string;
      }
    ): Promise<number> {
      // pr_outreach_email_messages is keyed on legacy journalist_id.
      if (!keys.journalistId) return 0;
      const { count } = await supabase
        .from('pr_outreach_email_messages')
        .select('id', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('journalist_id', keys.journalistId)
        .gte('created_at', sevenDaysAgoIso());
      return count ?? 0;
    },

    async recordStateTransition(input): Promise<void> {
      // Best-effort dual write: append audit row AND move the canonical state
      // (unless it's a no-op "blocked attempt" record where from === to).
      await supabase.from('contact_state_transitions').insert({
        contact_id: input.contactId,
        from_state: input.fromState,
        to_state: input.toState,
        trigger: input.trigger,
        actor_type: input.actorType,
        actor_id: input.actorId ?? null,
        org_id: input.orgId ?? null,
      });
      if (input.fromState !== input.toState) {
        await supabase
          .from('media_contacts')
          .update({ contact_state: input.toState })
          .eq('id', input.contactId);
      }
    },
  };
}

/**
 * Org-scoped do_not_contact (canon §6.3 / §9.1 — org_contact_tags).
 * org_contact_tags is NOT created in this PR; this is written forward-compatibly:
 * it queries the table and treats absence/error as "no do_not_contact" so the
 * LEGAL blocker (global suppression, fully live) is unaffected, while the
 * org-scoped reversible flag activates automatically once its table lands.
 */
async function isOrgDoNotContact(
  supabase: SupabaseClient,
  orgId: string,
  contactId: string | null
): Promise<boolean> {
  if (!contactId) return false;
  try {
    const { data, error } = await supabase
      .from('org_contact_tags')
      .select('id')
      .eq('org_id', orgId)
      .eq('contact_id', contactId)
      .eq('do_not_contact', true)
      .limit(1)
      .maybeSingle();
    if (error) return false; // table absent / not yet built
    return !!data;
  } catch {
    return false;
  }
}

function normalizeTier(slug?: string | null): PlanTier {
  switch ((slug ?? '').toLowerCase()) {
    case 'enterprise':
      return 'enterprise';
    case 'pro':
    case 'growth':
    case 'professional':
      return 'pro';
    default:
      return 'starter';
  }
}
