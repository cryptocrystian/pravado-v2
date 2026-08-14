/**
 * Tests for the provider-agnostic inbound-reply core (processInboundReply),
 * shared by the SendGrid Inbound Parse (legacy) and Resend inbound routes.
 */

import { describe, it, expect, vi } from 'vitest';

import {
  processInboundReply,
  type InboundReplyDeps,
  type ReplyTokenRow,
} from '../src/services/pr/replyCapture';

const tokenRow: ReplyTokenRow = {
  id: 'tok-1',
  org_id: 'org-1',
  token: 'a'.repeat(32),
  journalist_id: 'jour-1',
  run_id: 'run-1',
  message_id: 'msg-out-1',
  proposal_id: null,
  forward_to: 'customer@acme.com',
  subject: 'Following your coverage',
};

/**
 * Minimal chainable Supabase stub. Chain methods return the builder; terminal
 * methods (maybeSingle / insert) resolve. Captures the effects the core cares
 * about: the inserted reply, whether the run was marked replied, and whether the
 * forwarded_at stamp was written.
 */
function makeSupabase(
  opts: { existingReply?: unknown; insertError?: unknown } = {}
) {
  const captured = {
    inserts: [] as Array<{ table: string; row: Record<string, unknown> }>,
    runReplied: false,
    forwardedStamped: false,
  };
  const from = (table: string) => {
    const builder: Record<string, unknown> = {};
    Object.assign(builder, {
      select: () => builder,
      eq: () => builder,
      is: () => Promise.resolve({ error: null }),
      maybeSingle: () => Promise.resolve({ data: opts.existingReply ?? null }),
      insert: (row: Record<string, unknown>) => {
        captured.inserts.push({ table, row });
        return Promise.resolve({ error: opts.insertError ?? null });
      },
      update: (patch: Record<string, unknown>) => {
        if (patch.replied_at) captured.runReplied = true;
        if (patch.forwarded_at) captured.forwardedStamped = true;
        return builder;
      },
    });
    return builder;
  };
  return { supabase: { from } as never, captured };
}

function makeDeps(supabase: never) {
  const sendMail = vi.fn().mockResolvedValue(undefined);
  const updateEngagement = vi.fn().mockResolvedValue(undefined);
  const deps: InboundReplyDeps = {
    supabase,
    sendMail,
    updateEngagement,
    logWarn: () => {},
  };
  return { deps, sendMail, updateEngagement };
}

describe('processInboundReply', () => {
  it('captures a genuine reply: stores, marks run replied, scores, forwards', async () => {
    const { supabase, captured } = makeSupabase();
    const { deps, sendMail, updateEngagement } = makeDeps(supabase);

    const result = await processInboundReply(deps, {
      tokenRow,
      fromEmail: 'Jane Doe <jane@times.com>',
      subject: 'Re: Following your coverage',
      bodyText: 'Sure, send me more.',
      bodyHtml: '<p>Sure, send me more.</p>',
      headersRaw: 'Subject: Re: Following your coverage',
      inboundMessageId: '<reply-1@mail.times.com>',
    });

    expect(result).toEqual({ processed: true, forwarded: true });
    expect(
      captured.inserts.some((i) => i.table === 'pr_outreach_inbound_replies')
    ).toBe(true);
    expect(captured.runReplied).toBe(true);
    expect(captured.forwardedStamped).toBe(true);
    expect(updateEngagement).toHaveBeenCalledWith('jour-1', 'org-1');
    expect(sendMail).toHaveBeenCalledTimes(1);
    const msg = sendMail.mock.calls[0][0];
    expect(msg.to).toBe('customer@acme.com');
    expect(msg.html).toContain('jane@times.com');
    expect(msg.text).toContain('Sure, send me more.');
  });

  it('skips auto-responders: no store, no forward', async () => {
    const { supabase, captured } = makeSupabase();
    const { deps, sendMail, updateEngagement } = makeDeps(supabase);

    const result = await processInboundReply(deps, {
      tokenRow,
      fromEmail: 'mailer-daemon@times.com',
      subject: 'Delivery Status Notification',
      bodyText: 'undeliverable',
      bodyHtml: null,
      headersRaw: 'Auto-Submitted: auto-replied',
      inboundMessageId: '<bounce-1@times.com>',
    });

    expect(result).toEqual({ processed: false, reason: 'auto_responder' });
    expect(captured.inserts).toHaveLength(0);
    expect(sendMail).not.toHaveBeenCalled();
    expect(updateEngagement).not.toHaveBeenCalled();
  });

  it('dedupes on Message-ID: a re-delivered reply is not re-processed', async () => {
    const { supabase, captured } = makeSupabase({
      existingReply: { id: 'existing' },
    });
    const { deps, sendMail } = makeDeps(supabase);

    const result = await processInboundReply(deps, {
      tokenRow,
      fromEmail: 'jane@times.com',
      subject: 'Re: hi',
      bodyText: 'again',
      bodyHtml: null,
      headersRaw: '',
      inboundMessageId: '<reply-1@mail.times.com>',
    });

    expect(result).toEqual({ processed: false, reason: 'duplicate' });
    expect(captured.inserts).toHaveLength(0);
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('captures + scores even when the customer has no forward inbox', async () => {
    const { supabase, captured } = makeSupabase();
    const { deps, sendMail } = makeDeps(supabase);

    const result = await processInboundReply(deps, {
      tokenRow: { ...tokenRow, forward_to: null },
      fromEmail: 'jane@times.com',
      subject: 'Re: hi',
      bodyText: 'interested',
      bodyHtml: null,
      headersRaw: '',
      inboundMessageId: '<reply-2@mail.times.com>',
    });

    expect(result).toEqual({ processed: true, forwarded: false });
    expect(captured.inserts).toHaveLength(1);
    expect(captured.runReplied).toBe(true);
    expect(sendMail).not.toHaveBeenCalled();
  });
});
