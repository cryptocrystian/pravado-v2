'use client';

/**
 * CalendarViewContext — Day/Week/Month view state for the Calendar surface.
 *
 * Calendar is MODE-AGNOSTIC per ORCHESTRATION_CALENDAR_CONTRACT (it shows a
 * per-item mode badge for each action, but has no pillar mode switcher). The
 * former colocated automation-mode was drift and has been removed; this context
 * now carries only the view toggle. Export names are unchanged to avoid churn.
 */

import { createContext, useContext, useState, type ReactNode } from 'react';

import type { CalendarViewMode } from './types';

interface CalendarViewContextValue {
  viewMode: CalendarViewMode;
  setViewMode: (view: CalendarViewMode) => void;
}

const CalendarModeContext = createContext<CalendarViewContextValue | null>(
  null
);

export function CalendarModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');

  return (
    <CalendarModeContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </CalendarModeContext.Provider>
  );
}

export function useCalendarMode() {
  const ctx = useContext(CalendarModeContext);
  if (!ctx)
    throw new Error('useCalendarMode must be used within CalendarModeProvider');
  return ctx;
}
