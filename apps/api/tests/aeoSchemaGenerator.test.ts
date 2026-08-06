/**
 * CiteMind Engine 1 — Schema Generator tests (Lane D)
 *
 * Focus: the newly-added canonical JSON-LD types (NewsArticle, Organization,
 * Person) per CITEMIND_SYSTEM §2.3 / SEO_AEO_PILLAR_CANON §3D.
 */

import { describe, it, expect } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  detectSchemaType,
  generateSchema,
} from '../src/services/citeMind/citeMindSchemaGenerator';
import { createMockSupabaseClient } from './helpers/supabaseMock';

const ORG = { name: 'Acme Corp', website_url: 'https://acme.example', logo_url: 'https://acme.example/logo.png', description: 'Acme makes widgets.' };

function mockFor(item: Record<string, unknown>): SupabaseClient {
  return createMockSupabaseClient({
    content_items: { data: item, error: null },
    orgs: { data: ORG, error: null },
    citemind_schemas: { data: null, error: null },
  });
}

describe('detectSchemaType — new canonical types', () => {
  it('detects NewsArticle for press releases', () => {
    expect(
      detectSchemaType('Acme Press Release', 'FOR IMMEDIATE RELEASE\nAcme today announced a new product.')
    ).toBe('NewsArticle');
    expect(detectSchemaType('Acme announces Series B', 'The company announced funding.', 'press_release')).toBe(
      'NewsArticle'
    );
  });

  it('detects Person for executive bios', () => {
    const body = 'Jane Doe is the Chief Executive Officer of Acme Corp. She leads strategy.';
    expect(detectSchemaType('Jane Doe Biography', body)).toBe('Person');
    expect(detectSchemaType('Executive Profile', 'Bob Lee is our CEO and founder.', 'bio')).toBe('Person');
  });

  it('detects Organization for about/brand-entity content', () => {
    expect(detectSchemaType('About Us', 'Acme was founded in 2015 to build widgets.')).toBe('Organization');
    expect(detectSchemaType('Company Overview', 'We are a widget maker.', 'about')).toBe('Organization');
  });

  it('honors an explicit metadata.schema_type override', () => {
    expect(detectSchemaType('Anything', 'body', 'blog_post', { schema_type: 'Person' })).toBe('Person');
  });

  it('still falls back to BlogPosting / Article', () => {
    expect(detectSchemaType('Quick blog', 'short body')).toBe('BlogPosting');
  });
});

describe('generateSchema — NewsArticle', () => {
  it('emits NewsArticle with articleBody + publisher', async () => {
    const supabase = mockFor({
      id: 'c1',
      org_id: 'o1',
      title: 'Acme announces Series B',
      body: 'FOR IMMEDIATE RELEASE\nAcme today announced a $20M Series B round.',
      content_type: 'press_release',
      url: 'https://acme.example/news/series-b',
      published_at: '2026-01-01T00:00:00Z',
      word_count: 10,
      metadata: { image: 'https://acme.example/hero.png' },
    });

    const res = await generateSchema(supabase, 'c1', 'o1');
    expect(res.schema_type).toBe('NewsArticle');
    expect(res.schema_json['@type']).toBe('NewsArticle');
    expect(res.schema_json.headline).toBe('Acme announces Series B');
    expect(res.schema_json.articleBody).toContain('Series B');
    expect(res.schema_json.image).toBe('https://acme.example/hero.png');
    expect((res.schema_json.publisher as Record<string, unknown>).name).toBe('Acme Corp');
  });
});

describe('generateSchema — Organization', () => {
  it('emits Organization with canon fields from org + metadata', async () => {
    const supabase = mockFor({
      id: 'c2',
      org_id: 'o1',
      title: 'About Us',
      body: 'Acme was founded in 2015 to build widgets for everyone.',
      content_type: 'about',
      url: 'https://acme.example/about',
      published_at: null,
      word_count: 12,
      metadata: { sameAs: ['https://twitter.com/acme'], founder: 'Jane Doe', foundingDate: '2015-06-01' },
    });

    const res = await generateSchema(supabase, 'c2', 'o1');
    expect(res.schema_type).toBe('Organization');
    expect(res.schema_json['@type']).toBe('Organization');
    expect(res.schema_json.name).toBe('Acme Corp');
    expect(res.schema_json.logo).toBe('https://acme.example/logo.png');
    expect(res.schema_json.sameAs).toEqual(['https://twitter.com/acme']);
    expect((res.schema_json.founder as Record<string, unknown>).name).toBe('Jane Doe');
    expect(res.schema_json.foundingDate).toBe('2015-06-01');
  });
});

describe('generateSchema — Person', () => {
  it('emits Person with extracted name/jobTitle + worksFor', async () => {
    const supabase = mockFor({
      id: 'c3',
      org_id: 'o1',
      title: 'Jane Doe',
      body: 'Jane Doe is the Chief Executive Officer of Acme Corp. She drives product vision.',
      content_type: 'bio',
      url: 'https://acme.example/team/jane',
      published_at: null,
      word_count: 14,
      metadata: { sameAs: ['https://linkedin.com/in/janedoe'] },
    });

    const res = await generateSchema(supabase, 'c3', 'o1');
    expect(res.schema_type).toBe('Person');
    expect(res.schema_json['@type']).toBe('Person');
    expect(res.schema_json.name).toBe('Jane Doe');
    expect(res.schema_json.jobTitle).toBe('Chief Executive Officer');
    expect((res.schema_json.worksFor as Record<string, unknown>).name).toBe('Acme Corp');
    expect(res.schema_json.sameAs).toEqual(['https://linkedin.com/in/janedoe']);
  });
});
