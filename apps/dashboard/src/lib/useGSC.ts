/**
 * GSC Integration Hooks (Sprint S-INT-06)
 *
 * SWR hooks for Google Search Console connection status and actions.
 */

import useSWR from 'swr';

// ============================================================================
// Types
// ============================================================================

export interface GscStatus {
  connected: boolean;
  site_url: string | null;
  last_synced_at: string | null;
  sync_status: string | null;
  error_message?: string | null;
  keyword_count: number;
}

// ============================================================================
// Fetcher
// ============================================================================

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch error: ${res.status}`);
  const json = await res.json();
  if (json.success === false) throw new Error(json.error?.message || 'Unknown error');
  return json.data ?? json;
}

// ============================================================================
// Hooks
// ============================================================================

export function useGscStatus() {
  return useSWR<GscStatus>('/api/integrations/gsc/status', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 30_000, // 30s — polling during sync
  });
}

// ============================================================================
// Actions
// ============================================================================

export async function startGscConnect(): Promise<string> {
  const res = await fetch('/api/integrations/gsc/auth-url');
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to get auth URL');
  return json.data.auth_url;
}

export async function triggerGscSync(): Promise<void> {
  const res = await fetch('/api/integrations/gsc/sync', { method: 'POST' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Sync failed');
}

export async function disconnectGsc(): Promise<void> {
  const res = await fetch('/api/integrations/gsc/disconnect', { method: 'DELETE' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Disconnect failed');
}
