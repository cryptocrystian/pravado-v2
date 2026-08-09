/**
 * Wave-2 — SEO keyword provider seam tests.
 *
 * Prime constraint under test: NO fabricated keyword data can ever reach a live
 * surface. Load-bearing guarantees:
 *   1. No DataForSEO creds  → factory returns the honest NullKeywordProvider
 *      (NOT the fabricating StubKeywordProvider).
 *   2. DataForSEO creds set → factory returns DataForSEOKeywordProvider.
 *   3. DataForSEOKeywordProvider maps a mocked API response to SEOKeywordMetric
 *      with source: 'external_api' (from REAL fields, deterministic priority).
 *   4. A mocked API failure (throw / non-2xx / bad envelope) → returns null /
 *      [] and NEVER fabricates.
 *   5. The random stub is UNREACHABLE via the production factory path (the
 *      SEO_KEYWORD_PROVIDER=stub escape hatch is hard-ignored in production).
 */

import type { SEOKeyword } from '@pravado/types';
import { describe, it, expect } from 'vitest';

import {
  resolveKeywordProvider,
  NullKeywordProvider,
  StubKeywordProvider,
  DataForSEOKeywordProvider,
  type KeywordFetchLike,
  type KeywordHttpResponse,
} from '../src/services/seoKeywordService';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function makeKeyword(overrides: Partial<SEOKeyword> = {}): SEOKeyword {
  return {
    id: 'kw-1',
    orgId: 'org-1',
    keyword: 'seo tools',
    searchVolume: null,
    difficultyScore: null,
    currentPosition: null,
    targetPosition: null,
    trackedUrl: null,
    status: 'active',
    intent: null,
    metadata: {},
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function jsonResponse(
  body: unknown,
  ok = true,
  status = 200
): KeywordHttpResponse {
  return {
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

/** A well-formed DataForSEO keyword_overview envelope for a single keyword. */
function overviewEnvelope(keyword: string) {
  return {
    tasks: [
      {
        status_code: 20000,
        status_message: 'Ok.',
        result: [
          {
            items: [
              {
                keyword,
                keyword_info: { search_volume: 12000, cpc: 3.456 },
                keyword_properties: { keyword_difficulty: 40 },
              },
            ],
          },
        ],
      },
    ],
  };
}

// ----------------------------------------------------------------------------
// (1) + (5) Factory selection & stub unreachability
// ----------------------------------------------------------------------------

describe('resolveKeywordProvider — selection', () => {
  it('returns NullKeywordProvider (NOT the stub) when no DataForSEO creds', () => {
    const provider = resolveKeywordProvider({
      dataForSeoLogin: undefined,
      dataForSeoPassword: undefined,
      nodeEnv: 'production',
    });
    expect(provider).toBeInstanceOf(NullKeywordProvider);
    expect(provider).not.toBeInstanceOf(StubKeywordProvider);
  });

  it('returns DataForSEOKeywordProvider when creds are present', () => {
    const provider = resolveKeywordProvider({
      dataForSeoLogin: 'login',
      dataForSeoPassword: 'password',
      nodeEnv: 'production',
    });
    expect(provider).toBeInstanceOf(DataForSEOKeywordProvider);
  });

  it('IGNORES the stub escape hatch in production (stub unreachable in prod)', () => {
    const provider = resolveKeywordProvider({
      providerOverride: 'stub',
      nodeEnv: 'production',
      // even with no creds, prod must NOT hand back the stub
    });
    expect(provider).not.toBeInstanceOf(StubKeywordProvider);
    expect(provider).toBeInstanceOf(NullKeywordProvider);
  });

  it('prefers real DataForSEO over the stub hatch even outside production', () => {
    const provider = resolveKeywordProvider({
      providerOverride: 'stub',
      dataForSeoLogin: 'login',
      dataForSeoPassword: 'password',
      nodeEnv: 'production',
    });
    // creds win; but critically it is never the stub in prod
    expect(provider).toBeInstanceOf(DataForSEOKeywordProvider);
  });

  it('allows the stub ONLY via explicit hatch in non-production dev/test', () => {
    const provider = resolveKeywordProvider({
      providerOverride: 'stub',
      nodeEnv: 'development',
    });
    expect(provider).toBeInstanceOf(StubKeywordProvider);
  });
});

// ----------------------------------------------------------------------------
// (3) Mapping a real API response
// ----------------------------------------------------------------------------

describe('DataForSEOKeywordProvider — mapping', () => {
  it('maps a mocked API response to SEOKeywordMetric with source external_api', async () => {
    const keyword = makeKeyword({ keyword: 'seo tools', id: 'kw-42' });
    let calledUrl = '';
    const fetchImpl: KeywordFetchLike = async (url) => {
      calledUrl = url;
      return jsonResponse(overviewEnvelope('seo tools'));
    };

    const provider = new DataForSEOKeywordProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    const metric = await provider.enrichKeyword('org-1', keyword);

    expect(calledUrl).toContain('dataforseo_labs/google/keyword_overview/live');
    expect(metric).not.toBeNull();
    expect(metric!.source).toBe('external_api');
    expect(metric!.orgId).toBe('org-1');
    expect(metric!.keywordId).toBe('kw-42');
    expect(metric!.searchVolume).toBe(12000);
    expect(metric!.difficulty).toBe(40);
    expect(metric!.cpc).toBe(3.46); // rounded to 2dp from real 3.456
    expect(metric!.clickThroughRate).toBeNull(); // not provided → honest null
    // deterministic transform of REAL values (no Math.random):
    // min(100, (12000/100)*0.4 + (100-40)*0.6) = 48 + 36 = 84
    expect(metric!.priorityScore).toBe(84);
  });

  it('batch maps multiple keywords by keyword string', async () => {
    const kws = [
      makeKeyword({ id: 'kw-a', keyword: 'alpha' }),
      makeKeyword({ id: 'kw-b', keyword: 'beta' }),
    ];
    const fetchImpl: KeywordFetchLike = async () =>
      jsonResponse({
        tasks: [
          {
            status_code: 20000,
            result: [
              {
                items: [
                  {
                    keyword: 'alpha',
                    keyword_info: { search_volume: 500, cpc: 1.2 },
                    keyword_properties: { keyword_difficulty: 10 },
                  },
                  {
                    keyword: 'beta',
                    keyword_info: { search_volume: 800, cpc: 2.0 },
                    keyword_properties: { keyword_difficulty: 20 },
                  },
                ],
              },
            ],
          },
        ],
      });

    const provider = new DataForSEOKeywordProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    const metrics = await provider.batchEnrichKeywords('org-1', kws);
    expect(metrics).toHaveLength(2);
    expect(metrics.every((m) => m.source === 'external_api')).toBe(true);
    expect(metrics.map((m) => m.keywordId).sort()).toEqual(['kw-a', 'kw-b']);
  });
});

// ----------------------------------------------------------------------------
// (4) Honest degradation — never fabricate
// ----------------------------------------------------------------------------

describe('DataForSEOKeywordProvider — honest degradation', () => {
  it('returns null when the HTTP call throws (no fabrication)', async () => {
    const fetchImpl: KeywordFetchLike = async () => {
      throw new Error('network down');
    };
    const provider = new DataForSEOKeywordProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    const metric = await provider.enrichKeyword('org-1', makeKeyword());
    expect(metric).toBeNull();
  });

  it('returns null on a non-2xx response (no fabrication)', async () => {
    const fetchImpl: KeywordFetchLike = async () =>
      jsonResponse({ error: 'unauthorized' }, false, 401);
    const provider = new DataForSEOKeywordProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    const metric = await provider.enrichKeyword('org-1', makeKeyword());
    expect(metric).toBeNull();
  });

  it('returns null on an unexpected DataForSEO envelope (no fabrication)', async () => {
    const fetchImpl: KeywordFetchLike = async () =>
      jsonResponse({ tasks: [{ status_code: 40501, status_message: 'err' }] });
    const provider = new DataForSEOKeywordProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    const metric = await provider.enrichKeyword('org-1', makeKeyword());
    expect(metric).toBeNull();
  });

  it('batch returns [] on failure (no fabrication)', async () => {
    const fetchImpl: KeywordFetchLike = async () => {
      throw new Error('boom');
    };
    const provider = new DataForSEOKeywordProvider(
      { login: 'l', password: 'p' },
      fetchImpl
    );
    const metrics = await provider.batchEnrichKeywords('org-1', [
      makeKeyword(),
    ]);
    expect(metrics).toEqual([]);
  });
});

// ----------------------------------------------------------------------------
// (2) NullKeywordProvider yields nothing
// ----------------------------------------------------------------------------

describe('NullKeywordProvider', () => {
  it('produces no metrics (honest empty state)', async () => {
    const provider = new NullKeywordProvider();
    expect(await provider.enrichKeyword()).toBeNull();
    expect(await provider.batchEnrichKeywords()).toEqual([]);
  });
});
