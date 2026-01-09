'use client';

/**
 * VISUAL AUTHORITY:
 * - Layout: COMMAND_CENTER_REFERENCE.png
 * - Design System: DS_V3_REFERENCE.png
 * - Canon: /docs/canon/DS_v3_PRINCIPLES.md
 *
 * If this component diverges from the reference images,
 * STOP and request clarification.
 */

/**
 * CalendarPeek v3.0 - Outlook-Style Fixed Height Contract
 *
 * CRITICAL CONTRACT:
 * - Container height is FIXED at h-[280px] - DOES NOT CHANGE between views
 * - Day/Week/Month views render DIFFERENTLY (not identical)
 * - Internal scrolling for content overflow
 * - Split-view desktop: Calendar LEFT (fixed), Agenda RIGHT (scrollable)
 * - Mobile: Segmented "Calendar | Agenda" tabs
 *
 * View Behaviors:
 * - Day: Large single-day display with hourly agenda grouping
 * - Week: 7-day strip with selectable days, highlights selectedDate
 * - Month: Compact 6-row grid inside fixed viewport
 *
 * @see /docs/canon/COMMAND-CENTER-UI.md
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

import type { CalendarItem, CalendarStatus, Mode, OrchestrationCalendarResponse, Pillar } from './types';

interface CalendarPeekProps {
  data: OrchestrationCalendarResponse | null;
  isLoading: boolean;
  error: Error | null;
}

type ViewMode = 'day' | 'week' | 'month';
type MobileTab = 'calendar' | 'agenda';

// Pillar colors - contrast-allow: using brand colors per DS v3
const pillarColors: Record<Pillar, { bg: string; text: string; border: string; dot: string }> = {
  pr: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta/30', dot: 'bg-brand-magenta' },
  content: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris/30', dot: 'bg-brand-iris' },
  seo: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/30', dot: 'bg-brand-cyan' },
};

// Status styling
const statusStyles: Record<CalendarStatus, { bg: string; text: string; label: string }> = {
  planned: { bg: 'bg-white/5', text: 'text-white/50', label: 'Planned' },
  drafting: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', label: 'Drafting' },
  awaiting_approval: { bg: 'bg-semantic-warning/10', text: 'text-semantic-warning', label: 'Pending' },
  scheduled: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', label: 'Scheduled' },
  published: { bg: 'bg-semantic-success/10', text: 'text-semantic-success', label: 'Published' },
  failed: { bg: 'bg-semantic-danger/10', text: 'text-semantic-danger', label: 'Failed' },
};

// Mode icons
const modeIcons: Record<Mode, { icon: JSX.Element; label: string; color: string }> = {
  autopilot: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Autopilot',
    color: 'text-brand-cyan',
  },
  copilot: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
      </svg>
    ),
    label: 'Copilot',
    color: 'text-brand-iris',
  },
  manual: {
    icon: (
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Manual',
    color: 'text-white/50',
  },
};

// Helper to format date string
function formatDateKey(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Get items grouped by date
function getItemsByDate(items: CalendarItem[]): Map<string, CalendarItem[]> {
  const grouped = new Map<string, CalendarItem[]>();
  items.forEach((item) => {
    const existing = grouped.get(item.date) || [];
    grouped.set(item.date, [...existing, item]);
  });
  return grouped;
}

// Get pillar distribution for a date
function getPillarDots(items: CalendarItem[]): Pillar[] {
  const pillars = new Set<Pillar>();
  items.forEach((item) => pillars.add(item.pillar));
  return Array.from(pillars);
}

// Time bucket helper for day view
function getTimeBucket(time: string): string {
  const hour = parseInt(time.split(':')[0], 10);
  if (hour < 9) return 'Early Morning';
  if (hour < 12) return 'Morning';
  if (hour < 14) return 'Midday';
  if (hour < 17) return 'Afternoon';
  return 'Evening';
}

// Agenda Item Row Component
function AgendaItemRow({ item, onClick }: { item: CalendarItem; onClick: () => void }) {
  const pillarStyle = pillarColors[item.pillar];
  const statusStyle = statusStyles[item.status];
  const modeInfo = modeIcons[item.mode];

  return (
    <button
      onClick={onClick}
      className="calendar-agenda-item w-full flex items-center gap-2 p-2 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg hover:border-[#2A2A36] hover:shadow-[0_0_8px_rgba(0,217,255,0.05)] transition-all duration-200 group text-left"
    >
      {/* Time */}
      <div className="text-center w-10 flex-shrink-0">
        <p className="text-[11px] font-bold text-white/90">{item.time}</p>
      </div>

      {/* Pillar Accent Bar */}
      <div className={`w-0.5 h-8 rounded-full ${pillarStyle.dot}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`px-1 py-0.5 text-[11px] font-semibold rounded uppercase tracking-wide ${pillarStyle.bg} ${pillarStyle.text}`}>
            {item.pillar}
          </span>
          <span className={`px-1 py-0.5 text-[11px] font-medium rounded ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>
        <p className="text-xs text-white/90 truncate">{item.title}</p>
      </div>

      {/* Quick Actions (visible on hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className={`w-4 h-4 flex items-center justify-center rounded ${modeInfo.color}`} title={modeInfo.label}>
          {modeInfo.icon}
        </span>
      </div>
    </button>
  );
}

// Calendar Day Cell - compact for month view
function CalendarDayCell({
  date,
  isSelected,
  isToday,
  itemCount,
  pillarDots,
  onClick,
  isCurrentMonth,
  compact = false,
}: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  itemCount: number;
  pillarDots: Pillar[];
  onClick: () => void;
  isCurrentMonth: boolean;
  compact?: boolean;
}) {
  const day = date.getDate();

  return (
    <button
      onClick={onClick}
      className={`
        calendar-day-cell relative flex flex-col items-center justify-center rounded
        transition-all duration-200 ease-out
        ${compact ? 'w-full h-7' : 'w-full aspect-square'}
        ${isSelected
          ? 'bg-brand-cyan/20 border border-brand-cyan/40 shadow-[0_0_12px_rgba(0,217,255,0.15)]'
          : isToday
            ? 'bg-brand-iris/10 border border-brand-iris/30'
            : 'hover:bg-[#1A1A24] border border-transparent hover:border-[#2A2A36]'
        }
        ${!isCurrentMonth ? 'opacity-40' : ''}
      `}
    >
      <span className={`
        text-[11px] font-medium
        ${isSelected ? 'text-brand-cyan' : isToday ? 'text-brand-iris' : isCurrentMonth ? 'text-white/90' : 'text-white/30'}
      `}>
        {day}
      </span>

      {/* Pillar dots - only show if not compact */}
      {!compact && pillarDots.length > 0 && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {pillarDots.slice(0, 3).map((pillar, i) => (
            <span key={i} className={`w-1 h-1 rounded-full ${pillarColors[pillar].dot}`} />
          ))}
        </div>
      )}

      {/* Item count badge - compact style for month - typography-allow: badge counts are intentionally small */}
      {itemCount > 0 && (
        <span className={`
          absolute flex items-center justify-center font-bold bg-brand-cyan text-black rounded-full
          ${compact ? '-top-0.5 -right-0.5 w-3.5 h-3.5 text-[9px]' : '-top-0.5 -right-0.5 w-4 h-4 text-[10px]'}
        `}>
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}

// DAY VIEW - Large single day with hourly grouping
function DayView({
  selectedDate,
  onDateSelect,
  items,
  onItemClick,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}) {
  const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());
  const dateLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  // Group items by time bucket
  const buckets = useMemo(() => {
    const grouped = new Map<string, CalendarItem[]>();
    const sortedItems = [...items].sort((a, b) => a.time.localeCompare(b.time));
    sortedItems.forEach((item) => {
      const bucket = getTimeBucket(item.time);
      const existing = grouped.get(bucket) || [];
      grouped.set(bucket, [...existing, item]);
    });
    return grouped;
  }, [items]);

  const bucketOrder = ['Early Morning', 'Morning', 'Midday', 'Afternoon', 'Evening'];

  return (
    <div className="h-full flex flex-col">
      {/* Day Header with Nav */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1A1A24] bg-[#0A0A0F]">
        <button
          onClick={() => {
            const prev = new Date(selectedDate);
            prev.setDate(prev.getDate() - 1);
            onDateSelect(prev);
          }}
          className="p-1 text-white/50 hover:text-white/90 hover:bg-[#1A1A24] rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className={`text-[11px] font-semibold ${isToday ? 'text-brand-cyan' : 'text-white/90'}`}>
            {isToday ? 'Today' : dateLabel}
          </p>
          {isToday && (
            <p className="text-[9px] text-white/50">{dateLabel}</p>
          )}
        </div>
        <button
          onClick={() => {
            const next = new Date(selectedDate);
            next.setDate(next.getDate() + 1);
            onDateSelect(next);
          }}
          className="p-1 text-white/50 hover:text-white/90 hover:bg-[#1A1A24] rounded transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Time Buckets */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A24] flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-white/50">No items scheduled</p>
          </div>
        ) : (
          bucketOrder.map((bucket) => {
            const bucketItems = buckets.get(bucket);
            if (!bucketItems || bucketItems.length === 0) return null;
            return (
              <div key={bucket}>
                <p className="text-[11px] font-semibold text-white/50 uppercase tracking-wider mb-1 px-1">{bucket}</p>
                <div className="space-y-1">
                  {bucketItems.map((item) => (
                    <AgendaItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// WEEK VIEW - 7-day horizontal strip with agenda below
function WeekView({
  selectedDate,
  onDateSelect,
  itemsByDate,
  items,
  onItemClick,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  itemsByDate: Map<string, CalendarItem[]>;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}) {
  // Get start of week (Sunday) for the selected date
  const weekStart = useMemo(() => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }, [selectedDate]);

  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, [weekStart]);

  const today = formatDateKey(new Date());
  const selectedKey = formatDateKey(selectedDate);

  // Week label (e.g., "Jan 5 - 11, 2025")
  const weekLabel = useMemo(() => {
    const start = days[0];
    const end = days[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const year = end.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()} - ${end.getDate()}, ${year}`;
    }
    return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
  }, [days]);

  // Navigate week: ±7 days
  const navigateWeek = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    onDateSelect(newDate);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Week Header with Nav */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#1A1A24] bg-[#0A0A0F]">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-1 text-white/50 hover:text-white/90 hover:bg-[#1A1A24] rounded transition-colors"
          aria-label="Previous week"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[10px] font-medium text-white/70">{weekLabel}</span>
        <button
          onClick={() => navigateWeek(1)}
          className="p-1 text-white/50 hover:text-white/90 hover:bg-[#1A1A24] rounded transition-colors"
          aria-label="Next week"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Week Strip */}
      <div className="flex items-center gap-0.5 p-1.5 bg-[#0A0A0F] border-b border-[#1A1A24]">
        {days.map((date) => {
          const dateKey = formatDateKey(date);
          const dayItems = itemsByDate.get(dateKey) || [];
          const pillarDots = getPillarDots(dayItems);
          const isSelected = selectedKey === dateKey;
          const isToday = dateKey === today;

          return (
            <div key={dateKey} className="flex-1 text-center">
              <p className="text-[11px] text-white/50 uppercase mb-0.5">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <CalendarDayCell
                date={date}
                isSelected={isSelected}
                isToday={isToday}
                itemCount={dayItems.length}
                pillarDots={pillarDots}
                onClick={() => onDateSelect(date)}
                isCurrentMonth={true}
                compact
              />
            </div>
          );
        })}
      </div>

      {/* Agenda for selected day */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
          <span className="text-xs font-semibold text-white/90">
            {selectedKey === today ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <span className="text-[11px] text-white/50">{items.length} items</span>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-white/50 text-center py-4">No items scheduled</p>
        ) : (
          <div className="space-y-1">
            {[...items].sort((a, b) => a.time.localeCompare(b.time)).map((item) => (
              <AgendaItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// MONTH VIEW - Compact 6-row grid with scrollable area
function MonthView({
  selectedDate,
  onDateSelect,
  itemsByDate,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  itemsByDate: Map<string, CalendarItem[]>;
}) {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const today = new Date();
  const todayKey = formatDateKey(today);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const result: { date: Date; isCurrentMonth: boolean }[] = [];

    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      result.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      result.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Next month days (fill to 42 for 6 rows)
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return result;
  }, [selectedDate]);

  const selectedKey = formatDateKey(selectedDate);

  return (
    <div className="h-full flex flex-col p-2">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => {
            const prev = new Date(selectedDate);
            prev.setMonth(prev.getMonth() - 1);
            onDateSelect(prev);
          }}
          className="p-1 text-white/50 hover:text-white/90 hover:bg-[#1A1A24] rounded transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[11px] font-semibold text-white/90">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => {
            const next = new Date(selectedDate);
            next.setMonth(next.getMonth() + 1);
            onDateSelect(next);
          }}
          className="p-1 text-white/50 hover:text-white/90 hover:bg-[#1A1A24] rounded transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {days.map((d, i) => (
          <span key={i} className="text-[11px] text-white/50 text-center font-medium py-0.5">{d}</span>
        ))}
      </div>

      {/* Days grid - scrollable area */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 gap-0.5">
          {calendarDays.map(({ date, isCurrentMonth }, i) => {
            const dateKey = formatDateKey(date);
            const dayItems = itemsByDate.get(dateKey) || [];
            const pillarDots = getPillarDots(dayItems);
            const isSelected = selectedKey === dateKey;
            const isToday = dateKey === todayKey;

            return (
              <CalendarDayCell
                key={i}
                date={date}
                isSelected={isSelected}
                isToday={isToday}
                itemCount={dayItems.length}
                pillarDots={pillarDots}
                onClick={() => onDateSelect(date)}
                isCurrentMonth={isCurrentMonth}
                compact
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Agenda Panel Component (for desktop split view)
function AgendaPanel({
  selectedDate,
  items,
  onItemClick,
}: {
  selectedDate: Date;
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
}) {
  const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());
  const dateLabel = isToday
    ? 'Today'
    : selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => a.time.localeCompare(b.time));
  }, [items]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1A1A24]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
          <span className="text-xs font-semibold text-white/90">{dateLabel}</span>
        </div>
        <span className="text-[11px] text-white/50">{items.length} items</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A24] flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs text-white/50">No items scheduled</p>
          </div>
        ) : (
          sortedItems.map((item) => (
            <AgendaItemRow key={item.id} item={item} onClick={() => onItemClick(item)} />
          ))
        )}
      </div>
    </div>
  );
}

// Schedule Drawer Component
function ScheduleDrawer({
  isOpen,
  onClose,
  item,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: CalendarItem | null;
}) {
  const [selectedMode, setSelectedMode] = useState<Mode>(item?.mode || 'copilot');

  useEffect(() => {
    if (item) setSelectedMode(item.mode);
  }, [item]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const pillarStyle = pillarColors[item.pillar];
  const statusStyle = statusStyles[item.status];
  const itemDate = new Date(`${item.date}T${item.time}`);

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer - slides from right */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-[#0D0D12] border-l border-[#1A1A24] shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1A1A24] bg-[#0A0A0F]">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${pillarStyle.bg} border ${pillarStyle.border} flex items-center justify-center`}>
              <svg className={`w-4 h-4 ${pillarStyle.text}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white/90">Schedule Details</h2>
              <p className="text-[10px] text-white/50">Item configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/50 hover:text-white/90 hover:bg-[#1A1A24] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Item Header */}
          <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-1.5 py-0.5 text-[9px] font-semibold rounded uppercase ${pillarStyle.bg} ${pillarStyle.text}`}>
                {item.pillar}
              </span>
              <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${statusStyle.bg} ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white/90 mb-1">{item.title}</h3>
            <p className="text-[10px] text-white/50">{item.details.summary}</p>
          </div>

          {/* Date & Time */}
          <div>
            <h4 className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-2">Schedule</h4>
            <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white/90">
                  {itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-[10px] text-white/50">at {item.time}</p>
              </div>
              <button className="px-2 py-1 text-[9px] text-brand-cyan hover:bg-brand-cyan/10 rounded border border-brand-cyan/20 transition-colors">
                Reschedule
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <h4 className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-2">Automation Mode</h4>
            <div className="grid grid-cols-3 gap-2">
              {(['manual', 'copilot', 'autopilot'] as Mode[]).map((mode) => {
                const info = modeIcons[mode];
                const isSelected = selectedMode === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setSelectedMode(mode)}
                    className={`
                      p-2 rounded-lg border transition-all text-center
                      ${isSelected
                        ? `bg-${mode === 'autopilot' ? 'brand-cyan' : mode === 'copilot' ? 'brand-iris' : 'white'}/10 border-${mode === 'autopilot' ? 'brand-cyan' : mode === 'copilot' ? 'brand-iris' : 'white'}/30`
                        : 'bg-[#0A0A0F] border-[#1A1A24] hover:border-[#2A2A36]'
                      }
                    `}
                  >
                    <span className={`flex items-center justify-center ${isSelected ? info.color : 'text-white/50'}`}>
                      {info.icon}
                    </span>
                    <p className={`text-[9px] mt-1 font-medium ${isSelected ? 'text-white/90' : 'text-white/50'}`}>{info.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div>
            <h4 className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-2">Details</h4>
            <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/50">Owner</span>
                <span className="text-[10px] text-white/90">{item.details.owner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-white/50">Risk Level</span>
                <span className={`text-[10px] ${item.details.risk === 'high' ? 'text-semantic-danger' : item.details.risk === 'med' ? 'text-semantic-warning' : 'text-semantic-success'}`}>
                  {item.details.risk.charAt(0).toUpperCase() + item.details.risk.slice(1)}
                </span>
              </div>
              {item.details.estimated_duration && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-white/50">Duration</span>
                  <span className="text-[10px] text-white/90">{item.details.estimated_duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Approval State */}
          {item.status === 'awaiting_approval' && (
            <div>
              <h4 className="text-[10px] text-white/50 uppercase tracking-wide font-semibold mb-2">Approval Required</h4>
              <div className="p-3 bg-semantic-warning/8 border border-semantic-warning/20 rounded-lg">
                <p className="text-[10px] text-white/50 mb-2">This item requires approval before execution.</p>
                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-1.5 text-[10px] font-semibold text-white/90 bg-semantic-success/10 border border-semantic-success/30 rounded hover:bg-semantic-success/20 transition-colors">
                    Approve
                  </button>
                  <button className="flex-1 px-3 py-1.5 text-[10px] font-semibold text-white/50 bg-[#1A1A24] border border-[#2A2A36] rounded hover:text-white/90 transition-colors">
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Request Approval Button */}
          {item.status !== 'awaiting_approval' && item.status !== 'published' && (
            <button className="w-full px-3 py-2 text-[10px] font-semibold text-brand-iris bg-brand-iris/10 border border-brand-iris/30 rounded-lg hover:bg-brand-iris/20 transition-colors">
              Request Approval
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1A1A24] bg-[#0A0A0F]">
          <p className="text-[9px] text-white/50 text-center">
            Press <kbd className="px-1 py-0.5 bg-[#1A1A24] rounded text-white/50">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg h-[280px]">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
        <div className="h-4 w-16 bg-white/5 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-2 h-[200px]">
        <div className="bg-[#0A0A0F] border border-[#1F1F28] rounded-lg animate-pulse" />
        <div className="space-y-1.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarPeek({ data, isLoading, error }: CalendarPeekProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [mobileTab, setMobileTab] = useState<MobileTab>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date()); // Auto-select Today
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Group items by date
  const itemsByDate = useMemo(() => {
    if (!data?.items) return new Map<string, CalendarItem[]>();
    return getItemsByDate(data.items.filter((item) => !['published', 'failed'].includes(item.status)));
  }, [data]);

  // Get items for selected date
  const selectedDateItems = useMemo(() => {
    const dateKey = formatDateKey(selectedDate);
    return itemsByDate.get(dateKey) || [];
  }, [itemsByDate, selectedDate]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    // On mobile, switch to agenda when selecting a date
    if (window.innerWidth < 640) {
      setMobileTab('agenda');
    }
  }, []);

  const handleItemClick = useCallback((item: CalendarItem) => {
    setSelectedItem(item);
    setIsDrawerOpen(true);
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  }, []);

  // Go to today
  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white/90">Calendar</h3>
        </div>
        <div className="p-2 bg-semantic-danger/10 border border-semantic-danger/20 rounded text-[10px] text-semantic-danger">
          Failed to load calendar
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg h-[280px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white/90">Calendar</h3>
        </div>
        <p className="text-[10px] text-white/50 text-center py-3">No scheduled items</p>
      </div>
    );
  }

  const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());

  return (
    <>
      {/* FIXED HEIGHT CONTAINER - Outlook-like contract */}
      <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg h-[280px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-cyan" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xs font-semibold text-white/90">Calendar</h3>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-1.5 py-0.5 text-[11px] font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 rounded hover:bg-brand-cyan/15 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          {/* View Toggle - Desktop */}
          <div className="hidden sm:flex items-center bg-[#0A0A0F] rounded p-0.5 border border-[#1A1A24]">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`
                  px-2 py-0.5 text-[11px] font-medium rounded transition-colors
                  ${viewMode === mode ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-white/50 hover:text-white/90'}
                `}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Mobile Tab Switcher */}
          <div className="sm:hidden flex items-center bg-[#0A0A0F] rounded p-0.5 border border-[#1A1A24]">
            {(['calendar', 'agenda'] as MobileTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`
                  px-2 py-0.5 text-[11px] font-medium rounded transition-colors
                  ${mobileTab === tab ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-white/50 hover:text-white/90'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area - fills remaining space */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* Desktop: View-specific layouts */}
          <div className="hidden sm:block h-full">
            {viewMode === 'day' && (
              <div className="h-full grid grid-cols-2 gap-2">
                <div className="bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
                  <DayView
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    items={selectedDateItems}
                    onItemClick={handleItemClick}
                  />
                </div>
                <div className="bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
                  <AgendaPanel
                    selectedDate={selectedDate}
                    items={selectedDateItems}
                    onItemClick={handleItemClick}
                  />
                </div>
              </div>
            )}
            {viewMode === 'week' && (
              <div className="h-full bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
                <WeekView
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  itemsByDate={itemsByDate}
                  items={selectedDateItems}
                  onItemClick={handleItemClick}
                />
              </div>
            )}
            {viewMode === 'month' && (
              <div className="h-full grid grid-cols-2 gap-2">
                <div className="bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
                  <MonthView
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    itemsByDate={itemsByDate}
                  />
                </div>
                <div className="bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
                  <AgendaPanel
                    selectedDate={selectedDate}
                    items={selectedDateItems}
                    onItemClick={handleItemClick}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mobile: Tab-based View */}
          <div className="sm:hidden h-full">
            {mobileTab === 'calendar' && (
              <div className="h-full bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
                <MonthView
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  itemsByDate={itemsByDate}
                />
              </div>
            )}
            {mobileTab === 'agenda' && (
              <div className="h-full bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
                <AgendaPanel
                  selectedDate={selectedDate}
                  items={selectedDateItems}
                  onItemClick={handleItemClick}
                />
              </div>
            )}
          </div>
        </div>

        {/* View Full Calendar Link */}
        <Link
          href="/app/calendar"
          className="mt-2 flex items-center justify-center gap-1.5 px-2 py-1 text-xs font-medium text-brand-cyan bg-brand-cyan/5 border border-brand-cyan/20 rounded hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-all duration-200 group flex-shrink-0"
        >
          View Full Calendar
          <svg className="w-3 h-3 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Schedule Drawer */}
      <ScheduleDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        item={selectedItem}
      />
    </>
  );
}
