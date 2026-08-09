'use client';

/**
 * Content Calendar View
 *
 * Real content scheduling over the `content_calendar` table (migration 105).
 * Users schedule an EXISTING content item onto a date; the calendar groups
 * entries by `scheduled_at`.
 *
 * SCOPE — scheduling metadata + click-to-open ONLY:
 * - Scheduling an item does NOT publish it and never routes through publish
 *   governance. `automation_mode` is stored/shown as metadata, not a trigger.
 * - Clicking a calendar entry opens the asset work surface (no publish).
 *
 * Honest states: loading skeleton, empty ("No content scheduled yet"), and a
 * real upstream error (no fabricated fallback data).
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md Section 4.4 (calendar integration)
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md Section 3.2 (day view behavior)
 */

import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';

import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';
import {
  useContentCalendar,
  type CalendarEntry,
} from '../hooks/useContentCalendar';
import { useContentItems } from '../hooks/useContentData';
import type { AutomationMode, ContentType } from '../types';

// ============================================
// TYPE LABELS (Content pillar = iris; type is shown as a muted label, not a
// decorative color — pillar colors are functional, not decorative.)
// ============================================

const TYPE_LABELS: Record<string, string> = {
  blog_post: 'Blog Post',
  long_form: 'Long-Form',
  landing_page: 'Landing Page',
  guide: 'Guide',
  case_study: 'Case Study',
};

const MODE_LABELS: Record<AutomationMode, string> = {
  manual: 'Manual',
  copilot: 'Copilot',
  autopilot: 'Autopilot',
};

// ============================================
// DATE UTILITIES
// ============================================

function getMonthDays(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// datetime-local <-> ISO helpers (values are local wall-clock; the API stores
// timezone-aware timestamps).
function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
  return new Date(value).toISOString();
}

