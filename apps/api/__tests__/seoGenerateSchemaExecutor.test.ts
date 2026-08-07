/**
 * Wave-2 — SEO `seo.generate_schema` executor tests (the THIRD per-pillar executor).
 *
 * Load-bearing claims (three-way outcome semantics — never fabricate):
 *   1. A proposal with a valid content_item_id → CiteMind Engine-1's generator runs,
 *      the JSON-LD is persisted, and the executor returns VERIFIED `success` carrying
 *      the real schema_type + content_item_id.
 *   2. No content_item_id on the proposal → neutral `governed_complete`
 *      (needs_content); the generator is NEVER called.
 *   3. content_item_id present but no such org-scoped content item → neutral
 *      `governed_complete` (content_not_found); the generator is NEVER called.
 *   4. The generator/persist step throws → honest `failure`.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { runSeoGenerateSchema } from '../src/services/craft/executors/seoGenerateSchemaExecutor';

const CTX = {
  supabase: {} as SupabaseClient, // never touched: load/generate seams injected
  orgId: 'org-1',
  proposalId: 'prop-1',
  executionId: 'exec-1',
};

describe('runSeoGenerateSchema', () => {
  it('valid content_item_id → generator runs + persists → VERIFIED success', async () => {
    let generatedFor: string | null = null;
    const outcome = await runSeoGenerateSchema(
      {
        id: 'prop-1',
        action_type: 'seo.generate_schema',
        action_params: { content_item_id: 'ci-1' },
      },
      CTX,
      {
        loadContentItem: async () => ({ id: 'ci-1' }),
        generate: async (_sb, contentItemId) => {
          generatedFor = contentItemId;
          return { schema_type: 'FAQPage', content_item_id: contentItemId };
        },
      }
    );

    expect(generatedFor).toBe('ci-1');
    expect(outcome.result).toBe('success');
    expect(outcome.detail).toMatchObject({
      kind: 'seo_schema_generated',
      action_type: 'seo.generate_schema',
      content_item_id: 'ci-1',
      schema_type: 'FAQPage',
      proposal_id: 'prop-1',
      execution_id: 'exec-1',
    });
  });

  it('no content_item_id → neutral governed_complete, generator NEVER called', async () => {
    let generateCalled = false;
    const outcome = await runSeoGenerateSchema(
      { id: 'prop-1', action_type: 'seo.generate_schema', action_params: {} },
      CTX,
      {
        loadContentItem: async () => ({ id: 'x' }),
        generate: async () => {
          generateCalled = true;
          return { schema_type: 'Article', content_item_id: 'x' };
        },
      }
    );

    expect(generateCalled).toBe(false);
    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'seo_schema_needs_content',
      action_type: 'seo.generate_schema',
    });
  });

  it('content_item_id present but content not found → neutral governed_complete', async () => {
    let generateCalled = false;
    const outcome = await runSeoGenerateSchema(
      {
        id: 'prop-1',
        action_type: 'seo.generate_schema',
        action_params: { content_item_id: 'ci-missing' },
      },
      CTX,
      {
        loadContentItem: async () => null, // org-scoped existence check fails
        generate: async () => {
          generateCalled = true;
          return { schema_type: 'Article', content_item_id: 'ci-missing' };
        },
      }
    );

    expect(generateCalled).toBe(false);
    expect(outcome.result).toBe('governed_complete');
    expect(outcome.detail).toMatchObject({
      kind: 'seo_schema_content_not_found',
      content_item_id: 'ci-missing',
    });
  });

  it('generator/persist error → honest failure', async () => {
    const outcome = await runSeoGenerateSchema(
      {
        id: 'prop-1',
        action_type: 'seo.generate_schema',
        action_params: { content_item_id: 'ci-1' },
      },
      CTX,
      {
        loadContentItem: async () => ({ id: 'ci-1' }),
        generate: async () => {
          throw new Error('Failed to save schema: boom');
        },
      }
    );

    expect(outcome.result).toBe('failure');
    expect(outcome.detail).toMatchObject({
      kind: 'seo_schema_generation_failed',
      content_item_id: 'ci-1',
      error: 'Failed to save schema: boom',
    });
  });

  it('accepts the camelCase contentItemId param alias', async () => {
    const outcome = await runSeoGenerateSchema(
      {
        id: 'prop-1',
        action_type: 'seo.generate_schema',
        action_params: { contentItemId: 'ci-2' },
      },
      CTX,
      {
        loadContentItem: async () => ({ id: 'ci-2' }),
        generate: async (_sb, id) => ({
          schema_type: 'Article',
          content_item_id: id,
        }),
      }
    );
    expect(outcome.result).toBe('success');
    expect(outcome.detail).toMatchObject({ content_item_id: 'ci-2' });
  });
});
