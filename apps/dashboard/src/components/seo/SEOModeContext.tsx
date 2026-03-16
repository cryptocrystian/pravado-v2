'use client';

/**
 * SEO Mode Context
 *
 * Provides AutomationMode state across the entire SEO surface.
 * Same pattern as PRModeContext.
 *
 * Usage:
 *   const { mode, setMode } = useSEOMode();
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

export type AutomationMode = 'manual' | 'copilot' | 'autopilot';

interface SEOModeContextValue {
  mode: AutomationMode;
  setMode: (mode: AutomationMode) => void;
}

const SEOModeContext = createContext<SEOModeContextValue>({
  mode: 'copilot',
  setMode: () => {},
});

export function SEOModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AutomationMode>('copilot');
  return (
    <SEOModeContext.Provider value={{ mode, setMode }}>
      {children}
    </SEOModeContext.Provider>
  );
}

export function useSEOMode() {
  return useContext(SEOModeContext);
}
