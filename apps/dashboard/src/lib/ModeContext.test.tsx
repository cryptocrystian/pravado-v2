/**
 * #92 harness proof-of-life — ModeContext (Session 1B keystone).
 *
 * Not exhaustive ModeContext coverage — it proves the harness works end to end:
 * React components render (jsdom), hooks run, async useEffect + fetch mocks
 * resolve, user events fire, and jest-dom matchers are available. The harder
 * PR-3/4/5 tests reuse exactly these primitives.
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ModeProvider, useMode } from './ModeContext';

const GET_RESPONSE = {
  success: true,
  pillars: {
    pr: {
      mode: 'copilot',
      source: 'plan_default',
      floor: 'manual',
      ceiling: 'autopilot',
      lockedByAdmin: false,
    },
    content: {
      mode: 'manual',
      source: 'user',
      floor: 'manual',
      ceiling: 'autopilot',
      lockedByAdmin: false,
    },
    seo: {
      mode: 'copilot',
      source: 'fallback',
      floor: 'manual',
      ceiling: 'copilot',
      lockedByAdmin: false,
    },
  },
};

function ContentProbe() {
  const { mode, source, ceiling, isLoading, setMode } = useMode('content');
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="mode">{mode}</span>
      <span data-testid="source">{source}</span>
      <span data-testid="ceiling">{ceiling}</span>
      <button onClick={() => setMode('copilot')}>set-copilot</button>
    </div>
  );
}

describe('ModeContext — harness smoke test (#92)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hydrates useMode("content") from GET /api/orgs/:id/mode and exposes the server shape', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => GET_RESPONSE });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ModeProvider orgId="org-1">
        <ContentProbe />
      </ModeProvider>
    );

    // GET fired on mount against the same-origin proxy.
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/orgs/org-1/mode',
        expect.objectContaining({ cache: 'no-store' })
      )
    );

    // After hydration the content pillar reflects the server row (jest-dom).
    await waitFor(() =>
      expect(screen.getByTestId('mode')).toHaveTextContent('manual')
    );
    expect(screen.getByTestId('source')).toHaveTextContent('user');
    expect(screen.getByTestId('ceiling')).toHaveTextContent('autopilot');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
  });

  it('setMode PATCHes /api/orgs/:id/mode with { pillar, mode } (event simulation)', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((_url: string, opts?: RequestInit) => {
        if (opts?.method === 'PATCH') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              pillar: 'content',
              state: GET_RESPONSE.pillars.content,
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => GET_RESPONSE });
      });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ModeProvider orgId="org-1">
        <ContentProbe />
      </ModeProvider>
    );
    await waitFor(() =>
      expect(screen.getByTestId('loading')).toHaveTextContent('false')
    );

    await userEvent.click(screen.getByText('set-copilot'));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/orgs/org-1/mode',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ pillar: 'content', mode: 'copilot' }),
        })
      )
    );
  });
});
