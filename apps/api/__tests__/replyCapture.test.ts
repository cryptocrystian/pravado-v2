/**
 * Reply-capture pure-helper tests (token, Message-ID, auto-responder filter).
 */

import { describe, it, expect } from 'vitest';

import {
  parseTokenFromRecipients,
  extractMessageId,
  isAutoResponder,
  generateReplyToken,
  replyAddressFor,
  REPLY_DOMAIN,
} from '../src/services/pr/replyCapture';

describe('reply token', () => {
  it('generates a hex token usable as an email local-part', () => {
    const t = generateReplyToken();
    expect(t).toMatch(/^[a-f0-9]{32}$/);
    expect(replyAddressFor(t)).toBe(`${t}@${REPLY_DOMAIN}`);
  });

  it('extracts the token from a To field with display names / multiple addrs', () => {
    const t = 'a'.repeat(32);
    expect(parseTokenFromRecipients(`"Pravado" <${t}@reply.pravado.io>`)).toBe(
      t
    );
    expect(
      parseTokenFromRecipients(`someone@x.com, ${t}@reply.pravado.io`)
    ).toBe(t);
    expect(parseTokenFromRecipients('nobody@elsewhere.com')).toBeNull();
    expect(parseTokenFromRecipients(undefined)).toBeNull();
  });
});

describe('extractMessageId', () => {
  it('pulls the Message-ID header out of the raw headers field', () => {
    const headers =
      'From: a@b.com\r\nMessage-ID: <abc123@mail.times.com>\r\nSubject: hi';
    expect(extractMessageId(headers)).toBe('<abc123@mail.times.com>');
    expect(extractMessageId(undefined)).toBeNull();
  });
});

describe('isAutoResponder', () => {
  it('flags bounces / auto-replies / vacation, passes a genuine reply', () => {
    expect(isAutoResponder({ from: 'mailer-daemon@times.com' })).toBe(true);
    expect(isAutoResponder({ from: 'noreply@times.com' })).toBe(true);
    expect(isAutoResponder({ from: '' })).toBe(true);
    expect(
      isAutoResponder({
        from: 'jane@times.com',
        headers: 'Auto-Submitted: auto-replied',
      })
    ).toBe(true);
    expect(
      isAutoResponder({ from: 'jane@times.com', headers: 'Precedence: bulk' })
    ).toBe(true);
    expect(
      isAutoResponder({
        from: 'Jane Doe <jane@times.com>',
        headers: 'Subject: Re: your pitch',
      })
    ).toBe(false);
  });
});
