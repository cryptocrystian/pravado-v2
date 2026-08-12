/**
 * Minimal multipart/form-data field extractor for SendGrid Inbound Parse.
 *
 * SendGrid Inbound Parse (send_raw=false) POSTs the parsed email as
 * multipart/form-data text parts — `to`, `from`, `subject`, `text`, `html`,
 * `headers`, `envelope`, `charsets`, `SPF`, `dkim`, `spam_score`, … — plus any
 * attachments as binary parts. We only need the named TEXT fields, so this
 * returns `{ fieldName: value }` and skips attachment/file parts.
 *
 * Intentionally dependency-free (no @fastify/multipart / busboy): the format
 * SendGrid emits is simple named text parts, and keeping it inline avoids adding
 * a new body-parsing plugin to the critical API server. This is NOT a general,
 * RFC-complete multipart parser — it is scoped to SendGrid's shape.
 */

/** Extract the boundary token from a `multipart/form-data; boundary=...` header. */
export function extractBoundary(
  contentType: string | undefined
): string | null {
  if (!contentType) return null;
  const m = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  const b = (m?.[1] ?? m?.[2])?.trim();
  return b || null;
}

export function parseMultipartFields(
  body: Buffer,
  contentType: string | undefined
): Record<string, string> {
  const boundary = extractBoundary(contentType);
  const fields: Record<string, string> = {};
  if (!boundary) return fields;

  const raw = body.toString('utf8');
  const segments = raw.split(`--${boundary}`);

  for (const segment of segments) {
    // Strip the leading CRLF that follows each boundary delimiter. Skip the
    // preamble, the closing `--`, and empty segments.
    const part = segment.replace(/^\r?\n/, '');
    if (!part || part === '--' || part.replace(/\r?\n/g, '') === '--') continue;

    // Separate the part headers from the part body on the first blank line.
    let sep = part.indexOf('\r\n\r\n');
    let sepLen = 4;
    if (sep === -1) {
      sep = part.indexOf('\n\n');
      sepLen = 2;
    }
    if (sep === -1) continue;

    const headerBlock = part.slice(0, sep);
    // The value ends just before the trailing CRLF preceding the next boundary.
    const value = part.slice(sep + sepLen).replace(/\r?\n$/, '');

    const disposition =
      /content-disposition:[^\r\n]*/i.exec(headerBlock)?.[0] ?? '';
    // Skip attachments / file parts — Phase 1 does not ingest them.
    if (/filename=/i.test(disposition)) continue;

    const nameMatch = /name=(?:"([^"]*)"|([^;\r\n]+))/i.exec(disposition);
    const name = (nameMatch?.[1] ?? nameMatch?.[2])?.trim();
    if (!name) continue;

    fields[name] = value;
  }

  return fields;
}
