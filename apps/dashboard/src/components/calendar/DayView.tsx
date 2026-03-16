'use client';

/**
 * DayView -- Orchestration Calendar day-level view
 *
 * Displays calendar items grouped by time-of-day bands (Early Morning,
 * Morning, Midday, Afternoon, Evening) with full CalendarItemCard rendering.
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md SS9.1
 */

import type { CalendarItem } from '../command-center/types';
import { CalendarItemCard } from './CalendarItemCard';
import { TIME_GROUPS } from './types';

// ============================================
// TYPES
// ============================================

interface DayViewProps {
  items: CalendarItem[];
  selectedDate: string; // ISO date YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onItemClick: (item: CalendarItem) => void;
  today: string;
}

// ============================================
// HELPERS
// ============================================

/** Parse the hour from a "HH:MM" time string */
function parseHour(time: string): number {
  const [h] = time.split(':');
  return parseInt(h, 10);
}

/** Format an ISO date string to a long display: "Thursday, February 20, 2026" */
function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/** Shift a YYYY-MM-DD date by a number of days and return the new ISO string */
function shiftDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ============================================
// NAVIGATION ARROW SVG
// ============================================

function ChevronLeft() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

// ============================================
// COMPONENT
// ============================================

export function DayView({ items, selectedDate, onSelectDate, onItemClick, today }: DayViewProps) {
  const isToday = selectedDate === today;

  // Filter items to the selected date and sort by time
  const dayItems = items
    .filter((item) => item.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  // Group items into time bands
  const groupedItems = TIME_GROUPS.map((group) => {
    const groupItems = dayItems.filter((item) => {
      const hour = parseHour(item.time);
      return hour >= group.startHour && hour < group.endHour;
    });
    return { ...group, items: groupItems };
  });

  return (
    <div className="flex flex-col h-full">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectDate(shiftDate(selectedDate, -1))}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/90 hover:bg-slate-4 transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(shiftDate(selectedDate, 1))}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/90 hover:bg-slate-4 transition-colors"
            aria-label="Next day"
          >
            <ChevronRight />
          </button>

          <h2 className="text-lg font-semibold text-white/90 tracking-tight">
            {formatLongDate(selectedDate)}
          </h2>

          {isToday && (
            <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border bg-brand-cyan/10 text-brand-cyan border-brand-cyan/30">
              Today
            </span>
          )}
        </div>

        {/* Item count */}
        <span className="text-[13px] text-white/50">
          {dayItems.length} item{dayItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── HOURLY GROUPS (scrollable) ── */}
      <div className="flex-1 overflow-y-auto prave-scroll">
        <div className="px-6 py-4 space-y-6">
          {groupedItems.map((group) => (
            <section key={group.label}>
              {/* Group header */}
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                  {group.label}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/30">
                  {group.startHour === 0 ? '12 AM' : group.startHour < 12 ? `${group.startHour} AM` : group.startHour === 12 ? '12 PM' : `${group.startHour - 12} PM`}
                  {' \u2013 '}
                  {group.endHour === 0 ? '12 AM' : group.endHour < 12 ? `${group.endHour} AM` : group.endHour === 12 ? '12 PM' : group.endHour === 24 ? '12 AM' : `${group.endHour - 12} PM`}
                </span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>

              {/* Items or empty state */}
              {group.items.length > 0 ? (
                <div className="space-y-3">
                  {group.items.map((item) => (
                    <CalendarItemCard key={item.id} item={item} onClick={onItemClick} />
                  ))}
                </div>
              ) : (
                <div className="py-4 flex items-center justify-center">
                  <span className="text-[13px] text-white/30">No items</span>
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
