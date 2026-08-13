/**
 * Resend outbound provider tests (via the deliverability service).
 * Verifies the Resend send payload: from-line, native reply_to (our tokenized
 * reply-to), correlation tags, and failure handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { createOutreachDeliverabilityService } from '../src/services/outreachDeliverabilityService';

describe('ResendEmailProvider', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  function svc() {
    return createOutreachDeliverabilityService({
      // sendEmail only touches the provider, not the db.
      supabase: {} as never,
      providerConfig: {
        provider: 'resend',
        apiKey: 're_test',
        fromEmail: 'outreach@pravado.io',
        fromName: 'Pravado',
      },
    });
  }

  it('POSTs to Resend with from-line, reply_to and correlation tags', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 're_abc123' }),
    });

    const res = await svc().sendEmail({
      to: 'jane@times.com',
      subject: 'Hi',
      bodyHtml: '<p>hi</p>',
      bodyText: 'hi',
      fromName: 'Acme Corp',
      replyTo: { email: 'tok@reply.pravado.io' },
      metadata: { orgId: 'org-1', runId: 'run-1', journalistId: 'j-1' },
    });

    expect(res.success).toBe(true);
    expect(res.messageId).toBe('re_abc123');
    expect(res.provider).toBe('resend');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    expect((opts.headers as Record<string, string>).Authorization).toBe(
      'Bearer re_test'
    );
    const body = JSON.parse(opts.body as string);
    expect(body.from).toBe('Acme Corp <outreach@pravado.io>'); // per-customer display name
    expect(body.to).toEqual(['jane@times.com']);
    expect(body.reply_to).toBe('tok@reply.pravado.io'); // native reply-to
    expect(body.tags).toEqual(
      expect.arrayContaining([
        { name: 'orgId', value: 'org-1' },
        { name: 'runId', value: 'run-1' },
        { name: 'journalistId', value: 'j-1' },
      ])
    );
  });

  it('returns a failure result on a non-2xx Resend response', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'unauthorized' }),
    });
    const res = await svc().sendEmail({
      to: 'a@b.com',
      subject: 's',
      bodyHtml: 'h',
      bodyText: 't',
    });
    expect(res.success).toBe(false);
    expect(res.provider).toBe('resend');
    expect(res.messageId).toBeNull();
  });
});
