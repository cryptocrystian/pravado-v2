/**
 * Wave-2 — PR pitch composer tests.
 *
 * Load-bearing claims:
 *   1. Given real journalist context (name/outlet/beat), the composer produces a
 *      personalized {subject, body} that CLEARS the server-side personalization gate
 *      (scorePersonalization >= 40) — so the chokepoint will not refuse it.
 *   2. The composer NEVER emits the router's generic stub: an LLM fallback (stub
 *      provider / fallback attribution) → null (honest compose failure).
 *   3. Unusable LLM output (non-JSON, or missing subject/body) → null.
 *   4. An LLM throw is swallowed → null (never throws for an LLM issue).
 *   5. Bounded, cost-controlled request: a maxTokens cap is passed to the LLM.
 */

import type { LlmRequest, LlmResponse } from '@pravado/types';
import { describe, it, expect } from 'vitest';

import { scorePersonalization } from '../src/services/personalizationScore';
import { composePitch } from '../src/services/pr/pitchComposer';

const INPUT = {
  journalist: {
    name: 'Alex Rivera',
    outlet: 'FreightWaves',
    beats: ['logistics'],
    recentWorkHook: null,
  },
  brand: { name: 'Acme Logistics' },
  signal: { title: 'Resilient freight networks report' },
  orgId: 'org-1',
};

function llmReturning(
  completion: string,
  provider: LlmResponse['provider'] = 'anthropic'
) {
  const seen: LlmRequest[] = [];
  const generate = async (request: LlmRequest): Promise<LlmResponse> => {
    seen.push(request);
    return {
      provider,
      model: 'claude-3-5-haiku-test',
      raw: {},
      completion,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    };
  };
  return { generate, seen };
}

describe('composePitch', () => {
  it('produces a personalized pitch that clears the personalization gate', async () => {
    const body =
      'Hi Alex, I follow your logistics coverage at FreightWaves and think this ' +
      'freight-resilience report fits your beat. Happy to share the data and set ' +
      'up a quick interview with our operators this week if useful.';
    const { generate, seen } = llmReturning(
      JSON.stringify({
        subject: 'Logistics story for Alex at FreightWaves',
        body,
      })
    );

    const pitch = await composePitch(INPUT, { generate });

    expect(pitch).not.toBeNull();
    expect(pitch!.subject).toContain('Alex');
    expect(pitch!.bodyText).toContain('FreightWaves');
    expect(pitch!.bodyHtml).toContain('<p>');
    expect(pitch!.model).toBe('claude-3-5-haiku-test');

    // The composed body must clear the SAME gate the chokepoint enforces.
    const score = scorePersonalization({
      subject: pitch!.subject,
      bodyText: pitch!.bodyText,
      recipient: {
        name: INPUT.journalist.name,
        outlet: INPUT.journalist.outlet,
        beats: INPUT.journalist.beats,
      },
    });
    expect(score.blocked).toBe(false);
    expect(score.score).toBeGreaterThanOrEqual(40);

    // Cost control: a bounded maxTokens is passed to the provider.
    expect(seen[0].maxTokens).toBeGreaterThan(0);
    expect(seen[0].maxTokens).toBeLessThanOrEqual(1000);
  });

  it('tolerates JSON wrapped in markdown fences / prose', async () => {
    const body =
      'Hi Alex, your FreightWaves logistics reporting is exactly why I am sharing ' +
      'this freight-resilience data with you first. Can I send the full report?';
    const wrapped =
      'Sure! Here is the pitch:\n```json\n' +
      JSON.stringify({ subject: 'For Alex at FreightWaves', body }) +
      '\n```';
    const { generate } = llmReturning(wrapped);

    const pitch = await composePitch(INPUT, { generate });
    expect(pitch).not.toBeNull();
    expect(pitch!.bodyText).toContain('FreightWaves');
  });

  it('returns null when the LLM fell back to the deterministic stub (no generic send)', async () => {
    const { generate } = llmReturning(
      'This is a stub response to the query.',
      'stub'
    );
    const pitch = await composePitch(INPUT, { generate });
    expect(pitch).toBeNull();
  });

  it('returns null on unusable (non-JSON) output', async () => {
    const { generate } = llmReturning('Sorry, I cannot help with that.');
    const pitch = await composePitch(INPUT, { generate });
    expect(pitch).toBeNull();
  });

  it('returns null when JSON is missing subject or body', async () => {
    const { generate } = llmReturning(
      JSON.stringify({ subject: 'Only a subject' })
    );
    const pitch = await composePitch(INPUT, { generate });
    expect(pitch).toBeNull();
  });

  it('swallows an LLM throw and returns null (never throws for an LLM issue)', async () => {
    const generate = async (): Promise<LlmResponse> => {
      throw new Error('network down');
    };
    const pitch = await composePitch(INPUT, { generate });
    expect(pitch).toBeNull();
  });
});
