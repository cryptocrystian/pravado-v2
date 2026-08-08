/**
 * HeadlineMetrics — real values vs honest empty (Wave-2).
 *
 * Verifies the "Earned Placements" card renders a REAL count from
 * /api/media-monitoring/stats when data exists, and an honest zero + guidance
 * copy (not a fabricated number) when no earned mentions are detected.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HeadlineMetrics } from './HeadlineMetrics';

function mockFetch(byUrl: Record<string, unknown>) {
  return vi.fn((input: RequestInfo | URL) => {
    const url = String(input);
    const key = Object.keys(byUrl).find((k) => url.includes(k));
    const body = key ? byUrl[key] : {};
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(body),
    } as Response);
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('HeadlineMetrics', () => {
  it('renders the real earned placements count from media-monitoring stats', async () => {
    global.fetch = mockFetch({
      '/api/evi/current': { data: { delta: 4.2 } },
      '/api/content/items': { data: [{ id: '1' }, { id: '2' }] },
      '/api/media-monitoring/stats': {
        success: true,
        data: { stats: { totalMentions: 7, mentionsThisWeek: 3 } },
      },
      '/api/citemind/monitor/summary': { data: { total_citations: 12 } },
    });

    render(<HeadlineMetrics />);

    await waitFor(() => {
      expect(screen.getByText('7')).toBeInTheDocument();
    });
    expect(screen.getByText('3 in the last 7 days')).toBeInTheDocument();
    // Other real values render too.
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('+4.2')).toBeInTheDocument();
  });

  it('renders an honest zero + guidance when there are no earned mentions', async () => {
    global.fetch = mockFetch({
      '/api/evi/current': { data: { delta: 0 } },
      '/api/content/items': { data: [] },
      '/api/media-monitoring/stats': {
        success: true,
        data: { stats: { totalMentions: 0, mentionsThisWeek: 0 } },
      },
      '/api/citemind/monitor/summary': { data: { total_citations: 0 } },
    });

    render(<HeadlineMetrics />);

    await waitFor(() => {
      expect(
        screen.getByText('no earned mentions detected yet')
      ).toBeInTheDocument();
    });
    // The EVI card shows an honest "+0"; earned placements an honest "0".
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});
