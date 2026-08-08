/**
 * TopWins — real EVI-history movers vs honest empty (Wave-2).
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { TopWins } from './TopWins';

const useEVIHistory = vi.fn();

vi.mock('@/lib/useEVI', () => ({
  useEVIHistory: (days: number) => useEVIHistory(days),
}));

function point(overrides: Record<string, unknown>) {
  return {
    date: '2026-01-01',
    evi_score: 50,
    visibility_score: 50,
    authority_score: 50,
    momentum_score: 50,
    ...overrides,
  };
}

describe('TopWins', () => {
  it('renders real movers from EVI history deltas', () => {
    useEVIHistory.mockReturnValue({
      data: [
        point({ date: '2026-01-01', evi_score: 40, visibility_score: 30 }),
        point({ date: '2026-01-30', evi_score: 48, visibility_score: 42 }),
      ],
      isLoading: false,
    });

    render(<TopWins />);

    // Visibility improved +12, EVI improved +8 → both are real wins.
    expect(screen.getByText('Visibility improved')).toBeInTheDocument();
    expect(screen.getByText('+12.0 pts')).toBeInTheDocument();
  });

  it('shows honest empty state with fewer than two snapshots', () => {
    useEVIHistory.mockReturnValue({
      data: [point({ evi_score: 40 })],
      isLoading: false,
    });

    render(<TopWins />);

    expect(
      screen.getByText(/Not enough history yet to show movement/i)
    ).toBeInTheDocument();
    expect(screen.queryByText(/improved/i)).not.toBeInTheDocument();
  });
});
