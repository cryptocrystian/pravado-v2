/**
 * Orchestration Calendar Page
 *
 * Route: /app/calendar
 * The Calendar answers "When will the system act, and when do I need to intervene?"
 * It is CRAFT's execution timeline made visible.
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md
 */

'use client';

// Force dynamic rendering to avoid SSG errors
export const dynamic = 'force-dynamic';

import { OrchestrationCalendarShell } from '@/components/calendar/OrchestrationCalendarShell';

export default function CalendarPage() {
  return <OrchestrationCalendarShell />;
}
