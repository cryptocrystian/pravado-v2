/**
 * useAnalyticsSeo — honest-state tests.
 *
 * Verifies the hook surfaces (a) the real all-empty payload a brand-new org
 * receives and (b) a real error message, without fabricating a fallback. SWR
 * cache is isolated per test via a fresh provider Map so states don't bleed.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { SWRConfig } from 'swr';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAnalyticsSeo } from './useAnalyticsSeo';

function Probe() {
  const { data, isLoading, error } = useAnalyticsSeo();
  if (isLoading) return <div>loading</div>;
  if (error) return <div>error:{error.message}</div>;
  if (!data) return <div>no-data</div>;
  return (
    <div>
      <span data-testid="engine-has">
        {String(data.engineBreakdown.hasData)}
      </span>
      <span data-testid="summary-has">{String(data.summary.hasData)}</span>
      <span data-testid="movement-has">
        {String(data.competitiveMovement.hasData)}
      </span>
      <span data-testid="topic-has">
        {String(data.topicPerformance.hasData)}
      </span>
    </div>
  );
}

function renderWithFreshCache() {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      <Probe />
    </SWRConfig>
  );
}

const EMPTY_PAYLOAD = {
  success: true,
  data: {
    engineBreakdown: {
      engines: [],
      velocity: [],
      velocityEngines: [],
      totalVelocity: [],
      hasData: false,
    },
    summary: {
      trackedKeywords: 0,
      rankedKeywords: 0,
      avgPosition: null,
      totalVolume: null,
      gscKeywords: 0,
      hasData: false,
    },
    competitiveMovement: { movers: [], totalSnapshots: 0, hasData: false },
    topicPerformance: { clusters: [], hasData: false },
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAnalyticsSeo', () => {
  it('surfaces the real all-empty payload as honest-empty panels', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => EMPTY_PAYLOAD,
      })
    );

    renderWithFreshCache();

    await waitFor(() => expect(screen.getByTestId('engine-has')).toBeDefined());
    expect(screen.getByTestId('engine-has').textContent).toBe('false');
    expect(screen.getByTestId('summary-has').textContent).toBe('false');
    expect(screen.getByTestId('movement-has').textContent).toBe('false');
    expect(screen.getByTestId('topic-has').textContent).toBe('false');
  });

  it('surfaces a real error message (no fabricated fallback)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { message: 'boom' },
        }),
      })
    );

    renderWithFreshCache();

    await waitFor(() =>
      expect(screen.getByText(/^error:/).textContent).toContain('boom')
    );
  });
});
