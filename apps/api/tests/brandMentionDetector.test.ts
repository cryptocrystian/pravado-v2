/**
 * Semantic Brand-Mention Detector Tests (Lane E)
 *
 * These tests assert the CLASSIFICATION LOGIC, not the model:
 *   - The LLM is mocked; we control its raw completion / provider.
 *   - We verify direct short-circuit, paraphrase hit, competitor, no-match,
 *     safe-degrade on failure, and robust JSON parsing.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the shared utils package: control LlmRouter.generate() + silence logger.
const generateMock = vi.fn();
vi.mock('@pravado/utils', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
  LlmRouter: vi.fn().mockImplementation(() => ({
    generate: generateMock,
  })),
}));

import {
  detectBrandMention,
  detectDirectMention,
  parseClassificationResponse,
  createRouterClassifier,
  buildClassificationPrompt,
  type BrandMentionContext,
  type SemanticClassifier,
} from '../src/services/citeMind/brandMentionDetector';

const CONTEXT: BrandMentionContext = {
  orgName: 'Acme Analytics',
  orgDomain: 'acme.io',
  competitorNames: ['DataRival', 'InsightCo'],
};

// A classifier that must NOT be called (fails the test if invoked).
const failIfCalled: SemanticClassifier = vi.fn(async () => {
  throw new Error('classifier should not have been called');
});

describe('detectDirectMention (deterministic, no LLM)', () => {
  it('detects an exact brand-name mention as direct', () => {
    const r = detectDirectMention(
      'For dashboards, Acme Analytics is a strong option.',
      CONTEXT
    );
    expect(r).not.toBeNull();
    expect(r?.brand_mentioned).toBe(true);
    expect(r?.mention_type).toBe('direct');
    expect(r?.confidence).toBe(1);
  });

  it('extracts a citation URL on the brand domain', () => {
    const r = detectDirectMention(
      'See Acme Analytics docs at https://acme.io/guide for details.',
      CONTEXT
    );
    expect(r?.citation_url).toBe('https://acme.io/guide');
  });

  it('detects a bare domain mention as direct even without the name', () => {
    const r = detectDirectMention('Check https://acme.io for pricing.', {
      orgName: 'Acme Analytics',
      orgDomain: 'acme.io',
    });
    expect(r?.mention_type).toBe('direct');
  });

  it('returns null when neither name nor domain appear', () => {
    expect(
      detectDirectMention('Generic advice about analytics tooling.', CONTEXT)
    ).toBeNull();
  });
});

describe('detectBrandMention orchestration', () => {
  it('DIRECT HIT: short-circuits without calling the classifier', async () => {
    const r = await detectBrandMention(
      'Acme Analytics leads the category.',
      CONTEXT,
      failIfCalled
    );
    expect(r.brand_mentioned).toBe(true);
    expect(r.mention_type).toBe('direct');
    expect(failIfCalled).not.toHaveBeenCalled();
  });

  it('PARAPHRASE HIT: classifier reports indirect -> brand mention', async () => {
    const classifier: SemanticClassifier = vi.fn(async () => ({
      brand_mentioned: true,
      mention_type: 'indirect',
      competitor_name: null,
      confidence: 0.82,
    }));
    const r = await detectBrandMention(
      'A Seattle startup that unifies product telemetry into one live dashboard is popular here.',
      CONTEXT,
      classifier
    );
    expect(classifier).toHaveBeenCalledOnce();
    expect(r.brand_mentioned).toBe(true);
    expect(r.mention_type).toBe('indirect');
    expect(r.confidence).toBe(0.82);
  });

  it('COMPETITOR: classifier reports competitor -> not a brand mention', async () => {
    const classifier: SemanticClassifier = vi.fn(async () => ({
      brand_mentioned: false,
      mention_type: 'competitor',
      competitor_name: 'DataRival',
      confidence: 0.9,
    }));
    const r = await detectBrandMention(
      'Most teams pick DataRival for this use case.',
      CONTEXT,
      classifier
    );
    expect(r.brand_mentioned).toBe(false);
    expect(r.mention_type).toBe('competitor');
    expect(r.competitor_name).toBe('DataRival');
    expect(r.citation_url).toBeNull();
  });

  it('NO MATCH: classifier reports none -> empty analysis', async () => {
    const classifier: SemanticClassifier = vi.fn(async () => ({
      brand_mentioned: false,
      mention_type: null,
      competitor_name: null,
      confidence: 0,
    }));
    const r = await detectBrandMention(
      'General guidance on analytics with no vendor named.',
      CONTEXT,
      classifier
    );
    expect(r.brand_mentioned).toBe(false);
    expect(r.mention_type).toBeNull();
  });

  it('SAFE DEGRADE: a throwing classifier yields a no-match, not a crash', async () => {
    const classifier: SemanticClassifier = vi.fn(async () => {
      throw new Error('LLM exploded');
    });
    const r = await detectBrandMention('ambiguous text', CONTEXT, classifier);
    expect(r.brand_mentioned).toBe(false);
    expect(r.mention_type).toBeNull();
    expect(r.citation_url).toBeNull();
  });

  it('PARAPHRASE HIT with no domain in text yields brand mention but null URL', async () => {
    const classifier: SemanticClassifier = vi.fn(async () => ({
      brand_mentioned: true,
      mention_type: 'indirect',
      competitor_name: null,
      confidence: 0.7,
    }));
    const r = await detectBrandMention(
      'That Seattle telemetry startup is widely used.',
      CONTEXT,
      classifier
    );
    // Paraphrase (no name, no domain URL present) -> mention true, URL null.
    expect(classifier).toHaveBeenCalledOnce();
    expect(r.brand_mentioned).toBe(true);
    expect(r.mention_type).toBe('indirect');
    expect(r.citation_url).toBeNull();
  });
});

describe('parseClassificationResponse (robust JSON handling)', () => {
  it('parses clean JSON', () => {
    const r = parseClassificationResponse(
      '{"mention_type":"indirect","competitor_name":null,"confidence":0.6}'
    );
    expect(r.mention_type).toBe('indirect');
    expect(r.brand_mentioned).toBe(true);
    expect(r.confidence).toBe(0.6);
  });

  it('parses JSON wrapped in markdown fences and prose', () => {
    const r = parseClassificationResponse(
      'Here is the result:\n```json\n{"mention_type":"competitor","competitor_name":"InsightCo","confidence":0.95}\n```'
    );
    expect(r.mention_type).toBe('competitor');
    expect(r.competitor_name).toBe('InsightCo');
    expect(r.brand_mentioned).toBe(false);
  });

  it('maps "none" to a no-match', () => {
    const r = parseClassificationResponse('{"mention_type":"none"}');
    expect(r.brand_mentioned).toBe(false);
    expect(r.mention_type).toBeNull();
  });

  it('degrades malformed / non-JSON output to a safe no-match', () => {
    for (const bad of ['', 'not json at all', '{ broken', '[]']) {
      const r = parseClassificationResponse(bad);
      expect(r.brand_mentioned).toBe(false);
      expect(r.mention_type).toBeNull();
      expect(r.confidence).toBe(0);
    }
  });

  it('clamps out-of-range confidence into [0,1]', () => {
    const r = parseClassificationResponse(
      '{"mention_type":"indirect","confidence":9}'
    );
    expect(r.confidence).toBe(1);
  });

  it('ignores competitor_name when type is not competitor', () => {
    const r = parseClassificationResponse(
      '{"mention_type":"indirect","competitor_name":"DataRival","confidence":0.5}'
    );
    expect(r.competitor_name).toBeNull();
  });
});

describe('buildClassificationPrompt', () => {
  it('includes the brand, domain, competitors and the response text', () => {
    const p = buildClassificationPrompt('some AI answer text', CONTEXT);
    expect(p).toContain('Acme Analytics');
    expect(p).toContain('acme.io');
    expect(p).toContain('DataRival, InsightCo');
    expect(p).toContain('some AI answer text');
  });

  it('handles the no-competitors case gracefully', () => {
    const p = buildClassificationPrompt('x', {
      orgName: 'Acme',
      orgDomain: 'acme.io',
    });
    expect(p).toContain('(none provided)');
  });
});

describe('createRouterClassifier (router integration seam)', () => {
  beforeEach(() => {
    generateMock.mockReset();
  });

  it('returns a no-match classifier when no LLM key is configured', async () => {
    const classifier = createRouterClassifier({
      supabase: {} as never,
      orgId: 'org-1',
    });
    const r = await classifier('any text', CONTEXT);
    expect(r.brand_mentioned).toBe(false);
    expect(r.mention_type).toBeNull();
    expect(generateMock).not.toHaveBeenCalled();
  });

  it('parses a real (non-stub) completion into a classification', async () => {
    generateMock.mockResolvedValue({
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      completion:
        '{"mention_type":"competitor","competitor_name":"DataRival","confidence":0.88}',
      raw: {},
    });
    const classifier = createRouterClassifier({
      anthropicApiKey: 'sk-test',
      supabase: {} as never,
      orgId: 'org-1',
    });
    const r = await classifier('Teams tend to choose DataRival.', CONTEXT);
    expect(generateMock).toHaveBeenCalledOnce();
    expect(r.mention_type).toBe('competitor');
    expect(r.competitor_name).toBe('DataRival');
  });

  it('treats a stub-provider fallback as a safe no-match (never a false positive)', async () => {
    generateMock.mockResolvedValue({
      provider: 'stub',
      model: 'stub-v1',
      completion: 'This is a stub response to the query...',
      raw: {},
    });
    const classifier = createRouterClassifier({
      anthropicApiKey: 'sk-test',
      supabase: {} as never,
      orgId: 'org-1',
    });
    const r = await classifier('ambiguous', CONTEXT);
    expect(r.brand_mentioned).toBe(false);
    expect(r.mention_type).toBeNull();
  });

  it('treats a fallback-flagged response as a safe no-match', async () => {
    generateMock.mockResolvedValue({
      provider: 'anthropic',
      model: 'claude-haiku-4-5-20251001',
      completion: '',
      raw: {},
      fallback: {
        errorCode: 'timeout',
        errorMessage: 'timed out',
        attemptedModel: 'claude-haiku-4-5-20251001',
        attemptedProvider: 'anthropic',
      },
    });
    const classifier = createRouterClassifier({
      anthropicApiKey: 'sk-test',
      supabase: {} as never,
      orgId: 'org-1',
    });
    const r = await classifier('ambiguous', CONTEXT);
    expect(r.brand_mentioned).toBe(false);
  });
});
