/**
 * EVIDriverBreakdown — real EVI components + honest coverage (Wave-2).
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EVIDriverBreakdown } from './EVIDriverBreakdown';

const useEVICurrent = vi.fn();

vi.mock('@/lib/useEVI', () => ({
  useEVICurrent: () => useEVICurrent(),
}));

describe('EVIDriverBreakdown', () => {
  it('renders real component scores and an honest partial-coverage label', () => {
    useEVICurrent.mockReturnValue({
      isLoading: false,
      data: {
        visibility_score: 62.5,
        authority_score: 40,
        momentum_score: 20,
        signal_breakdown: {
          overall_coverage: 0.55,
          visibility: { coverage: 0.8 },
          authority: { coverage: 0.3 },
          momentum: { coverage: 0.1 },
        },
      },
    });

    render(<EVIDriverBreakdown />);

    expect(screen.getByText('62.5')).toBeInTheDocument();
    expect(screen.getByText('Visibility')).toBeInTheDocument();
    // Overall coverage shown honestly as partial (55%).
    expect(
      screen.getByText(/55% signal coverage — partial/)
    ).toBeInTheDocument();
    // A low-coverage component is honestly flagged insufficient.
    expect(
      screen.getByText(/10% signal coverage — insufficient/)
    ).toBeInTheDocument();
  });

  it('renders honest empty state when no snapshot exists', () => {
    useEVICurrent.mockReturnValue({ isLoading: false, data: null });

    render(<EVIDriverBreakdown />);

    expect(
      screen.getByText(/Drivers appear after the first calculation/i)
    ).toBeInTheDocument();
  });
});
