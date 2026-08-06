/**
 * Indexation Ping Service tests — CiteMind Engine 1 (Lane D)
 *
 * IndexNow + Google Indexing API. HTTP is mocked via an injected fetch.
 * Canon: CITEMIND_SYSTEM §2.5, SEO_AEO_PILLAR_CANON §3D.
 */

import { describe, it, expect, vi } from 'vitest';
import crypto from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  submitIndexNow,
  pingGoogleIndexing,
  getGoogleIndexingAccessToken,
  pingIndexationOnPublish,
  type FetchLike,
} from '../src/services/citeMind/indexationPingService';
import { createMockSupabaseClient } from './helpers/supabaseMock';

function fakeResponse(status: number, body: unknown = {}): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('submitIndexNow', () => {
  it('POSTs host/key/urlList to the IndexNow endpoint and reports success on 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(200)) as unknown as FetchLike;
    const res = await submitIndexNow(
      ['https://acme.example/a', 'https://acme.example/b'],
      { key: 'abc123' },
      fetchMock
    );

    expect(res.submitted).toBe(true);
    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://api.indexnow.org/indexnow');
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.host).toBe('acme.example');
    expect(payload.key).toBe('abc123');
    expect(payload.keyLocation).toBe('https://acme.example/abc123.txt');
    expect(payload.urlList).toEqual(['https://acme.example/a', 'https://acme.example/b']);
  });

  it('skips (no request) when no key is configured', async () => {
    const prev = process.env.INDEXNOW_KEY;
    delete process.env.INDEXNOW_KEY;
    const fetchMock = vi.fn() as unknown as FetchLike;
    const res = await submitIndexNow(['https://acme.example/a'], {}, fetchMock);
    expect(res.submitted).toBe(false);
    expect(res.skippedReason).toMatch(/INDEXNOW_KEY/);
    expect(fetchMock).not.toHaveBeenCalled();
    if (prev !== undefined) process.env.INDEXNOW_KEY = prev;
  });

  it('does not throw on network failure', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('boom')) as unknown as FetchLike;
    const res = await submitIndexNow(['https://acme.example/a'], { key: 'k' }, fetchMock);
    expect(res.submitted).toBe(false);
    expect(res.skippedReason).toBe('request failed');
  });
});

describe('pingGoogleIndexing', () => {
  it('POSTs URL_UPDATED with a Bearer token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(200)) as unknown as FetchLike;
    const res = await pingGoogleIndexing('https://acme.example/a', 'tok-123', fetchMock);

    expect(res.submitted).toBe(true);
    const [url, init] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://indexing.googleapis.com/v3/urlNotifications:publish');
    expect((init as RequestInit).headers).toMatchObject({ Authorization: 'Bearer tok-123' });
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload).toEqual({ url: 'https://acme.example/a', type: 'URL_UPDATED' });
  });
});

describe('getGoogleIndexingAccessToken', () => {
  it('returns null when service-account creds are absent', async () => {
    const prevE = process.env.GOOGLE_INDEXING_SA_EMAIL;
    const prevK = process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY;
    delete process.env.GOOGLE_INDEXING_SA_EMAIL;
    delete process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY;
    const token = await getGoogleIndexingAccessToken(undefined, vi.fn() as unknown as FetchLike);
    expect(token).toBeNull();
    if (prevE !== undefined) process.env.GOOGLE_INDEXING_SA_EMAIL = prevE;
    if (prevK !== undefined) process.env.GOOGLE_INDEXING_SA_PRIVATE_KEY = prevK;
  });

  it('signs a JWT (RS256) and exchanges it for an access token', async () => {
    const { privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      publicKeyEncoding: { type: 'spki', format: 'pem' },
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValue(fakeResponse(200, { access_token: 'ya29.test' })) as unknown as FetchLike;

    const token = await getGoogleIndexingAccessToken(
      { email: 'svc@acme.iam.gserviceaccount.com', privateKey: privateKey as string },
      fetchMock
    );

    expect(token).toBe('ya29.test');
    const [url, init] = (fetchMock as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('https://oauth2.googleapis.com/token');
    const bodyStr = (init as RequestInit).body as string;
    expect(bodyStr).toContain('grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer');
    // assertion is a well-formed 3-part JWT
    const assertion = new URLSearchParams(bodyStr).get('assertion') || '';
    expect(assertion.split('.')).toHaveLength(3);
  });
});

describe('pingIndexationOnPublish', () => {
  function supa(): SupabaseClient {
    return createMockSupabaseClient({ indexation_pings: { data: null, error: null } });
  }

  it('fires IndexNow, records the ping, and skips Google when not high-priority', async () => {
    process.env.INDEXNOW_KEY = 'testkey';
    const fetchMock = vi.fn().mockResolvedValue(fakeResponse(200)) as unknown as FetchLike;
    const supabase = supa();
    const spy = vi.spyOn(supabase, 'from');

    const res = await pingIndexationOnPublish(
      supabase,
      { orgId: 'o1', contentItemId: 'c1', url: 'https://acme.example/a' },
      fetchMock
    );

    expect(res.indexnow.submitted).toBe(true);
    expect(res.google.submitted).toBe(false);
    expect(res.google.skippedReason).toBe('not high-priority');
    expect(spy).toHaveBeenCalledWith('indexation_pings');
    // only IndexNow endpoint was hit
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
