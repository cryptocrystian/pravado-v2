/**
 * EntityMap v3 — concentric-ring rendering, affinity positioning, entity_insight
 * disclosure, gap→action wiring, honest empty state, and D013 (no animation loop).
 *
 * @see /docs/canon/ENTITY_MAP_SPEC.md v2.0
 */

import { render, screen, fireEvent, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntityMap, computeRingLayout } from './EntityMap';
import type { EntityNode, EntityEdge } from './types';

// jsdom has no ResizeObserver — provide a no-op so the sizing effect is inert
// (the component falls back to its default dimensions).
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-extraneous-class
  class RO {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal('ResizeObserver', RO);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function node(overrides: Partial<EntityNode>): EntityNode {
  return {
    id: 'x',
    kind: 'topic_cluster',
    label: 'X',
    ring: 1,
    pillar: 'SEO',
    affinity_score: 50,
    authority_weight: 50,
    connection_status: 'verified_solid',
    linked_action_id: null,
    entity_insight: 'insight',
    impact_pillars: ['SEO'],
    last_updated: '2026-08-07T00:00:00.000Z',
    meta: {},
    ...overrides,
  };
}

const BRAND = node({
  id: 'brand',
  kind: 'brand',
  label: 'Acme',
  ring: 0,
  pillar: null,
  affinity_score: 100,
  authority_weight: 100,
  entity_insight: null,
});

function fullFixture(): { nodes: EntityNode[]; edges: EntityEdge[] } {
  const nodes: EntityNode[] = [
    BRAND,
    node({ id: 'r1a', label: 'AEO Strategy', ring: 1, affinity_score: 90 }),
    node({ id: 'r1b', label: 'Citation Intel', ring: 1, affinity_score: 40 }),
    node({
      id: 'r2',
      kind: 'journalist',
      label: 'Sarah Chen',
      ring: 2,
      pillar: 'PR',
      affinity_score: 70,
      entity_insight:
        'Sarah Chen shows 67 engagement and high topical relevance.',
    }),
    node({
      id: 'r3gap',
      kind: 'ai_engine',
      label: 'ChatGPT',
      ring: 3,
      pillar: 'AEO',
      affinity_score: 0,
      authority_weight: 0,
      connection_status: 'gap',
      linked_action_id: 'act_123',
      entity_insight: 'ChatGPT returned 40 answers with 0 citing Acme.',
    }),
  ];
  const edges: EntityEdge[] = [
    {
      id: 'e1',
      from: 'r1a',
      to: 'brand',
      rel: 'topic_to_brand',
      state: 'verified_solid',
      strength: 80,
      pillar: 'SEO',
      verified_at: null,
    },
    {
      id: 'e2',
      from: 'r1b',
      to: 'brand',
      rel: 'topic_to_brand',
      state: 'gap',
      strength: 0,
      pillar: 'SEO',
      verified_at: null,
    },
    {
      id: 'e3',
      from: 'r2',
      to: 'brand',
      rel: 'journalist_covers',
      state: 'verified_solid',
      strength: 70,
      pillar: 'PR',
      verified_at: null,
    },
    {
      id: 'e4',
      from: 'r3gap',
      to: 'brand',
      rel: 'cites_brand',
      state: 'gap',
      strength: 0,
      pillar: 'AEO',
      verified_at: null,
    },
  ];
  return { nodes, edges };
}

describe('EntityMap v3 — concentric rings', () => {
  it('renders ring 0 core plus ring 1–3 boundaries and node labels', () => {
    const { nodes, edges } = fullFixture();
    render(<EntityMap nodes={nodes} edges={edges} />);

    // Ring 0 Brand Core.
    expect(screen.getByText('Acme')).toBeInTheDocument();
    expect(screen.getByTestId('brand-core-pulse')).toBeInTheDocument();

    // Ring 1–3 boundary bands + OWNED/EARNED/PERCEIVED labels.
    expect(screen.getByTestId('ring-boundary-1')).toBeInTheDocument();
    expect(screen.getByTestId('ring-boundary-2')).toBeInTheDocument();
    expect(screen.getByTestId('ring-boundary-3')).toBeInTheDocument();
    expect(screen.getByText('OWNED')).toBeInTheDocument();
    expect(screen.getByText('EARNED')).toBeInTheDocument();
    expect(screen.getByText('PERCEIVED')).toBeInTheDocument();

    // Outer-ring nodes present.
    expect(screen.getByText('AEO Strategy')).toBeInTheDocument();
    expect(screen.getByText('Sarah Chen')).toBeInTheDocument();
    expect(screen.getByText('ChatGPT')).toBeInTheDocument();
  });

  it('positions nodes on their ring band; higher affinity sits nearer the top', () => {
    const { nodes } = fullFixture();
    const laid = computeRingLayout(nodes, { width: 800, height: 600 });
    const by = (id: string) => laid.find((p) => p.node.id === id)!;

    // Brand core at exact center, ringRadius 0.
    expect(by('brand').ringRadius).toBe(0);

    // Ring bands increase outward: ring1 < ring2 < ring3.
    expect(by('r1a').ringRadius).toBeLessThan(by('r2').ringRadius);
    expect(by('r2').ringRadius).toBeLessThan(by('r3gap').ringRadius);

    // Same ring: higher affinity (r1a=90) sits above lower affinity (r1b=40)
    // → smaller y (canon §2 top = highest affinity).
    expect(by('r1a').y).toBeLessThan(by('r1b').y);

    // Node radius encodes authority_weight (gap r3gap=0 is smaller than r1a=50).
    expect(by('r3gap').radius).toBeLessThan(by('r1a').radius);
  });

  it('shows entity_insight in the progressive disclosure panel on select (D015)', () => {
    const { nodes, edges } = fullFixture();
    render(<EntityMap nodes={nodes} edges={edges} />);

    // No panel until a node is selected (progressive disclosure).
    expect(screen.queryByTestId('entity-disclosure-panel')).toBeNull();

    fireEvent.click(screen.getByTestId('entity-node-r2'));

    const panel = screen.getByTestId('entity-disclosure-panel');
    expect(within(panel).getByTestId('entity-insight')).toHaveTextContent(
      'topical relevance'
    );
  });

  it('routes a gap node with a linked action to the Action Stream (D016)', () => {
    const { nodes, edges } = fullFixture();
    const onOpenAction = vi.fn();
    const focusEvents: string[] = [];
    const handler = (e: Event) =>
      focusEvents.push((e as CustomEvent).detail.actionId);
    window.addEventListener('cc:focus-action', handler);

    render(
      <EntityMap nodes={nodes} edges={edges} onOpenAction={onOpenAction} />
    );
    fireEvent.click(screen.getByTestId('entity-node-r3gap'));

    expect(onOpenAction).toHaveBeenCalledWith('act_123');
    expect(focusEvents).toContain('act_123');

    window.removeEventListener('cc:focus-action', handler);
  });

  it('renders an honest empty state when there are no ring nodes', () => {
    render(<EntityMap nodes={[BRAND]} edges={[]} />);
    expect(screen.getByTestId('entity-map-empty')).toBeInTheDocument();
    expect(screen.getByText('No entity signals yet')).toBeInTheDocument();
    // Never fabricates ring boundaries when there is nothing to show.
    expect(screen.queryByTestId('ring-boundary-1')).toBeNull();
  });

  it('D013: uses no continuous-animation timer (no rAF / setInterval loop)', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    const interval = vi.spyOn(window, 'setInterval');
    const { nodes, edges } = fullFixture();

    render(<EntityMap nodes={nodes} edges={edges} sessionEvents={[]} />);

    expect(raf).not.toHaveBeenCalled();
    expect(interval).not.toHaveBeenCalled();
  });
});
