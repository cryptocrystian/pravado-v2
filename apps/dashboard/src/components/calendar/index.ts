/**
 * Orchestration Calendar — Barrel Export
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md
 */

export { OrchestrationCalendarShell } from './OrchestrationCalendarShell';
export { CalendarModeProvider, useCalendarMode } from './CalendarModeContext';
export { CalendarChromeBar } from './CalendarChromeBar';
export { CalendarShell } from './CalendarShell';
export { WeekView } from './WeekView';
export { DayView } from './DayView';
export { MonthView } from './MonthView';
export { CalendarActionModal } from './CalendarActionModal';

export type {
  CalendarViewMode,
  StatusConfig,
  ModeConfig,
  PillarConfig,
} from './types';

export {
  STATUS_CONFIG,
  MODE_CONFIG,
  PILLAR_CONFIG,
  RISK_CONFIG,
  TIME_GROUPS,
} from './types';
