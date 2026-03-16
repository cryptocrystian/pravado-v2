'use client';

/**
 * CalendarModeContext — Global state for Calendar surface
 *
 * Manages:
 * - AutomationMode (manual | copilot | autopilot)
 * - CalendarViewMode (day | week | month)
 *
 * Both are colocated here so CalendarChromeBar and
 * OrchestrationCalendarShell share state without prop drilling.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';
import type { CalendarViewMode } from './types';

export type AutomationMode = 'manual' | 'copilot' | 'autopilot';

interface CalendarModeContextValue {
  mode: AutomationMode;
  setMode: (mode: AutomationMode) => void;
  viewMode: CalendarViewMode;
  setViewMode: (view: CalendarViewMode) => void;
}

const CalendarModeContext = createContext<CalendarModeContextValue | null>(null);

export function CalendarModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AutomationMode>('copilot');
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');

  return (
    <CalendarModeContext.Provider value={{ mode, setMode, viewMode, setViewMode }}>
      {children}
    </CalendarModeContext.Provider>
  );
}

export function useCalendarMode() {
  const ctx = useContext(CalendarModeContext);
  if (!ctx) throw new Error('useCalendarMode must be used within CalendarModeProvider');
  return ctx;
}
