/**
 * Wave-2 — SEO SERP provider seam tests.
 *
 * Prime constraint under test: NO fabricated competitor/SERP data can ever reach
 * a live surface. Load-bearing guarantees (mirrors the #142 keyword provider):
 *   1. No DataForSEO creds  → factory returns the honest NullSerpProvider (which
 *      yields `[]`), NEVER a fabricating provider (none exists for SERP).
 *   2. DataForSEO creds set → factory returns DataForSEOSerpProvider.
 *   3. DataForSEOSerpProvider maps a mocked API response (VERIFIED live shape) to
 *      organic positions only — non-organic items are dropped, not guessed.
 *   4. A mocked API failure (throw / non-2xx / bad envelope) → returns `[]` and
 *      NEVER fabricates.
 */

import { describe, it, expect } from 'vitest';

import {
  resolveSerpProvider,
  NullSerpProvider,
  DataForSEOSerpProvider,
  type SerpFetchLike,
  type SerpHttpResponse,
} from '../src/services/seoSerpProvider';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function jsonResponse(
  body: unknown,
  ok = true,
  status = 200
): SerpHttpResponse {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

/**
 * A well-formed DataForSEO SERP envelope matching the VERIFIED live shape:
 * `tasks[0].result[0].items[]`, organic entries have `type === 'organic'` and
 * fields `rank_absolute`, `rank_group`, `domain`, `url`, `title`. Also includes
 * a non-organic item to prove it is excluded.
 */
function serpEnvelope() {
  return {
    tasks: [
      {
        status_code: 20000,
        status_message: 'Ok.',
        result: [
          {
            items: [
              {
                type: 'organic',
                rank_absolute: 1,
                rank_group: 1,
                domain: 'www.competitor-a.com',
                url: 'https://www.competitor-a.com/guide',
                title: 'The Ultimate Guide',
                description: 'desc a',
              },
              {
                type: 'paid',
                rank_absolute: 2,
                rank_group: 1,
                domain: 'ads.example.com',
                url: 'https://ads.example.com/promo',
                title: 'Buy now',
              },
              {
                type: 'organic',
                rank_absolute: 3,
                rank_group: 2,
                domain: 'competitor-b.com',
                url: 'https://competitor-b.com/post',
                title: 'Another Post',
                description: 'desc b',
              },
              {
                // malformed organic (no url) — must be dropped, never guessed.
                type: 'organic',
                rank_absolute: 4,
                rank_group: 3,
                domain: 'broken.com',
                title: 'No URL',
              },
            ],
          },
        ],
      },
    ],
  };
}

// ----------------------------------------------------------------------------
// (1) Factory selection
// ----------------------------------------------------------------------------

describe('resolveSerpProvider — selection', () => {
  it('returns NullSerpProvider when no DataForSEO creds', () => {
    const provider = resolveSerpProvider({
      dataForSeoLogin: undefined,
      dataForSeoPassword: undefined,
      nodeEnv: 'production',
    });
    expect(provider).toBeInstanceOf(NullSerpProvider);
    expect(provider).not.toBeInstanceOf(DataForSEOSerpProvider);
  });

  it('returns NullSerpProvider when only one cred is present', () => {
    const provider = resolveSerpProvider({
      dataForSeoLogin: 'login',
      dataForSeoPassword: undefined,
      nodeEnv: 'production',
    });
    expect(provider).toBeInstanceOf(NullSerpProvider);
  });

  it('returns DataForSEOSerpProvider when creds are present', () => {
    const provider = resolveSerpProvider({
      dataForSeoLogin: 'login',
      dataForSeoPassword: 'password',
      nodeEnv: 'production',
    });
    expect(provider).toBeInstanceOf(DataForSEOSerpProvider);
  });
});

// ----------------------------------------------------------------------------
// (2) NullSerpProvider yields nothing
// ----------------------------------------------------------------------------

describe('NullSerpProvider', () => {
  it('produces no positions (honest empty state)', async () => {
    const provider = new NullSerpProvider();
    expect(await provider.fetchSerp('anything')).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// (3) Mapping a real API response
// ----------------------------------------------------------------------------

describe('DataForSEOSerpProvider — mapping', () => {
  it('maps the VERIFIED SERP shape to organic positions only', async () => {
    let calledUrl = '';
    let calledBody = '';
    const fetchImpl: SerpFetchLike = async (url, init) => {
      calledUrl = url;
      calledBody = init.body;
      return jsonResponse(serpEnvelope());
    };

    const provider = new DataForSEOSerpProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    const positions = await provider.fetchSerp('seo tools', {
      locationCode: 2840,
      languageCode: 'en',
      depth: 10,
    });

    // Hit the verified endpoint with the verified body params.
    expect(calledUrl).toContain('serp/google/organic/live/advanced');
    const parsed = JSON.parse(calledBody);
    expect(parsed[0].keyword).toBe('seo tools');
    expect(parsed[0].location_code).toBe(2840);
    expect(parsed[0].language_code).toBe('en');
    expect(parsed[0].depth).toBe(10);

    // Only the two well-formed organic items survive (ad + malformed dropped).
    expect(positions).toHaveLength(2);
    expect(positions[0]).toEqual({
      rankAbsolute: 1,
      rankGroup: 1,
      domain: 'competitor-a.com', // www stripped
      url: 'https://www.competitor-a.com/guide',
      title: 'The Ultimate Guide',
    });
    expect(positions[1]).toEqual({
      rankAbsolute: 3,
      rankGroup: 2,
      domain: 'competitor-b.com',
      url: 'https://competitor-b.com/post',
      title: 'Another Post',
    });
    // No ad domain leaked through.
    expect(positions.some((p) => p.domain === 'ads.example.com')).toBe(false);
  });

  it('returns [] for an empty/whitespace keyword without calling the API', async () => {
    let called = false;
    const fetchImpl: SerpFetchLike = async () => {
      called = true;
      return jsonResponse(serpEnvelope());
    };
    const provider = new DataForSEOSerpProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    expect(await provider.fetchSerp('   ')).toEqual([]);
    expect(called).toBe(false);
  });
});

// ----------------------------------------------------------------------------
// (4) Honest degradation — never fabricate
// ----------------------------------------------------------------------------

describe('DataForSEOSerpProvider — honest degradation', () => {
  it('returns [] when the HTTP call throws (no fabrication)', async () => {
    const fetchImpl: SerpFetchLike = async () => {
      throw new Error('network down');
    };
    const provider = new DataForSEOSerpProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    expect(await provider.fetchSerp('seo tools')).toEqual([]);
  });

  it('returns [] on a non-2xx response (no fabrication)', async () => {
    const fetchImpl: SerpFetchLike = async () =>
      jsonResponse({ error: 'unauthorized' }, false, 401);
    const provider = new DataForSEOSerpProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    expect(await provider.fetchSerp('seo tools')).toEqual([]);
  });

  it('returns [] on an unexpected DataForSEO envelope (no fabrication)', async () => {
    const fetchImpl: SerpFetchLike = async () =>
      jsonResponse({ tasks: [{ status_code: 40501, status_message: 'err' }] });
    const provider = new DataForSEOSerpProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    expect(await provider.fetchSerp('seo tools')).toEqual([]);
  });
});
