'use client';

/**
 * PR Mode Context
 *
 * Provides AutomationMode state across the entire PR surface.
 * Replaces prop-drilling through server-component layout boundaries.
 * 
 * Usage:
 *   const { mode, setMode } = usePRMode();
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

export type AutomationMode = 'manual' | 'copilot' | 'autopilot';

interface PRModeContextValue {
  mode: AutomationMode;
  setMode: (mode: AutomationMode) => void;
}

export const PRModeContext = createContext<PRModeContextValue>({
  mode: 'copilot',
  setMode: () => {},
});

export function PRModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AutomationMode>('copilot');
  return (
    <PRModeContext.Provider value={{ mode, setMode }}>
      {children}
    </PRModeContext.Provider>
  );
}

export function usePRMode() {
  return useContext(PRModeContext);
}
