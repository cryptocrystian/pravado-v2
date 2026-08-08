/**
 * Wave-2 — ActionStreamPane loop-visibility tests.
 *
 * Drives the real self-fetch integration:
 *   1. A proposal carrying a terminal CRAFT execution renders its outcome (reason +
 *      neutral governed styling) in the History bucket.
 *   2. The empty state renders honestly (no fabricated actions).
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ActionStreamPane } from './ActionStreamPane';
import type { ActionItem } from './types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  // Force comfortable density so the outcome strip (with reason) renders under
  // jsdom, which reports clientHeight 0 and would otherwise collapse to compact.
  useSearchParams: () => new URLSearchParams('density=comfortable'),
}));

function makeItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'prop-1',
    pillar: 'pr',
    type: 'proposal',
    priority: 'high',
    title: 'Pitch FreightWaves on Q4 logistics',
    summary: 'A strong pitch window is open.',
    why: 'Coverage gap against a competitor.',
    recommended_next_step: 'Draft the pitch.',
    signals: [],
    deep_link: { label: 'Open in PR', href: '/app/pr/pitches' },
    controls: ['edit'],
    confidence: 0.9,
    impact: 0.8,
    mode: 'copilot',
    gate: { required: false, reason: null, min_plan: null },
    cta: { primary: 'Execute', secondary: 'Review' },
    updated_at: '2026-07-13T00:00:00.000Z',
    execution_state: null,
    outcome: null,
    ...overrides,
  };
}

function mockFetch(items: ActionItem[]) {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        generated_at: '2026-07-13T00:00:00.000Z',
        items,
      }),
    })
  );
  vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);
  return fetchMock;
}

describe('ActionStreamPane — loop visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders a governed_complete execution outcome (reason) in History', async () => {
    const REASON = 'Pitch failed the personalization gate';
    mockFetch([
      makeItem({
        id: 'prop-refused',
        execution_state: 'completed',
        outcome: {
          result: 'governed_complete',
          reason: REASON,
          kind: 'pr_pitch_governed_refusal',
        },
      }),
    ]);

    render(<ActionStreamPane />);

    // The executed proposal lands in History (terminal lifecycle), so the History
    // tab should carry a count of 1 once the self-fetch resolves.
    const historyTab = await screen.findByRole('button', { name: /History/ });
    await waitFor(() => expect(historyTab).toHaveTextContent('1'));

    fireEvent.click(historyTab);

    // The outcome strip renders its neutral governed title + the real reason.
    expect(await screen.findByText(REASON)).toBeInTheDocument();
    expect(
      screen.getByText(/Governed — No External Send/i)
    ).toBeInTheDocument();
  });

  it('renders an honest empty state when there are no actions', async () => {
    mockFetch([]);

    render(<ActionStreamPane />);

    expect(await screen.findByText('No actions yet')).toBeInTheDocument();
    expect(
      screen.getByText(/SAGE will surface your highest-impact actions/i)
    ).toBeInTheDocument();
  });
});
