'use client';

/**
 * AnalyticsDateContext — shared date range + comparison state for all analytics tabs.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

export const DATE_RANGES = ['7d', '30d', '60d', '90d'] as const;
export type DateRange = (typeof DATE_RANGES)[number];

export const RANGE_DAYS: Record<DateRange, number> = { '7d': 7, '30d': 30, '60d': 60, '90d': 90 };

interface AnalyticsDateState {
  range: DateRange;
  setRange: (r: DateRange) => void;
  days: number;
  comparisonEnabled: boolean;
  setComparisonEnabled: (v: boolean) => void;
}

const Ctx = createContext<AnalyticsDateState | null>(null);

export function AnalyticsDateProvider({ children }: { children: ReactNode }) {
  const [range, setRange] = useState<DateRange>('30d');
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  return (
    <Ctx.Provider value={{ range, setRange, days: RANGE_DAYS[range], comparisonEnabled, setComparisonEnabled }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAnalyticsDate(): AnalyticsDateState {
  const ctx = useContext(Ctx);
  if (!ctx) {
    // Fallback for components rendered outside the provider
    return { range: '30d', setRange: () => {}, days: 30, comparisonEnabled: false, setComparisonEnabled: () => {} };
  }
  return ctx;
}
