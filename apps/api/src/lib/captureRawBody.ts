/**
 * Hand-rolled raw-body capture, scoped per route.
 *
 * Replaces `fastify-raw-body` (Plan 06d). The plugin required Fastify `^5.x`
 * but the repo is on Fastify `4.29.1` — that runtime peer-version mismatch
 * crashed every Render deploy since 2026-05-23. See:
 *   docs/sprints/PHASE-0-5-OBSERVABILITY/06d-render-unblock.md
 *   docs/canon/DECISIONS_LOG.md (2026-06-05)
 *
 * Usage — attach as a route-level `preParsing` hook:
 *
 *   fastify.post('/webhooks/:provider', { preParsing: captureRawBody }, handler);
 *
 * After the hook runs, `request.rawBody` holds the byte-exact `Buffer` that
 * arrived on the wire. The original stream is re-emitted from that buffer so
 * Fastify's body parser continues to work normally and `request.body` is
 * populated as expected.
 *
 * Loud-error guarantee: if reading the stream throws, the hook re-throws and
 * Fastify's error handler returns 500. `request.rawBody` stays `undefined`,
 * which the SendGrid webhook handler is required to treat as
 * `RAW_BODY_UNAVAILABLE` and reject — never silently fall back to
 * `JSON.stringify(request.body)`. (Track 0D B1 hardening principle.)
 */

import { Readable } from 'node:stream';

import type {
  FastifyReply,
  FastifyRequest,
  preParsingAsyncHookHandler,
} from 'fastify';

export const captureRawBody: preParsingAsyncHookHandler = async (
  request: FastifyRequest,
  _reply: FastifyReply,
  payload: Readable
): Promise<Readable> => {
  const chunks: Buffer[] = [];
  for await (const chunk of payload) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks);
  request.rawBody = raw;
  return Readable.from(raw);
};
