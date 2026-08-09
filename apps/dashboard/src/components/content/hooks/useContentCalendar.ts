'use client';

/**
 * Content Calendar Hook (W2)
 *
 * SWR-based hook for the real `content_calendar` table. Follows the Gate 1A
 * network invariant (client → Next.js route handler → backend). The list route
 * returns the standard `{ success, data }` envelope with `data.items`.
 *
 * This is scheduling metadata + click-to-open ONLY. Scheduling an item does NOT
 * publish it and never routes through publish governance. `automationMode` is
 * stored/displayed as metadata, not an execution trigger.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useCallback } from 'react';
import useSWR from 'swr';

import type { AutomationMode } from '../types';

// ============================================
// TYPES (mirror the API CalendarEntryDTO)
// ============================================

export interface CalendarEntryAsset {
  id: string;
  title: string;
  contentType: string | null;
  status: string | null;
}

export interface CalendarEntry {
  id: string;
  orgId: string;
  assetId: string;
  scheduledAt: string;
  campaign: string | null;
  theme: string | null;
  crossPillarDeps: Array<{
    pillar: 'pr' | 'seo';
    type: 'blocks' | 'blocked_by' | 'syncs_with';
    entityId: string;
    entityLabel: string;
  }>;
  automationMode: AutomationMode;
  createdAt: string;
  updatedAt: string;
  asset: CalendarEntryAsset | null;
}

export interface ScheduleEntryInput {
  asset_id: string;
  scheduled_at: string;
  campaign?: string;
  theme?: string;
  automation_mode?: AutomationMode;
}

export interface RescheduleEntryInput {
  scheduled_at?: string;
  campaign?: string | null;
  theme?: string | null;
  automation_mode?: AutomationMode;
}

// ============================================
// FETCHER — unwraps one { success, data } envelope
// ============================================

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message?: string; code?: string };
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
  if (!res.ok || !json || json.success === false) {
    throw new Error(json?.error?.message ?? 'Failed to fetch calendar data');
  }
  return (json.data ?? (json as unknown as T)) as T;
}

async function mutateRequest(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE',
  body?: unknown
): Promise<void> {
  const res = await fetch(url, {
    method,
    ...(body !== undefined
      ? {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const json = (await res
    .json()
    .catch(() => null)) as ApiEnvelope<unknown> | null;
  if (!res.ok || !json || json.success === false) {
    // Honest failure — surface the real upstream message, no silent success.
    throw new Error(json?.error?.message ?? `Request failed (${res.status})`);
  }
}

// ============================================
// HOOK
// ============================================

export interface UseContentCalendarParams {
  from?: string;
  to?: string;
}

export function useContentCalendar(params?: UseContentCalendarParams) {
  const searchParams = new URLSearchParams();
  if (params?.from) searchParams.set('from', params.from);
  if (params?.to) searchParams.set('to', params.to);

  const queryString = searchParams.toString();
  const url = `/api/content/calendar${queryString ? `?${queryString}` : ''}`;

  const { data, error, isLoading, mutate } = useSWR<{ items: CalendarEntry[] }>(
    url,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 }
  );

  const scheduleEntry = useCallback(
    async (input: ScheduleEntryInput) => {
      await mutateRequest('/api/content/calendar', 'POST', input);
      await mutate();
    },
    [mutate]
  );

  const rescheduleEntry = useCallback(
    async (id: string, input: RescheduleEntryInput) => {
      await mutateRequest(`/api/content/calendar/${id}`, 'PUT', input);
      await mutate();
    },
    [mutate]
  );

  const unscheduleEntry = useCallback(
    async (id: string) => {
      await mutateRequest(`/api/content/calendar/${id}`, 'DELETE');
      await mutate();
    },
    [mutate]
  );

  return {
    entries: data?.items ?? [],
    isLoading,
    error: error as Error | undefined,
    mutate,
    scheduleEntry,
    rescheduleEntry,
    unscheduleEntry,
  };
}
