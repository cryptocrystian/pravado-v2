/**
 * Multipart field extractor tests — the SendGrid Inbound Parse body shape.
 */

import { describe, it, expect } from 'vitest';

import {
  extractBoundary,
  parseMultipartFields,
} from '../src/lib/parseMultipartFields';

const B = 'xYzBoundary123';

function part(name: string, value: string, extraHeaders = ''): string {
  return `--${B}\r\nContent-Disposition: form-data; name="${name}"${extraHeaders}\r\n\r\n${value}\r\n`;
}
function build(parts: string[]): Buffer {
  return Buffer.from(parts.join('') + `--${B}--\r\n`, 'utf8');
}

describe('extractBoundary', () => {
  it('reads the boundary token (quoted or bare) or null', () => {
    expect(extractBoundary(`multipart/form-data; boundary=${B}`)).toBe(B);
    expect(extractBoundary(`multipart/form-data; boundary="${B}"`)).toBe(B);
    expect(extractBoundary(undefined)).toBeNull();
    expect(extractBoundary('application/json')).toBeNull();
  });
});

describe('parseMultipartFields', () => {
  const ct = `multipart/form-data; boundary=${B}`;

  it('parses SendGrid-style text fields (incl. bodies with blank lines)', () => {
    const body = build([
      part('to', 'a1b2c3@reply.pravado.io'),
      part('from', 'Jane Doe <jane@times.com>'),
      part('subject', 'Re: your pitch'),
      part('text', 'Sounds good.\n\nBest,\nJane'),
      part('html', '<p>Sounds good.</p>'),
    ]);
    const f = parseMultipartFields(body, ct);
    expect(f.to).toBe('a1b2c3@reply.pravado.io');
    expect(f.from).toBe('Jane Doe <jane@times.com>');
    expect(f.subject).toBe('Re: your pitch');
    expect(f.text).toBe('Sounds good.\n\nBest,\nJane');
    expect(f.html).toBe('<p>Sounds good.</p>');
  });

  it('skips attachment/file parts', () => {
    const body = build([
      part('subject', 'hi'),
      `--${B}\r\nContent-Disposition: form-data; name="attachment1"; filename="x.pdf"\r\nContent-Type: application/pdf\r\n\r\n%PDF-bytes\r\n`,
    ]);
    const f = parseMultipartFields(body, ct);
    expect(f.subject).toBe('hi');
    expect(f.attachment1).toBeUndefined();
  });

  it('returns {} without a boundary', () => {
    expect(parseMultipartFields(Buffer.from('x'), 'application/json')).toEqual(
      {}
    );
  });
});
