/**
 * Wave-2 — Entity Map ring-contract tests (ENTITY_MAP_SPEC v2.0 / ENTITY-MAP-SAGE v3.0).
 *
 * Verifies the backend emits the canonical concentric Ring 0–3 model (D012 — zone
 * model retired) with:
 *   1. ring: 0|1|2|3 and NO `zone` field anywhere.
 *   2. Ring→pillar mapping (Ring 1 SEO topic clusters, Ring 2 PR, Ring 3 AEO).
 *   3. Ring 1 aggregated as topic CLUSTERS (D017), not individual content pieces.
 *   4. Coherence fields present on every node (affinity_score, authority_weight,
 *      entity_insight, linked_action_id) — honest null when underivable.
 *   5. Gap nodes carry linked_action_id when a matching Action-Stream proposal exists,
 *      and null when none does.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect } from 'vitest';

import { buildEntityMap } from '../src/services/sage/entityMapService';

const ORG = 'org-1';

interface TableResult {
  data: unknown;
  error: unknown;
}

/**
 * Chainable Supabase mock. Every builder method returns the same chain, which is
 * thenable and resolves the configured result for its table. Supports the chain
 * shape the service uses: select/eq/gte/in/limit.
 */
function makeSupabase(byTable: Record<string, TableResult>): SupabaseClient {
  return {
    from(table: string) {
      const result = byTable[table] ?? { data: [], error: null };
      const chain: Record<string, unknown> = {};
      for (const m of ['select', 'eq', 'gte', 'in', 'limit', 'order']) {
        chain[m] = () => chain;
      }
      (chain as { then: unknown }).then = (
        resolve: (r: TableResult) => unknown
      ) => resolve(result);
      return chain;
    },
  } as unknown as SupabaseClient;
}

function baseTables(
  overrides: Record<string, TableResult> = {}
): Record<string, TableResult> {
  return {
    content_topics: { data: [], error: null },
    content_topic_clusters: { data: [], error: null },
    citemind_scores: { data: [], error: null },
    journalist_profiles: { data: [], error: null },
    journalists: { data: [], error: null },
    citation_monitor_results: { data: [], error: null },
    sage_proposals: { data: [], error: null },
    ...overrides,
  };
}

