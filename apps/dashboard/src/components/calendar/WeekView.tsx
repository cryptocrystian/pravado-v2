'use client';

/**
 * WeekView -- Primary calendar view
 *
 * 7-day horizontal strip with selectable days and an agenda list below.
 * Days run Monday-Sunday. Each day cell shows pillar-colored dots for
 * items scheduled on that day. Selecting a day shows its agenda below.
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md
 */

import { useMemo } from 'react';
import type { CalendarItem } from '../command-center/types';
import { CalendarItemCard } from './CalendarItemCard';
import { PILLAR_CONFIG } from './types';

// ============================================
// PROPS
// ============================================

interface WeekViewProps {
  items: CalendarItem[];
  selectedDate: string; // ISO date YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onItemClick: (item: CalendarItem) => void;
  today: string; // stable reference date
}

// ============================================
// HELPERS
// ============================================

/**
 * Returns an array of 7 ISO date strings (YYYY-MM-DD) for the week
 * containing `dateStr`. Week starts on Monday.
 */
function getWeekDates(dateStr: string): string[] {
  const date = new Date(dateStr + 'T00:00:00');
  // getDay() returns 0 for Sunday; we want Monday = 0
  const dayOfWeek = date.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(date);
  monday.setDate(date.getDate() + mondayOffset);

  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/**
 * Filters items to the given date and sorts by time ascending.
 */
function getItemsForDate(items: CalendarItem[], date: string): CalendarItem[] {
  return items
    .filter((item) => item.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/**
 * Returns abbreviated day name for an ISO date string.
 */
function formatDayName(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();
  // getDay(): 0=Sun, 1=Mon, ...
  const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  return DAY_NAMES[index];
}

/**
 * Returns the day-of-month number for an ISO date string.
 */
function formatDayNumber(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00');
  return date.getDate();
}

/**
 * Returns a Set of pillar names that have at least one item on the given date.
 */
function getDayPillars(items: CalendarItem[], date: string): Set<string> {
  const pillars = new Set<string>();
  for (const item of items) {
    if (item.date === date) {
      pillars.add(item.pillar);
    }
  }
  return pillars;
}

/**
 * Formats a date string into a human-readable label, e.g. "Thursday, Feb 20".
 */
function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

// ============================================
// COMPONENT
// ============================================

export function WeekView({
  items,
  selectedDate,
  onSelectDate,
  onItemClick,
  today,
}: WeekViewProps) {
  const weekDates = useMemo(() => getWeekDates(selectedDate), [selectedDate]);

  const selectedItems = useMemo(
    () => getItemsForDate(items, selectedDate),
    [items, selectedDate],
  );

  return (
    <div className="flex flex-col h-full">
      {/* ========== WEEK STRIP ========== */}
      <div className="grid grid-cols-7 gap-1 p-2">
        {weekDates.map((dateStr) => {
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === today;
          const pillars = getDayPillars(items, dateStr);

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={`
                flex flex-col items-center gap-1 py-2.5 px-1 rounded-lg
                transition-all duration-150 cursor-pointer
                ${
                  isSelected
                    ? 'bg-brand-cyan/10 border border-brand-cyan/30'
                    : isToday
                      ? 'ring-1 ring-brand-cyan/30 border border-transparent hover:bg-slate-4'
                      : 'border border-transparent hover:bg-slate-4'
                }
              `}
            >
              {/* Day name */}
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                {formatDayName(dateStr)}
              </span>

              {/* Day number */}
              <span
                className={`text-sm font-semibold ${
                  isSelected ? 'text-white/90' : 'text-white/70'
                }`}
              >
                {formatDayNumber(dateStr)}
              </span>

              {/* Pillar dots */}
              <div className="flex items-center gap-1 h-2">
                {(['pr', 'content', 'seo'] as const).map((pillar) =>
                  pillars.has(pillar) ? (
                    <span
                      key={pillar}
                      className={`w-1.5 h-1.5 rounded-full ${PILLAR_CONFIG[pillar]?.dotClass ?? ''}`}
                    />
                  ) : null,
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* ========== AGENDA LIST ========== */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 prave-scroll">
        {/* Section header */}
        <div className="flex items-center justify-between px-1 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
            Schedule for {formatDateLabel(selectedDate)}
          </span>
          {selectedItems.length > 0 && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/40">
              {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Items or empty state */}
        {selectedItems.length > 0 ? (
          <div className="flex flex-col gap-3">
            {selectedItems.map((item) => (
              <CalendarItemCard
                key={item.id}
                item={item}
                onClick={onItemClick}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg
              className="w-10 h-10 text-white/20"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-white/40">No scheduled items</span>
          </div>
        )}
      </div>

      {/* Scrollbar styling */}
      <style jsx global>{`
        .prave-scroll::-webkit-scrollbar { width: 4px; }
        .prave-scroll::-webkit-scrollbar-track { background: transparent; }
        .prave-scroll::-webkit-scrollbar-thumb { background: #1F1F28; border-radius: 2px; }
        .prave-scroll::-webkit-scrollbar-thumb:hover { background: #2A2A35; }
      `}</style>
    </div>
  );
}
