/**
 * PR-4a — plan-tier ceiling enforcement, client handling.
 *
 * When the server clamps an above-ceiling write (200-with-clamp, NOT 403 —
 * architect H3), the client must: reflect the CLAMPED mode locally, expose the
 * originally-requested mode for a subtle hint, and show NO popup/modal (canon:
 * no dark patterns). These tests drive `useMode().setMode(...)` against a fetch
 * mock that echoes a clamped `state`.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { ModeProvider, useMode } from './ModeContext';

// Starter-like hydration: Copilot ceiling on every pillar.
const GET_RESPONSE = {
  success: true,
  pillars: {
    pr: pillar('copilot'),
    content: pillar('copilot'),
    seo: pillar('copilot'),
  },
};

function pillar(mode: string, ceiling = 'copilot') {
  return {
    mode,
    source: 'plan_default',
    floor: 'manual',
    ceiling,
    lockedByAdmin: false,
  };
}

function Probe() {
  const { effectiveMode, source, requestedMode, setMode } = useMode('content');
  return (
    <div>
      <span data-testid="mode">{effectiveMode}</span>
      <span data-testid="source">{source}</span>
      <span data-testid="requested">{requestedMode ?? 'none'}</span>
      <button data-testid="set-autopilot" onClick={() => setMode('autopilot')}>
        autopilot
      </button>
      <button data-testid="set-copilot" onClick={() => setMode('copilot')}>
        copilot
      </button>
    </div>
  );
}

/**
 * GET → starter pillars. PATCH → the server enforcement: an `autopilot` request
 * (above the Copilot ceiling) comes back clamped with source `clamped` +
 * `requestedMode`; anything at/below the ceiling comes back as `user`.
 */
function mockFetch() {
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      const body = JSON.parse(String(init.body)) as { mode: string };
      const clamped = body.mode === 'autopilot';
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          pillar: 'content',
          state: clamped
            ? {
                mode: 'copilot',
                source: 'clamped',
                floor: 'manual',
                ceiling: 'copilot',
                lockedByAdmin: false,
                requestedMode: 'autopilot',
              }
            : pillar(body.mode),
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => GET_RESPONSE });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('ModeContext — ceiling clamp handling (PR-4a)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reflects the clamped mode locally and exposes requestedMode', async () => {
    mockFetch();
    render(
      <ModeProvider orgId="org-1">
        <Probe />
      </ModeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('copilot')
    );

    fireEvent.click(screen.getByTestId('set-autopilot'));

    // After the PATCH reconciles, local state shows the CLAMPED mode (copilot),
    // source `clamped`, and the originally-requested `autopilot`.
    await waitFor(() =>
      expect(screen.getByTestId('source')).toHaveTextContent('clamped')
    );
    expect(screen.getByTestId('mode')).toHaveTextContent('copilot');
    expect(screen.getByTestId('requested')).toHaveTextContent('autopilot');
  });

  it('shows no popup/modal on clamp (canon: no dark patterns)', async () => {
    mockFetch();
    render(
      <ModeProvider orgId="org-1">
        <Probe />
      </ModeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('copilot')
    );

    fireEvent.click(screen.getByTestId('set-autopilot'));
    await waitFor(() =>
      expect(screen.getByTestId('source')).toHaveTextContent('clamped')
    );

    // No interrupting UI: nothing renders a dialog/alert on a clamp.
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.querySelector('[role="alert"]')).toBeNull();
  });

  it('a subsequent within-ceiling change clears requestedMode + source', async () => {
    mockFetch();
    render(
      <ModeProvider orgId="org-1">
        <Probe />
      </ModeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('copilot')
    );

    fireEvent.click(screen.getByTestId('set-autopilot')); // clamps
    await waitFor(() =>
      expect(screen.getByTestId('requested')).toHaveTextContent('autopilot')
    );

    fireEvent.click(screen.getByTestId('set-copilot')); // within ceiling
    await waitFor(() =>
      expect(screen.getByTestId('source')).toHaveTextContent('user')
    );
    expect(screen.getByTestId('requested')).toHaveTextContent('none');
  });
});
