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
 * CalendarPeek v2.5 - Enhanced Calendar with Day Selection
 *
 * DS v3 density-optimized calendar:
 * - Day/Week/Month view toggle
 * - Desktop: Calendar grid LEFT, Agenda panel RIGHT
 * - Mobile: Segmented "Calendar | Agenda" tabs
 * - Day selection with pillar dots showing item count
 * - ScheduleDrawer for item details + mode/reschedule controls
 *
 * @see /contracts/examples/orchestration-calendar.json
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

// Pillar colors
const pillarColors: Record<Pillar, { bg: string; text: string; border: string; dot: string }> = {
  pr: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta', border: 'border-brand-magenta/30', dot: 'bg-brand-magenta' },
  content: { bg: 'bg-brand-iris/10', text: 'text-brand-iris', border: 'border-brand-iris/30', dot: 'bg-brand-iris' },
  seo: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', border: 'border-brand-cyan/30', dot: 'bg-brand-cyan' },
};

// Status styling
const statusStyles: Record<CalendarStatus, { bg: string; text: string; label: string }> = {
  planned: { bg: 'bg-slate-4/50', text: 'text-slate-6', label: 'Planned' },
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
    color: 'text-slate-5',
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
        <p className="text-[10px] font-bold text-white">{item.time}</p>
      </div>

      {/* Pillar Accent Bar */}
      <div className={`w-0.5 h-8 rounded-full ${pillarStyle.dot}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className={`px-1 py-0.5 text-[7px] font-semibold rounded uppercase tracking-wide ${pillarStyle.bg} ${pillarStyle.text}`}>
            {item.pillar}
          </span>
          <span className={`px-1 py-0.5 text-[7px] font-medium rounded ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>
        <p className="text-[9px] text-white truncate">{item.title}</p>
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

// Calendar Day Cell
function CalendarDayCell({
  date,
  isSelected,
  isToday,
  itemCount,
  pillarDots,
  onClick,
  isCurrentMonth,
}: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  itemCount: number;
  pillarDots: Pillar[];
  onClick: () => void;
  isCurrentMonth: boolean;
}) {
  const day = date.getDate();

  return (
    <button
      onClick={onClick}
      className={`
        calendar-day-cell relative w-full aspect-square flex flex-col items-center justify-center rounded-lg
        transition-all duration-200 ease-out
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
        text-[10px] font-medium
        ${isSelected ? 'text-brand-cyan' : isToday ? 'text-brand-iris' : isCurrentMonth ? 'text-white' : 'text-slate-6'}
      `}>
        {day}
      </span>

      {/* Pillar dots */}
      {pillarDots.length > 0 && (
        <div className="flex items-center gap-0.5 mt-0.5">
          {pillarDots.slice(0, 3).map((pillar, i) => (
            <span key={i} className={`w-1 h-1 rounded-full ${pillarColors[pillar].dot}`} />
          ))}
        </div>
      )}

      {/* Item count badge */}
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 flex items-center justify-center text-[7px] font-bold bg-brand-cyan text-black rounded-full">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}

// Week Strip View (horizontal)
function WeekStripView({
  selectedDate,
  onDateSelect,
  itemsByDate,
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  itemsByDate: Map<string, CalendarItem[]>;
}) {
  const days = useMemo(() => {
    const result: Date[] = [];
    const today = new Date();
    // Show 7 days centered around selected date or today
    const centerDate = selectedDate || today;
    const startDate = new Date(centerDate);
    startDate.setDate(startDate.getDate() - 3);

    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      result.push(d);
    }
    return result;
  }, [selectedDate]);

  const today = formatDateKey(new Date());

  return (
    <div className="flex items-center gap-1 p-1 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
      {days.map((date) => {
        const dateKey = formatDateKey(date);
        const items = itemsByDate.get(dateKey) || [];
        const pillarDots = getPillarDots(items);
        const isSelected = formatDateKey(selectedDate) === dateKey;
        const isToday = dateKey === today;

        return (
          <div key={dateKey} className="flex-1">
            <p className="text-[7px] text-slate-6 text-center mb-0.5 uppercase">
              {date.toLocaleDateString('en-US', { weekday: 'short' })}
            </p>
            <CalendarDayCell
              date={date}
              isSelected={isSelected}
              isToday={isToday}
              itemCount={items.length}
              pillarDots={pillarDots}
              onClick={() => onDateSelect(date)}
              isCurrentMonth={true}
            />
          </div>
        );
      })}
    </div>
  );
}

// Month Grid View
function MonthGridView({
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
    <div className="p-2 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => {
            const prev = new Date(selectedDate);
            prev.setMonth(prev.getMonth() - 1);
            onDateSelect(prev);
          }}
          className="p-1 text-slate-5 hover:text-white hover:bg-[#1A1A24] rounded transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-[10px] font-semibold text-white">
          {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
        <button
          onClick={() => {
            const next = new Date(selectedDate);
            next.setMonth(next.getMonth() + 1);
            onDateSelect(next);
          }}
          className="p-1 text-slate-5 hover:text-white hover:bg-[#1A1A24] rounded transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {days.map((d, i) => (
          <span key={i} className="text-[7px] text-slate-6 text-center font-medium py-1">{d}</span>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {calendarDays.map(({ date, isCurrentMonth }, i) => {
          const dateKey = formatDateKey(date);
          const items = itemsByDate.get(dateKey) || [];
          const pillarDots = getPillarDots(items);
          const isSelected = selectedKey === dateKey;
          const isToday = dateKey === todayKey;

          return (
            <CalendarDayCell
              key={i}
              date={date}
              isSelected={isSelected}
              isToday={isToday}
              itemCount={items.length}
              pillarDots={pillarDots}
              onClick={() => onDateSelect(date)}
              isCurrentMonth={isCurrentMonth}
            />
          );
        })}
      </div>
    </div>
  );
}

// Agenda Panel Component
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
          <span className="text-[10px] font-semibold text-white">{dateLabel}</span>
        </div>
        <span className="text-[9px] text-slate-6">{items.length} items</span>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sortedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-8 h-8 rounded-lg bg-[#1A1A24] flex items-center justify-center mb-2">
              <svg className="w-4 h-4 text-slate-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[9px] text-slate-5">No items scheduled</p>
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
              <h2 className="text-sm font-semibold text-white">Schedule Details</h2>
              <p className="text-[10px] text-slate-5">Item configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-5 hover:text-white hover:bg-[#1A1A24] rounded-lg transition-colors"
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
            <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
            <p className="text-[10px] text-slate-5">{item.details.summary}</p>
          </div>

          {/* Date & Time */}
          <div>
            <h4 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2">Schedule</h4>
            <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-white">
                  {itemDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-[10px] text-slate-5">at {item.time}</p>
              </div>
              <button className="px-2 py-1 text-[9px] text-brand-cyan hover:bg-brand-cyan/10 rounded border border-brand-cyan/20 transition-colors">
                Reschedule
              </button>
            </div>
          </div>

          {/* Mode Selector */}
          <div>
            <h4 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2">Automation Mode</h4>
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
                        ? `bg-${mode === 'autopilot' ? 'brand-cyan' : mode === 'copilot' ? 'brand-iris' : 'slate-5'}/10 border-${mode === 'autopilot' ? 'brand-cyan' : mode === 'copilot' ? 'brand-iris' : 'slate-5'}/30`
                        : 'bg-[#0A0A0F] border-[#1A1A24] hover:border-[#2A2A36]'
                      }
                    `}
                  >
                    <span className={`flex items-center justify-center ${isSelected ? info.color : 'text-slate-5'}`}>
                      {info.icon}
                    </span>
                    <p className={`text-[9px] mt-1 font-medium ${isSelected ? 'text-white' : 'text-slate-5'}`}>{info.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details */}
          <div>
            <h4 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2">Details</h4>
            <div className="p-3 bg-[#0A0A0F] border border-[#1A1A24] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-5">Owner</span>
                <span className="text-[10px] text-white">{item.details.owner}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-slate-5">Risk Level</span>
                <span className={`text-[10px] ${item.details.risk === 'high' ? 'text-semantic-danger' : item.details.risk === 'med' ? 'text-semantic-warning' : 'text-semantic-success'}`}>
                  {item.details.risk.charAt(0).toUpperCase() + item.details.risk.slice(1)}
                </span>
              </div>
              {item.details.estimated_duration && (
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-slate-5">Duration</span>
                  <span className="text-[10px] text-white">{item.details.estimated_duration}</span>
                </div>
              )}
            </div>
          </div>

          {/* Approval State */}
          {item.status === 'awaiting_approval' && (
            <div>
              <h4 className="text-[10px] text-slate-5 uppercase tracking-wide font-semibold mb-2">Approval Required</h4>
              <div className="p-3 bg-semantic-warning/8 border border-semantic-warning/20 rounded-lg">
                <p className="text-[10px] text-slate-5 mb-2">This item requires approval before execution.</p>
                <div className="flex items-center gap-2">
                  <button className="flex-1 px-3 py-1.5 text-[10px] font-semibold text-white bg-semantic-success/10 border border-semantic-success/30 rounded hover:bg-semantic-success/20 transition-colors">
                    Approve
                  </button>
                  <button className="flex-1 px-3 py-1.5 text-[10px] font-semibold text-slate-5 bg-[#1A1A24] border border-[#2A2A36] rounded hover:text-white transition-colors">
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
          <p className="text-[9px] text-slate-6 text-center">
            Press <kbd className="px-1 py-0.5 bg-[#1A1A24] rounded text-slate-5">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-20 bg-slate-5 rounded animate-pulse" />
        <div className="h-4 w-16 bg-slate-5/50 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="h-24 bg-[#0A0A0F] border border-[#1F1F28] rounded-lg animate-pulse" />
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
      <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white">Calendar</h3>
        </div>
        <div className="p-2 bg-semantic-danger/10 border border-semantic-danger/20 rounded text-[10px] text-semantic-danger">
          Failed to load calendar
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-white">Calendar</h3>
        </div>
        <p className="text-[10px] text-slate-6 text-center py-3">No scheduled items</p>
      </div>
    );
  }

  const isToday = formatDateKey(selectedDate) === formatDateKey(new Date());

  return (
    <>
      <div className="p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-cyan" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h3 className="text-xs font-semibold text-white">Calendar</h3>
            {!isToday && (
              <button
                onClick={goToToday}
                className="px-1.5 py-0.5 text-[8px] font-medium text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 rounded hover:bg-brand-cyan/15 transition-colors"
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
                  px-2 py-0.5 text-[9px] font-medium rounded transition-colors
                  ${viewMode === mode ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-slate-5 hover:text-white'}
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
                  px-2 py-0.5 text-[9px] font-medium rounded transition-colors
                  ${mobileTab === tab ? 'bg-brand-cyan/20 text-brand-cyan' : 'text-slate-5 hover:text-white'}
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop: Split View (Calendar LEFT, Agenda RIGHT) */}
        <div className="hidden sm:grid sm:grid-cols-2 gap-2 min-h-[180px]">
          {/* Calendar Side */}
          <div>
            {viewMode === 'day' && (
              <WeekStripView
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                itemsByDate={itemsByDate}
              />
            )}
            {viewMode === 'week' && (
              <WeekStripView
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                itemsByDate={itemsByDate}
              />
            )}
            {viewMode === 'month' && (
              <MonthGridView
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                itemsByDate={itemsByDate}
              />
            )}
          </div>

          {/* Agenda Side */}
          <div className="bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden">
            <AgendaPanel
              selectedDate={selectedDate}
              items={selectedDateItems}
              onItemClick={handleItemClick}
            />
          </div>
        </div>

        {/* Mobile: Tab-based View */}
        <div className="sm:hidden">
          {mobileTab === 'calendar' && (
            <MonthGridView
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              itemsByDate={itemsByDate}
            />
          )}
          {mobileTab === 'agenda' && (
            <div className="bg-[#0A0A0F] border border-[#1A1A24] rounded-lg overflow-hidden min-h-[150px]">
              <AgendaPanel
                selectedDate={selectedDate}
                items={selectedDateItems}
                onItemClick={handleItemClick}
              />
            </div>
          )}
        </div>

        {/* View Full Calendar Link */}
        <Link
          href="/app/calendar"
          className="mt-3 flex items-center justify-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-brand-cyan bg-brand-cyan/5 border border-brand-cyan/20 rounded hover:bg-brand-cyan/10 hover:border-brand-cyan/30 transition-all duration-200 group"
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
