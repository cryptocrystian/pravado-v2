/**
 * PR-3 — mode-change evaluating transition (interpretation #4).
 *
 * Real React tests via the #92 harness. Drives the ~800ms cosmetic evaluating
 * state with fake timers: it must be timer-authoritative (NOT tied to the PATCH
 * network), per-pillar independent, and clear on rollback.
 */

import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ModeProvider, useMode } from './ModeContext';

type P = 'pr' | 'content' | 'seo';

const GET_RESPONSE = {
  success: true,
  pillars: {
    pr: pillarState('copilot'),
    content: pillarState('copilot'),
    seo: pillarState('copilot'),
  },
};

function pillarState(mode: string) {
  return {
    mode,
    source: 'plan_default',
    floor: 'manual',
    ceiling: 'autopilot',
    lockedByAdmin: false,
  };
}

function Probe({ pillar }: { pillar: P }) {
  const { effectiveMode, isEvaluating, setMode } = useMode(pillar);
  return (
    <div>
      <span data-testid={`${pillar}-eval`}>{String(isEvaluating)}</span>
      <span data-testid={`${pillar}-body`}>
        {isEvaluating ? 'EVALUATING' : `layout-${effectiveMode}`}
      </span>
      <button
        data-testid={`${pillar}-set-manual`}
        onClick={() => setMode('manual')}
      >
        set
      </button>
    </div>
  );
}

/** Fetch mock: GET → pillars; PATCH → success echoing the requested mode (or fail). */
function mockFetch(opts: { patchFails?: boolean } = {}) {
  const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      if (opts.patchFails) {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({ success: false, error: { message: 'boom' } }),
        });
      }
      const body = JSON.parse(String(init.body)) as { pillar: P; mode: string };
      return Promise.resolve({
        ok: true,
        json: async () => ({
          success: true,
          pillar: body.pillar,
          state: pillarState(body.mode),
        }),
      });
    }
    return Promise.resolve({ ok: true, json: async () => GET_RESPONSE });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function flushMicrotasks() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

describe('ModeContext — evaluating transition (PR-3)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fires isEvaluating immediately on setMode and clears after ~800ms → new layout', async () => {
    mockFetch();
    render(
      <ModeProvider orgId="org-1">
        <Probe pillar="content" />
      </ModeProvider>
    );
    await flushMicrotasks(); // hydrate GET

    expect(screen.getByTestId('content-eval')).toHaveTextContent('false');

    fireEvent.click(screen.getByTestId('content-set-manual'));
    expect(screen.getByTestId('content-eval')).toHaveTextContent('true');
    expect(screen.getByTestId('content-body')).toHaveTextContent('EVALUATING');

    await advance(799);
    expect(screen.getByTestId('content-eval')).toHaveTextContent('true'); // not yet

    await advance(1);
    expect(screen.getByTestId('content-eval')).toHaveTextContent('false');
    expect(screen.getByTestId('content-body')).toHaveTextContent(
      'layout-manual'
    );
  });

  it('is timer-authoritative — PATCH resolving early does not clear isEvaluating', async () => {
    mockFetch(); // PATCH succeeds quickly
    render(
      <ModeProvider orgId="org-1">
        <Probe pillar="content" />
      </ModeProvider>
    );
    await flushMicrotasks();

    fireEvent.click(screen.getByTestId('content-set-manual'));
    // Let the PATCH promise resolve WITHOUT advancing the 800ms timer.
    await flushMicrotasks();
    expect(screen.getByTestId('content-eval')).toHaveTextContent('true');

    await advance(800);
    expect(screen.getByTestId('content-eval')).toHaveTextContent('false');
  });

  it('is per-pillar independent — changing PR does not fire Content isEvaluating', async () => {
    mockFetch();
    render(
      <ModeProvider orgId="org-1">
        <Probe pillar="pr" />
        <Probe pillar="content" />
      </ModeProvider>
    );
    await flushMicrotasks();

    fireEvent.click(screen.getByTestId('pr-set-manual'));
    expect(screen.getByTestId('pr-eval')).toHaveTextContent('true');
    expect(screen.getByTestId('content-eval')).toHaveTextContent('false');

    await advance(800);
    expect(screen.getByTestId('pr-eval')).toHaveTextContent('false');
  });

  it('rapid toggles do not clear early — the latest timer is authoritative', async () => {
    mockFetch();
    render(
      <ModeProvider orgId="org-1">
        <Probe pillar="content" />
      </ModeProvider>
    );
    await flushMicrotasks();

    fireEvent.click(screen.getByTestId('content-set-manual'));
    await advance(400); // mid-transition
    fireEvent.click(screen.getByTestId('content-set-manual')); // re-trigger, timer resets
    await advance(400); // total 800 from first, but only 400 from the reset
    expect(screen.getByTestId('content-eval')).toHaveTextContent('true'); // reset timer still running
    await advance(400); // now 800 from the reset
    expect(screen.getByTestId('content-eval')).toHaveTextContent('false');
  });

  it('PATCH failure rolls back the mode AND clears isEvaluating', async () => {
    mockFetch({ patchFails: true });
    render(
      <ModeProvider orgId="org-1">
        <Probe pillar="content" />
      </ModeProvider>
    );
    await flushMicrotasks();
    expect(screen.getByTestId('content-body')).toHaveTextContent(
      'layout-copilot'
    );

    fireEvent.click(screen.getByTestId('content-set-manual'));
    expect(screen.getByTestId('content-eval')).toHaveTextContent('true');

    await advance(800); // PATCH fails (rollback) + timer clears evaluating
    expect(screen.getByTestId('content-eval')).toHaveTextContent('false');
    expect(screen.getByTestId('content-body')).toHaveTextContent(
      'layout-copilot'
    );
  });
});