function defaultInputForDay(cellDate: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${cellDate.getFullYear()}-${pad(cellDate.getMonth() + 1)}-${pad(
    cellDate.getDate()
  )}T09:00`;
}

// ============================================
// SCHEDULE / RESCHEDULE MODAL STATE
// ============================================

interface ModalState {
  mode: 'create' | 'edit';
  entryId?: string;
  /** Locked asset title (edit mode) */
  assetTitle?: string;
  assetId: string;
  date: string; // datetime-local value
  campaign: string;
  theme: string;
  automationMode: AutomationMode;
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentCalendarView() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const today = new Date();

  const {
    entries,
    isLoading,
    error,
    scheduleEntry,
    rescheduleEntry,
    unscheduleEntry,
  } = useContentCalendar();

  // Existing content items to choose from when scheduling.
  const { assets } = useContentItems({ limit: 100 });

  const [modal, setModal] = useState<ModalState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());

  // Group real calendar entries by scheduled day.
  const entriesByDate = useMemo(() => {
    const map = new Map<string, CalendarEntry[]>();
    entries.forEach((entry) => {
      const d = new Date(entry.scheduledAt);
      const key = dayKey(d);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    });
    return map;
  }, [entries]);

  const prevMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  const nextMonth = () =>
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  const goToToday = () => setCurrentDate(new Date());

  const openAsset = useCallback(
    (assetId: string) => {
      // Click-to-open only. Never publishes.
      router.push(`/app/content/asset/${assetId}`);
    },
    [router]
  );

  const openCreateModal = useCallback((cellDate?: Date) => {
    setActionError(null);
    setModal({
      mode: 'create',
      assetId: '',
      date: cellDate ? defaultInputForDay(cellDate) : '',
      campaign: '',
      theme: '',
      automationMode: 'manual',
    });
  }, []);

  const openEditModal = useCallback((entry: CalendarEntry) => {
    setActionError(null);
    setModal({
      mode: 'edit',
      entryId: entry.id,
      assetTitle: entry.asset?.title ?? 'Scheduled item',
      assetId: entry.assetId,
      date: isoToLocalInput(entry.scheduledAt),
      campaign: entry.campaign ?? '',
      theme: entry.theme ?? '',
      automationMode: entry.automationMode,
    });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
    setSubmitting(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!modal) return;
    setActionError(null);

    if (!modal.date) {
      setActionError('Pick a date and time.');
      return;
    }
    if (modal.mode === 'create' && !modal.assetId) {
      setActionError('Choose a content item to schedule.');
      return;
    }

    setSubmitting(true);
    try {
      if (modal.mode === 'create') {
        await scheduleEntry({
          asset_id: modal.assetId,
          scheduled_at: localInputToIso(modal.date),
          campaign: modal.campaign || undefined,
          theme: modal.theme || undefined,
          automation_mode: modal.automationMode,
        });
      } else if (modal.entryId) {
        await rescheduleEntry(modal.entryId, {
          scheduled_at: localInputToIso(modal.date),
          campaign: modal.campaign ? modal.campaign : null,
          theme: modal.theme ? modal.theme : null,
          automation_mode: modal.automationMode,
        });
      }
      closeModal();
    } catch (e) {
      setSubmitting(false);
      setActionError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }, [modal, scheduleEntry, rescheduleEntry, closeModal]);

  const handleUnschedule = useCallback(
    async (entryId: string) => {
      setActionError(null);
      try {
        await unscheduleEntry(entryId);
      } catch (e) {
        setActionError(
          e instanceof Error ? e.message : 'Failed to unschedule.'
        );
      }
    },
    [unscheduleEntry]
  );

  // ---- Honest states -------------------------------------------------------

  if (isLoading) {
    return <ContentLoadingSkeleton type="calendar" />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">
            Failed to load calendar
          </h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <>
        <div className="flex-1 flex flex-col">
          <CalendarHeader
            label={formatMonthYear(currentDate)}
            onPrev={prevMonth}
            onNext={nextMonth}
            onToday={goToToday}
            onSchedule={() => openCreateModal()}
          />
          <ContentEmptyState
            view="calendar"
            onAction={() => openCreateModal()}
            actionLabel="Schedule content"
          />
        </div>
        {modal && (
          <ScheduleModal
            state={modal}
            assets={assets}
            submitting={submitting}
            error={actionError}
            onChange={setModal}
            onClose={closeModal}
            onSubmit={handleSubmit}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <CalendarHeader
        label={formatMonthYear(currentDate)}
        onPrev={prevMonth}
        onNext={nextMonth}
        onToday={goToToday}
        onSchedule={() => openCreateModal()}
      />

      {actionError && (
        <div className="px-4 py-2">
          <p className="text-xs text-semantic-danger">{actionError}</p>
        </div>
      )}

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-border-subtle">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="px-2 py-2 text-center text-xs text-white/40 uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 auto-rows-[minmax(110px,1fr)]">
          {days.map((day, index) => {
            if (day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="border-r border-b border-border-subtle bg-slate-0"
                />
              );
            }

            const cellDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              day
            );
            const isToday = isSameDay(cellDate, today);
            const cellEntries = entriesByDate.get(dayKey(cellDate)) || [];

            return (
              <CalendarCell
                key={dayKey(cellDate)}
                day={day}
                isToday={isToday}
                entries={cellEntries}
                onOpenAsset={openAsset}
                onEdit={openEditModal}
                onUnschedule={handleUnschedule}
                onAddOnDay={() => openCreateModal(cellDate)}
              />
            );
          })}
        </div>
      </div>

      {modal && (
        <ScheduleModal
          state={modal}
          assets={assets}
          submitting={submitting}
          error={actionError}
          onChange={setModal}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ============================================
// HEADER
// ============================================

interface CalendarHeaderProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onSchedule: () => void;
}

function CalendarHeader({
  label,
  onPrev,
  onNext,
  onToday,
  onSchedule,
}: CalendarHeaderProps) {
  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-border-subtle">
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          aria-label="Previous month"
          className="p-1.5 text-white/50 hover:text-white hover:bg-slate-4/50 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <span className="text-sm font-semibold text-white min-w-[140px] text-center">
          {label}
        </span>
        <button
          onClick={onNext}
          aria-label="Next month"
          className="p-1.5 text-white/50 hover:text-white hover:bg-slate-4/50 rounded-lg transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
        <button
          onClick={onToday}
          className="px-3 py-1.5 text-xs text-brand-iris hover:bg-brand-iris/10 rounded-lg transition-colors"
        >
          Today
        </button>
      </div>

      <button
        onClick={onSchedule}
        className="px-4 py-2 text-sm font-semibold bg-brand-iris text-white rounded-lg hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all duration-150"
      >
        Schedule content
      </button>
    </div>
  );
}

// ============================================
// CALENDAR CELL
// ============================================

interface CalendarCellProps {
  day: number;
  isToday: boolean;
  entries: CalendarEntry[];
  onOpenAsset: (assetId: string) => void;
  onEdit: (entry: CalendarEntry) => void;
  onUnschedule: (entryId: string) => void;
  onAddOnDay: () => void;
}

function CalendarCell({
  day,
  isToday,
  entries,
  onOpenAsset,
  onEdit,
  onUnschedule,
  onAddOnDay,
}: CalendarCellProps) {
  return (
    <div
      className={`group/cell border-r border-b border-border-subtle p-1.5 ${
        isToday ? 'bg-brand-iris/5' : 'bg-slate-0'
      } transition-colors`}
    >
      {/* Day Number + add affordance */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs font-medium ${
            isToday ? 'text-brand-iris' : 'text-white/70'
          }`}
        >
          {day}
        </span>
        <button
          onClick={onAddOnDay}
          aria-label="Schedule on this day"
          className="opacity-0 group-hover/cell:opacity-100 w-4 h-4 flex items-center justify-center text-white/50 hover:text-brand-iris transition-all"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>

      {/* Entries */}
      <div className="space-y-1">
        {entries.slice(0, 3).map((entry) => (
          <CalendarEntryCard
            key={entry.id}
            entry={entry}
            onOpen={() => onOpenAsset(entry.assetId)}
            onEdit={() => onEdit(entry)}
            onUnschedule={() => onUnschedule(entry.id)}
          />
        ))}
        {entries.length > 3 && (
          <span className="text-xs text-white/40">
            +{entries.length - 3} more
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// CALENDAR ENTRY CARD
// ============================================

interface CalendarEntryCardProps {
  entry: CalendarEntry;
  onOpen: () => void;
  onEdit: () => void;
  onUnschedule: () => void;
}

function CalendarEntryCard({
  entry,
  onOpen,
  onEdit,
  onUnschedule,
}: CalendarEntryCardProps) {
  const title = entry.asset?.title ?? 'Scheduled item';
  const typeLabel = entry.asset?.contentType
    ? (TYPE_LABELS[entry.asset.contentType] ?? entry.asset.contentType)
    : null;

  return (
    <div className="group/entry relative rounded bg-brand-iris/10 hover:bg-brand-iris/15 transition-colors">
      <button
        onClick={onOpen}
        className="w-full text-left px-1.5 py-1 text-xs text-brand-iris"
        title={`Open: ${title}`}
      >
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full bg-brand-iris shrink-0" />
          <span className="truncate flex-1">{title}</span>
        </span>
        {typeLabel && (
          <span className="block pl-2 text-[10px] uppercase tracking-wide text-white/40">
            {typeLabel}
          </span>
        )}
      </button>

      {/* Manage affordances (reschedule / unschedule) — never publish */}
      <div className="absolute top-0.5 right-0.5 hidden group-hover/entry:flex items-center gap-0.5">
        <button
          onClick={onEdit}
          aria-label="Reschedule"
          className="w-4 h-4 flex items-center justify-center rounded text-white/60 hover:text-brand-iris hover:bg-slate-4"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
        <button
          onClick={onUnschedule}
          aria-label="Unschedule"
          className="w-4 h-4 flex items-center justify-center rounded text-white/60 hover:text-semantic-danger hover:bg-slate-4"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ============================================
// SCHEDULE / RESCHEDULE MODAL
// ============================================

interface ScheduleModalProps {
  state: ModalState;
  assets: Array<{ id: string; title: string; contentType?: ContentType }>;
  submitting: boolean;
  error: string | null;
  onChange: (next: ModalState) => void;
  onClose: () => void;
  onSubmit: () => void;
}

function ScheduleModal({
  state,
  assets,
  submitting,
  error,
  onChange,
  onClose,
  onSubmit,
}: ScheduleModalProps) {
  const isEdit = state.mode === 'edit';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md bg-slate-1/95 backdrop-blur-xl border border-border-subtle rounded-xl shadow-elev-3 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">
            {isEdit ? 'Reschedule content' : 'Schedule content'}
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-white/50 hover:text-white"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {/* Asset picker (create) / locked asset (edit) */}
          <div>
            <label className="block text-xs text-white/50 mb-1">
              Content item
            </label>
            {isEdit ? (
              <div className="w-full px-3 py-2.5 text-sm text-white/70 bg-slate-3 border border-border-subtle rounded-lg">
                {state.assetTitle}
              </div>
            ) : assets.length === 0 ? (
              <p className="text-xs text-white/40 py-2">
                No content items yet — create content before scheduling.
              </p>
            ) : (
              <select
                value={state.assetId}
                onChange={(e) =>
                  onChange({ ...state, assetId: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm text-white/90 bg-slate-3 border border-border-subtle rounded-lg focus:outline-none focus:border-brand-iris/50 focus:ring-1 focus:ring-brand-iris/20 transition-all"
              >
                <option value="">Select a content item…</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date + time */}
          <div>
            <label className="block text-xs text-white/50 mb-1">
              Scheduled date &amp; time
            </label>
            <input
              type="datetime-local"
              value={state.date}
              onChange={(e) => onChange({ ...state, date: e.target.value })}
              className="w-full px-3 py-2.5 text-sm text-white/90 bg-slate-3 border border-border-subtle rounded-lg focus:outline-none focus:border-brand-iris/50 focus:ring-1 focus:ring-brand-iris/20 transition-all"
            />
          </div>

          {/* Campaign + theme */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1">
                Campaign
              </label>
              <input
                type="text"
                value={state.campaign}
                placeholder="Optional"
                onChange={(e) =>
                  onChange({ ...state, campaign: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm text-white/90 bg-slate-3 border border-border-subtle rounded-lg placeholder:text-white/30 focus:outline-none focus:border-brand-iris/50 focus:ring-1 focus:ring-brand-iris/20 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Theme</label>
              <input
                type="text"
                value={state.theme}
                placeholder="Optional"
                onChange={(e) => onChange({ ...state, theme: e.target.value })}
                className="w-full px-3 py-2.5 text-sm text-white/90 bg-slate-3 border border-border-subtle rounded-lg placeholder:text-white/30 focus:outline-none focus:border-brand-iris/50 focus:ring-1 focus:ring-brand-iris/20 transition-all"
              />
            </div>
          </div>

          {/* Automation mode — metadata only (does NOT trigger publishing) */}
          <div>
            <label className="block text-xs text-white/50 mb-1">
              Automation mode
              <span className="ml-1 text-white/30">(metadata only)</span>
            </label>
            <select
              value={state.automationMode}
              onChange={(e) =>
                onChange({
                  ...state,
                  automationMode: e.target.value as AutomationMode,
                })
              }
              className="w-full px-3 py-2.5 text-sm text-white/90 bg-slate-3 border border-border-subtle rounded-lg focus:outline-none focus:border-brand-iris/50 focus:ring-1 focus:ring-brand-iris/20 transition-all"
            >
              {(Object.keys(MODE_LABELS) as AutomationMode[]).map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-semantic-danger">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm font-medium text-white/50 hover:text-white/80 hover:bg-slate-4/50 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || (!isEdit && assets.length === 0)}
            className="px-4 py-2 text-sm font-semibold bg-brand-iris text-white rounded-lg hover:bg-brand-iris/90 shadow-[0_0_16px_rgba(168,85,247,0.25)] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
