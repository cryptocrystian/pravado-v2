'use client';
import { useState, useEffect } from 'react';
import { useCalendarMode } from './CalendarModeContext';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { MonthView } from './MonthView';
import { CalendarActionModal } from './CalendarActionModal';
import type { CalendarItem } from '../command-center/types';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function OrchestrationCalendarShell() {
  const { viewMode } = useCalendarMode();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [today, setToday] = useState<string>(todayISO);
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  // Fetch calendar events from API
  useEffect(() => {
    fetch('/api/calendar/events')
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.events)) {
          setItems(data.events);
        }
      })
      .catch(() => { /* empty state on failure */ });
  }, []);

  // Update today reference on mount (client-side only)
  useEffect(() => {
    setToday(todayISO());
    setSelectedDate(todayISO());
  }, []);

  const emptyState = items.length === 0 ? (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-slate-3 flex items-center justify-center">
          <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-sm text-white/60 font-medium mb-1">No scheduled actions yet</p>
        <p className="text-xs text-white/35">SAGE will populate your calendar as it generates proposals.</p>
      </div>
    </div>
  ) : null;

  return (
    <div className="flex flex-col h-full min-h-0 bg-slate-0">
      <div className="flex-1 min-h-0 overflow-auto">
        {items.length === 0 ? emptyState : (
          <>
            {viewMode === 'day' && (
              <DayView items={items} selectedDate={selectedDate} onSelectDate={setSelectedDate} onItemClick={setSelectedItem} today={today} />
            )}
            {viewMode === 'week' && (
              <WeekView items={items} selectedDate={selectedDate} onSelectDate={setSelectedDate} onItemClick={setSelectedItem} today={today} />
            )}
            {viewMode === 'month' && (
              <MonthView items={items} selectedDate={selectedDate} onSelectDate={setSelectedDate} onItemClick={setSelectedItem} today={today} />
            )}
          </>
        )}
      </div>
      {selectedItem !== null && (
        <CalendarActionModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
