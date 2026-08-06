/**
 * Opt-out / bounce webhook intake tests (Lane B).
 *
 * Verifies that provider webhooks drive the contact state machine:
 *   complaint / unsubscribe -> [any] -> 'suppressed' (trigger 'opt_out')
 *   hard bounce             -> [any] -> 'bounced'    (trigger 'bounce')
 * and that each writes a contact_state_transitions audit row + advances
 * media_contacts.contact_state.
 *
 * Previously these events only touched the message send_status and the
 * contact was never suppressed — this test locks in the fix.
 */

import type { ProviderConfig } from '@pravado/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, vi } from 'vitest';

import { createOutreachDeliverabilityService } from '../src/services/outreachDeliverabilityService';

const ORG = 'org-1';
const CONTACT = 'contact-1';
const EMAIL = 'sarah@techcrunch.com';

function messageRow() {
  const now = new Date().toISOString();
  return {
    id: 'em-1',
    org_id: ORG,
    run_id: null,
    sequence_id: null,
    step_number: null,
    journalist_id: 'journ-1',
    subject: 'hi',
    body_html: '<p>hi</p>',
    body_text: 'hi',
    provider_message_id: 'pm-1',
    send_status: 'sent',
    sent_at: now,
    delivered_at: null,
    opened_at: null,
    clicked_at: null,
    bounced_at: null,
    complained_at: null,
    raw_event: {},
    metadata: {},
    created_at: now,
    updated_at: now,
  };
}

/** Table-aware chainable Supabase mock that records inserts + updates. */
function createMock(currentContactState = 'pitch_eligible', hasContact = true) {
  const inserts: Record<string, any[]> = {};
  const updates: Record<string, any[]> = {};
  const upserts: Record<string, any[]> = {};

  const responders: Record<string, () => { data: any; error: any }> = {
    'pr_outreach_email_messages:select': () => ({
      data: messageRow(),
      error: null,
    }),
    'contact_emails:select': () => ({
      data: hasContact ? { contact_id: CONTACT } : null,
      error: null,
    }),
    'media_contacts:select': () => ({
      data: { contact_state: currentContactState },
      error: null,
    }),
    'pr_outreach_engagement_metrics:select': () => ({
      data: null,
      error: null,
    }),
  };

  function builder(table: string) {
    let op = 'select';
    const b: any = {};
    for (const m of [
      'select',
      'eq',
      'ilike',
      'limit',
      'order',
      'gte',
      'lte',
      'neq',
      'in',
      'is',
    ]) {
      b[m] = vi.fn(() => {
        if (m === 'select') op = 'select';
        return b;
      });
    }
    b.insert = vi.fn((payload: any) => {
      op = 'insert';
      (inserts[table] ||= []).push(payload);
      return b;
    });
    b.upsert = vi.fn((payload: any) => {
      op = 'upsert';
      (upserts[table] ||= []).push(payload);
      return b;
    });
    b.update = vi.fn((payload: any) => {
      op = 'update';
      (updates[table] ||= []).push(payload);
      return b;
    });
    b.delete = vi.fn(() => {
      op = 'delete';
      return b;
    });
    const term = () =>
      Promise.resolve(
        responders[`${table}:${op}`]?.() ?? { data: null, error: null }
      );
    b.single = vi.fn(term);
    b.maybeSingle = vi.fn(term);
    b.then = (resolve: any, reject: any) => term().then(resolve, reject);
    return b;
  }

  const supabase = {
    from: vi.fn((t: string) => builder(t)),
    rpc: vi.fn(async () => ({ data: null, error: null })),
  } as unknown as SupabaseClient;

  return { supabase, inserts, updates, upserts };
}

const stubConfig: ProviderConfig = {
  provider: 'stub',
  fromEmail: 'no@pravado.com',
  fromName: 'Pravado',
};

describe('webhook suppression intake', () => {
  it('drives a complaint/unsubscribe to suppressed with an audit row', async () => {
    const { supabase, inserts, updates, upserts } =
      createMock('pitch_eligible');
    const service = createOutreachDeliverabilityService({
      supabase,
      providerConfig: stubConfig,
    });

    const result = await service.processWebhookEvent(ORG, 'stub', {
      messageId: 'pm-1',
      eventType: 'complained',
      recipientEmail: EMAIL,
    });

    expect(result.success).toBe(true);
    // durable hash recorded first (backfill-independent)
    expect(upserts['suppressed_email_hashes']?.[0]).toMatchObject({
      reason: 'opt_out',
    });
    const transitions = inserts['contact_state_transitions'] ?? [];
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({
      contact_id: CONTACT,
      to_state: 'suppressed',
      trigger: 'opt_out',
      actor_type: 'journalist',
    });
    expect(updates['media_contacts']).toEqual([
      { contact_state: 'suppressed' },
    ]);
  });

  it('drives a hard bounce to bounced with an audit row', async () => {
    const { supabase, inserts, updates } = createMock('pitch_eligible');
    const service = createOutreachDeliverabilityService({
      supabase,
      providerConfig: stubConfig,
    });

    const result = await service.processWebhookEvent(ORG, 'stub', {
      messageId: 'pm-1',
      eventType: 'bounced',
      recipientEmail: EMAIL,
    });

    expect(result.success).toBe(true);
    const transitions = inserts['contact_state_transitions'] ?? [];
    expect(transitions).toHaveLength(1);
    expect(transitions[0]).toMatchObject({
      contact_id: CONTACT,
      to_state: 'bounced',
      trigger: 'bounce',
      actor_type: 'system',
    });
    expect(updates['media_contacts']).toEqual([{ contact_state: 'bounced' }]);
  });

  it('does not downgrade an already-suppressed contact on later bounce', async () => {
    const { supabase, inserts, updates } = createMock('suppressed');
    const service = createOutreachDeliverabilityService({
      supabase,
      providerConfig: stubConfig,
    });

    await service.processWebhookEvent(ORG, 'stub', {
      messageId: 'pm-1',
      eventType: 'bounced',
      recipientEmail: EMAIL,
    });

    // suppressed is terminal & irreversible — no transition, no state change.
    expect(inserts['contact_state_transitions']).toBeUndefined();
    expect(updates['media_contacts']).toBeUndefined();
  });

  it('persists an opt-out durably even when no contact row exists yet (pre-backfill)', async () => {
    const { supabase, inserts, updates, upserts } = createMock(
      'pitch_eligible',
      false
    );
    const service = createOutreachDeliverabilityService({
      supabase,
      providerConfig: stubConfig,
    });

    const result = await service.processWebhookEvent(ORG, 'stub', {
      messageId: 'pm-1',
      eventType: 'complained',
      recipientEmail: EMAIL,
    });

    expect(result.success).toBe(true);
    // The opt-out is NEVER lost: the hash is recorded even with no contact.
    expect(upserts['suppressed_email_hashes']?.[0]).toMatchObject({
      reason: 'opt_out',
    });
    // No contact row -> no state transition (nothing to advance yet).
    expect(inserts['contact_state_transitions']).toBeUndefined();
    expect(updates['media_contacts']).toBeUndefined();
  });
});
