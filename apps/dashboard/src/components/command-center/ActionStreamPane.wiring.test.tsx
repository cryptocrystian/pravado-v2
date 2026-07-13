/**
 * PR-5b — ActionStreamPane modal mount + PATCH wiring.
 *
 * Drives the real integration: the pane self-fetches the action stream, Review
 * (card click) opens the mounted ActionModal, and Execute/Dismiss fire the PATCH
 * proxy. Success removes the proposal from the list and closes the modal; failure
 * keeps it open in the error/Retry state; the idempotent success PR-5a returns is
 * treated as success.
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ActionStreamPane } from './ActionStreamPane';
import type { ActionItem } from './types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const TITLE = 'Pitch FreightWaves on Q4 logistics';

function makeItem(overrides: Partial<ActionItem> = {}): ActionItem {
  return {
    id: 'prop-1',
    pillar: 'pr',
    type: 'proposal',
    priority: 'high',
    title: TITLE,
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
    ...overrides,
  };
}

function mockFetch(
  opts: {
    patchFails?: boolean;
    idempotent?: boolean;
    items?: ActionItem[];
  } = {}
) {
  const items = opts.items ?? [makeItem()];
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      if (opts.patchFails) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: { message: 'boom' } }),
        });
      }
      const body = JSON.parse(String(init.body)) as { action: string };
      const newStatus = body.action === 'execute' ? 'executed' : 'dismissed';
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          proposal: { id: 'prop-1', status: newStatus },
          // idempotent: previous_status === new status (terminal no-op)
          previous_status: opts.idempotent ? newStatus : 'active',
        }),
      });
    }
    // GET action-stream
    return Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        generated_at: '2026-07-13T00:00:00.000Z',
        items,
      }),
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function openModal() {
  await waitFor(() =>
    expect(screen.getAllByText(TITLE)[0]).toBeInTheDocument()
  );
  // Card body click opens the modal (INTERACTION CONTRACT v2.0).
  fireEvent.click(screen.getAllByText(TITLE)[0]);
  await waitFor(() => expect(screen.getByRole('dialog')).toBeInTheDocument());
  return screen.getByRole('dialog');
}

function patchBody(fetchMock: ReturnType<typeof vi.fn>) {
  const call = fetchMock.mock.calls.find(
    (c) => (c[1] as RequestInit | undefined)?.method === 'PATCH'
  );
  return {
    url: call?.[0] as string,
    body: JSON.parse(String((call?.[1] as RequestInit).body)),
  };
}

describe('ActionStreamPane — modal mount + PATCH wiring (PR-5b)', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      }
    );
  });
  afterEach(() => vi.restoreAllMocks());

  it('opens the modal on Review (card click) with Execute + Dismiss', async () => {
    mockFetch();
    render(<ActionStreamPane />);
    const dialog = await openModal();
    expect(
      within(dialog).getByRole('button', { name: 'Execute' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Dismiss' })
    ).toBeInTheDocument();
  });

  it('Execute fires PATCH {action:execute}, removes the item, closes the modal', async () => {
    const fetchMock = mockFetch();
    render(<ActionStreamPane />);
    const dialog = await openModal();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Execute' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const { url, body } = patchBody(fetchMock);
    expect(url).toBe('/api/command-center/proposals/prop-1');
    expect(body).toEqual({ action: 'execute' });
    // Optimistic removal — the acted proposal leaves the list.
    expect(screen.queryByText(TITLE)).toBeNull();
  });

  it('Dismiss fires PATCH {action:dismiss} and removes the item', async () => {
    const fetchMock = mockFetch();
    render(<ActionStreamPane />);
    const dialog = await openModal();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Dismiss' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(patchBody(fetchMock).body).toEqual({ action: 'dismiss' });
    expect(screen.queryByText(TITLE)).toBeNull();
  });

  it('a failed PATCH keeps the modal open and surfaces Retry', async () => {
    mockFetch({ patchFails: true });
    render(<ActionStreamPane />);
    const dialog = await openModal();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Execute' }));

    await waitFor(() =>
      expect(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: /Retry/i,
        })
      ).toBeInTheDocument()
    );
    // Modal stayed open; item not removed.
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('an idempotent success (previous_status === status) is treated as success', async () => {
    mockFetch({ idempotent: true });
    render(<ActionStreamPane />);
    const dialog = await openModal();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Execute' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByText(TITLE)).toBeNull();
  });
});
