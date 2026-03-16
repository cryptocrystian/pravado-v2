'use client';

/**
 * MonthView -- Orchestration Calendar month-level view
 *
 * Desktop split layout: Calendar grid LEFT (~55%) with pillar dot indicators,
 * Agenda panel RIGHT (~45%) showing items for the selected date.
 *
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md SS9.3
 */

import { useMemo } from 'react';
import type { CalendarItem } from '../command-center/types';
import { CalendarItemCard } from './CalendarItemCard';
import { PILLAR_CONFIG } from './types';

// ============================================
// TYPES
// ============================================

interface MonthViewProps {
  items: CalendarItem[];
  selectedDate: string; // ISO date YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onItemClick: (item: CalendarItem) => void;
  today: string;
}

// ============================================
// HELPERS
// ============================================

/** Return "February 2026" format from an ISO date */
function getMonthLabel(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Format an ISO date to a readable display: "Thursday, Feb 20" */
function formatAgendaDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

/** Whether a day belongs to the displayed month */
function isCurrentMonth(dayDate: string, referenceDate: string): boolean {
  return dayDate.slice(0, 7) === referenceDate.slice(0, 7);
}

/** Convert a Date to a YYYY-MM-DD string */
function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/**
 * Generate a 6x7 grid of date strings for a month view.
 * Starts on Monday, pads with dates from previous/next months.
 */
function getMonthGrid(isoDate: string): string[][] {
  const [year, month] = isoDate.split('-').map(Number);

  // First day of the displayed month
  const firstOfMonth = new Date(year, month - 1, 1);

  // Day of week for first of month (0=Sun, 1=Mon, ..., 6=Sat)
  // Convert to Monday-start: Mon=0, Tue=1, ..., Sun=6
  const dow = firstOfMonth.getDay();
  const mondayOffset = dow === 0 ? 6 : dow - 1;

  // Start date: go back to the Monday before (or on) the first of month
  const gridStart = new Date(year, month - 1, 1 - mondayOffset);

  const grid: string[][] = [];
  const cursor = new Date(gridStart);

  for (let week = 0; week < 6; week++) {
    const row: string[] = [];
    for (let day = 0; day < 7; day++) {
      row.push(toISODate(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(row);
  }

  return grid;
}

/** Shift a month forward or backward and return the first day ISO string */
function shiftMonth(isoDate: string, delta: number): string {
  const [year, month] = isoDate.split('-').map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return toISODate(d);
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
// DAY COLUMN HEADERS
// ============================================

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ============================================
// COMPONENT
// ============================================

export function MonthView({ items, selectedDate, onSelectDate, onItemClick, today }: MonthViewProps) {
  const grid = useMemo(() => getMonthGrid(selectedDate), [selectedDate]);
  const monthLabel = getMonthLabel(selectedDate);

  // Items for the selected date (agenda panel)
  const agendaItems = useMemo(
    () =>
      items
        .filter((item) => item.date === selectedDate)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [items, selectedDate],
  );

  // Build a lookup: date -> pillar list for dot indicators
  const pillarsByDate = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const item of items) {
      if (!map[item.date]) map[item.date] = [];
      if (!map[item.date].includes(item.pillar)) {
        map[item.date].push(item.pillar);
      }
    }
    return map;
  }, [items]);

  return (
    <div className="flex flex-col h-full">
      {/* ── MONTH HEADER ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle bg-slate-1">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectDate(shiftMonth(selectedDate, -1))}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/90 hover:bg-slate-4 transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            onClick={() => onSelectDate(shiftMonth(selectedDate, 1))}
            className="p-1.5 rounded-lg text-white/50 hover:text-white/90 hover:bg-slate-4 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight />
          </button>

          <h2 className="text-lg font-semibold text-white/90 tracking-tight">
            {monthLabel}
          </h2>
        </div>
      </div>

      {/* ── SPLIT LAYOUT: Calendar grid + Agenda ── */}
      <div className="flex-1 flex min-h-0">
        {/* ── CALENDAR GRID (LEFT ~55%) ── */}
        <div className="w-[55%] border-r border-border-subtle flex flex-col">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-border-subtle">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-white/50"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div className="flex-1 grid grid-rows-6 overflow-y-auto prave-scroll">
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 border-b border-border-subtle last:border-b-0">
                {week.map((dayDate) => {
                  const inMonth = isCurrentMonth(dayDate, selectedDate);
                  const isSelected = dayDate === selectedDate;
                  const isToday = dayDate === today;
                  const dayNum = parseInt(dayDate.split('-')[2], 10);
                  const pillars = pillarsByDate[dayDate] ?? [];

                  return (
                    <button
                      key={dayDate}
                      type="button"
                      onClick={() => onSelectDate(dayDate)}
                      className={`
                        relative flex flex-col items-center gap-1 py-2 px-1 min-h-[56px]
                        transition-all duration-150 cursor-pointer
                        ${isSelected
                          ? 'bg-brand-cyan/10 border border-brand-cyan/30'
                          : 'border border-transparent hover:bg-slate-4'
                        }
                        ${isToday && !isSelected ? 'ring-1 ring-brand-cyan/30' : ''}
                      `}
                      aria-label={`Select ${dayDate}`}
                      aria-pressed={isSelected}
                    >
                      {/* Day number */}
                      <span
                        className={`text-sm tabular-nums font-medium ${
                          inMonth
                            ? isSelected
                              ? 'text-brand-cyan font-semibold'
                              : 'text-white/85'
                            : 'text-white/30'
                        }`}
                      >
                        {dayNum}
                      </span>

                      {/* Pillar dot indicators */}
                      {pillars.length > 0 && (
                        <div className="flex items-center gap-1">
                          {pillars.map((pillar) => {
                            const conf = PILLAR_CONFIG[pillar];
                            return (
                              <span
                                key={pillar}
                                className={`w-1.5 h-1.5 rounded-full ${conf?.dotClass ?? 'bg-white/30'}`}
                                title={conf?.label ?? pillar}
                              />
                            );
                          })}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* ── AGENDA PANEL (RIGHT ~45%) ── */}
        <div className="w-[45%] flex flex-col bg-page">
          {/* Agenda header */}
          <div className="px-5 py-4 border-b border-border-subtle bg-slate-1">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white/90">
                {formatAgendaDate(selectedDate)}
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">
                {agendaItems.length} item{agendaItems.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Agenda items (scrollable) */}
          <div className="flex-1 overflow-y-auto prave-scroll">
            {agendaItems.length > 0 ? (
              <div className="px-5 py-4 space-y-3">
                {agendaItems.map((item) => (
                  <CalendarItemCard key={item.id} item={item} onClick={onItemClick} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full px-5">
                <span className="text-sm text-white/40">No items for this date</span>
                <span className="text-[13px] text-white/30 mt-1">
                  Select a day with pillar dots to view its items
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
