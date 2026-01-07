'use client';

/**
 * CalendarPeek - Upcoming Calendar Items Widget
 *
 * Minimal list showing upcoming orchestration items.
 * Full calendar surface will be built in a future sprint.
 *
 * @see /contracts/examples/orchestration-calendar.json
 */

import type { OrchestrationCalendarResponse, CalendarItem, Pillar, CalendarStatus } from './types';

interface CalendarPeekProps {
  data: OrchestrationCalendarResponse | null;
  isLoading: boolean;
  error: Error | null;
}

// Pillar colors
const pillarColors: Record<Pillar, { bg: string; text: string }> = {
  pr: { bg: 'bg-brand-magenta/10', text: 'text-brand-magenta' },
  content: { bg: 'bg-brand-iris/10', text: 'text-brand-iris' },
  seo: { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan' },
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

function CalendarItemRow({ item }: { item: CalendarItem }) {
  const pillarStyle = pillarColors[item.pillar];
  const statusStyle = statusStyles[item.status];

  // Format date for display
  const itemDate = new Date(`${item.date}T${item.time}`);
  const isToday = item.date === new Date().toISOString().split('T')[0];
  const isTomorrow = item.date === new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const dateLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : itemDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center gap-3 p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg hover:border-slate-4 transition-colors">
      {/* Time */}
      <div className="text-center w-14 flex-shrink-0">
        <p className="text-xs text-slate-6">{dateLabel}</p>
        <p className="text-sm font-medium text-white">{item.time}</p>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-[#1F1F28]" />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded uppercase ${pillarStyle.bg} ${pillarStyle.text}`}>
            {item.pillar}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${statusStyle.bg} ${statusStyle.text}`}>
            {statusStyle.label}
          </span>
        </div>
        <p className="text-sm text-white truncate">{item.title}</p>
      </div>

      {/* Mode indicator */}
      <div className="flex-shrink-0">
        {item.mode === 'autopilot' && (
          <div className="w-6 h-6 flex items-center justify-center bg-brand-cyan/10 rounded-full" title="Autopilot">
            <svg className="w-3.5 h-3.5 text-brand-cyan" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
          </div>
        )}
        {item.mode === 'copilot' && (
          <div className="w-6 h-6 flex items-center justify-center bg-brand-iris/10 rounded-full" title="Copilot">
            <svg className="w-3.5 h-3.5 text-brand-iris" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
          </div>
        )}
        {item.mode === 'manual' && (
          <div className="w-6 h-6 flex items-center justify-center bg-slate-4/50 rounded-full" title="Manual">
            <svg className="w-3.5 h-3.5 text-slate-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 p-3 bg-[#13131A] border border-[#1F1F28] rounded-lg animate-pulse">
          <div className="w-14 flex-shrink-0">
            <div className="h-3 w-10 bg-slate-5 rounded mx-auto mb-1" />
            <div className="h-4 w-12 bg-slate-4 rounded mx-auto" />
          </div>
          <div className="w-px h-10 bg-[#1F1F28]" />
          <div className="flex-1">
            <div className="flex gap-2 mb-1">
              <div className="h-4 w-8 bg-slate-5 rounded" />
              <div className="h-4 w-12 bg-slate-5 rounded" />
            </div>
            <div className="h-4 w-3/4 bg-slate-4 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarPeek({ data, isLoading, error }: CalendarPeekProps) {
  if (isLoading) {
    return (
      <div className="p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Upcoming</h3>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Upcoming</h3>
        </div>
        <div className="p-3 bg-semantic-danger/10 border border-semantic-danger/20 rounded text-xs text-semantic-danger">
          Failed to load calendar
        </div>
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Upcoming</h3>
        </div>
        <p className="text-xs text-slate-6 text-center py-4">No upcoming items</p>
      </div>
    );
  }

  // Filter to upcoming items (not published/failed) and sort by date
  const today = new Date().toISOString().split('T')[0];
  const upcomingItems = data.items
    .filter((item) => item.date >= today && !['published', 'failed'].includes(item.status))
    .sort((a, b) => {
      const dateA = `${a.date}T${a.time}`;
      const dateB = `${b.date}T${b.time}`;
      return dateA.localeCompare(dateB);
    })
    .slice(0, 5);

  return (
    <div className="p-4 bg-[#13131A] border border-[#1F1F28] rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Upcoming</h3>
        <span className="text-xs text-slate-6">{upcomingItems.length} items</span>
      </div>
      <div className="space-y-2">
        {upcomingItems.map((item) => (
          <CalendarItemRow key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
