'use client';

/**
 * AnalyticsModeContext
 *
 * Mode switcher for the Analytics surface.
 * Manual   = you run reports and pull data manually
 * Copilot  = SAGE surfaces insights, you review
 * Autopilot = SAGE auto-generates scheduled reports
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

export type AnalyticsMode = 'manual' | 'copilot' | 'autopilot';

interface AnalyticsModeCtx {
  mode: AnalyticsMode;
  setMode: (m: AnalyticsMode) => void;
}

const AnalyticsModeContext = createContext<AnalyticsModeCtx>({
  mode: 'copilot',
  setMode: () => {},
});

export function AnalyticsModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AnalyticsMode>('copilot');
  return (
    <AnalyticsModeContext.Provider value={{ mode, setMode }}>
      {children}
    </AnalyticsModeContext.Provider>
  );
}

export function useAnalyticsMode() {
  return useContext(AnalyticsModeContext);
}
