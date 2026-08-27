/**
 * AI-overview parsing + text-building tests. Pins the defensive extraction of
 * DataForSEO's `ai_overview` item (summary + cited references) and the flattened
 * text used for brand-mention detection. No network — pure functions.
 */

import { describe, it, expect } from 'vitest';

import { parseAiOverview } from '../src/services/citeMind/aiOverviewProvider';
import { buildOverviewText } from '../src/services/citeMind/aiSurfaceMonitor';

const sampleItems = [
  { type: 'organic', rank_group: 1, domain: 'example.com' },
  {
    type: 'ai_overview',
    items: [
      {
        type: 'ai_overview_element',
        title: 'Marketing automation',
        text: 'Leading tools include Acme and Globex.',
      },
      {
        type: 'ai_overview_element',
        text: 'These platforms help with lead nurturing.',
      },
    ],
    references: [
      {
        type: 'ai_overview_reference',
        source: 'Acme',
        domain: 'acme.com',
        url: 'https://acme.com/guide',
        title: 'Acme Guide',
        text: 'A guide to automation',
      },
      { domain: 'globex.com', url: 'https://www.globex.com/', title: 'Globex' },
    ],
  },
];

describe('parseAiOverview', () => {
  it('extracts summary text + cited references from an ai_overview item', () => {
    const r = parseAiOverview(sampleItems);
    expect(r.present).toBe(true);
    expect(r.summaryText).toContain('Acme and Globex');
    expect(r.summaryText).toContain('lead nurturing');
    expect(r.references).toHaveLength(2);
    const domains = r.references.map((x) => x.domain).sort();
    expect(domains).toEqual(['acme.com', 'globex.com']); // www stripped
    expect(r.references[0].url).toBe('https://acme.com/guide');
  });

  it('is not present when there is no ai_overview item', () => {
    const r = parseAiOverview([{ type: 'organic', domain: 'example.com' }]);
    expect(r.present).toBe(false);
    expect(r.summaryText).toBe('');
    expect(r.references).toEqual([]);
  });

  it('is not present for a non-array / empty input', () => {
    expect(parseAiOverview(undefined).present).toBe(false);
    expect(parseAiOverview([]).present).toBe(false);
  });
});

describe('buildOverviewText', () => {
  it('includes the summary AND a sources block (so cited domains are detectable)', () => {
    const text = buildOverviewText(parseAiOverview(sampleItems));
    expect(text).toContain('lead nurturing');
    expect(text).toContain('Sources:');
    expect(text).toContain('acme.com');
    expect(text).toContain('globex.com');
  });

  it('is empty for an absent overview', () => {
    expect(
      buildOverviewText({ present: false, summaryText: '', references: [] })
    ).toBe('');
  });
});