describe('buildEntityMap — canonical Ring 0–3 contract', () => {
  it('emits ring 0–3 and never the retired zone model', async () => {
    const supabase = makeSupabase(baseTables());
    const payload = await buildEntityMap(supabase, ORG, 'Pravado');

    expect(payload.layout_version).toBe('v3');
    // No node carries the retired `zone` field; every node has a valid ring.
    for (const node of payload.nodes) {
      expect(node).not.toHaveProperty('zone');
      expect([0, 1, 2, 3]).toContain(node.ring);
    }
    // Serialized payload contains no zone values at all.
    const json = JSON.stringify(payload);
    expect(json).not.toContain('"zone"');
    expect(json).not.toContain('growth');

    // Ring 0 brand core present, centered, pillar null.
    const brand = payload.nodes.find((n) => n.ring === 0);
    expect(brand).toBeDefined();
    expect(brand!.kind).toBe('brand');
    expect(brand!.pillar).toBeNull();
    expect(brand!.authority_weight).toBe(100);

    // Ring 3 = the five canonical AEO AI-engine perceivers.
    const ring3 = payload.nodes.filter((n) => n.ring === 3);
    expect(ring3).toHaveLength(5);
    expect(
      ring3.every((n) => n.pillar === 'AEO' && n.kind === 'ai_engine')
    ).toBe(true);
  });

  it('aggregates Ring 1 into topic CLUSTERS (D017), not individual pieces', async () => {
    // Three content_topics rows, two share cluster c1 → one cluster node.
    const supabase = makeSupabase(
      baseTables({
        content_topics: {
          data: [
            {
              id: 't1',
              topic_name: 'AEO Strategy',
              cluster_id: 'c1',
              relevance_score: 80,
              content_item_id: 'ci1',
            },
            {
              id: 't2',
              topic_name: 'Citation Intelligence',
              cluster_id: 'c1',
              relevance_score: 60,
              content_item_id: 'ci2',
            },
            {
              id: 't3',
              topic_name: 'Entity SEO',
              cluster_id: null,
              relevance_score: 40,
              content_item_id: 'ci3',
            },
          ],
          error: null,
        },
        content_topic_clusters: {
          data: [{ id: 'c1', name: 'AEO Authority' }],
          error: null,
        },
        citemind_scores: {
          data: [
            {
              content_item_id: 'ci1',
              schema_markup_score: 80,
              overall_score: 70,
            },
            {
              content_item_id: 'ci2',
              schema_markup_score: 40,
              overall_score: 50,
            },
          ],
          error: null,
        },
      })
    );
    const payload = await buildEntityMap(supabase, ORG, 'Pravado');

    const ring1 = payload.nodes.filter((n) => n.ring === 1);
    // 3 topics collapse to 2 cluster nodes (c1 with 2 pieces + the standalone).
    expect(ring1).toHaveLength(2);
    expect(ring1.every((n) => n.kind === 'topic_cluster')).toBe(true);
    expect(ring1.every((n) => n.pillar === 'SEO')).toBe(true);

    // The c1 cluster aggregates 2 pieces and its authority_weight is the mean
    // schema coverage across those pieces ((80 + 40) / 2 = 60).
    const c1 = ring1.find((n) => n.label === 'AEO Authority');
    expect(c1).toBeDefined();
    expect(c1!.meta.content_piece_count).toBe(2);
    expect(c1!.authority_weight).toBe(60);
  });

  it('emits coherence fields on every node, honest-null where underivable', async () => {
    const supabase = makeSupabase(baseTables());
    const payload = await buildEntityMap(supabase, ORG, 'Pravado');

    for (const node of payload.nodes) {
      expect(typeof node.affinity_score).toBe('number');
      expect(node.affinity_score).toBeGreaterThanOrEqual(0);
      expect(node.affinity_score).toBeLessThanOrEqual(100);
      expect(typeof node.authority_weight).toBe('number');
      expect(Array.isArray(node.impact_pillars)).toBe(true);
      // linked_action_id is a string or an honest null — never fabricated.
      expect(
        node.linked_action_id === null ||
          typeof node.linked_action_id === 'string'
      ).toBe(true);
    }

    // With no citation data every AI engine is a gap node; with no matching
    // proposal its linked_action_id is honestly null (D016 write-back unwired).
    const ring3gap = payload.nodes.filter(
      (n) => n.ring === 3 && n.connection_status === 'gap'
    );
    expect(ring3gap.length).toBe(5);
    expect(ring3gap.every((n) => n.linked_action_id === null)).toBe(true);
    // Gap nodes still carry an entity-specific, measurable insight (D015).
    expect(ring3gap.every((n) => (n.entity_insight ?? '').length > 0)).toBe(
      true
    );
    expect(ring3gap[0].entity_insight!.length).toBeLessThanOrEqual(160);

    // session_events is present and honestly empty (no source→perceiver linkage).
    expect(payload.session_events).toEqual([]);
  });

  it('links a Ring 3 gap node to its Action-Stream proposal when one exists (D016)', async () => {
    const supabase = makeSupabase(
      baseTables({
        sage_proposals: {
          data: [
            {
              id: 'prop-citation-1',
              pillar: 'SEO',
              signal_type: 'competitor_citation_gap',
            },
          ],
          error: null,
        },
        // No citations → every AI engine is a gap node.
        citation_monitor_results: { data: [], error: null },
      })
    );
    const payload = await buildEntityMap(supabase, ORG, 'Pravado');

    const ring3 = payload.nodes.filter((n) => n.ring === 3);
    expect(ring3.every((n) => n.connection_status === 'gap')).toBe(true);
    // Every gap node now links to the existing citation-gap proposal.
    expect(ring3.every((n) => n.linked_action_id === 'prop-citation-1')).toBe(
      true
    );
  });
});
