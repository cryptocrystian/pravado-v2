'use client';

/**
 * GSC Connection Card (Sprint S-INT-06)
 *
 * Shows GSC connection status in the SEO surface.
 * Handles connect/disconnect/sync actions.
 */

import { useState } from 'react';

import {
  useGscStatus,
  startGscConnect,
  triggerGscSync,
  disconnectGsc,
} from '@/lib/useGSC';

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function GscConnectionCard() {
  const { data: status, isLoading, mutate } = useGscStatus();
  const [actionLoading, setActionLoading] = useState(false);

  if (isLoading) {
    return (
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6 animate-pulse">
        <div className="h-5 bg-white/5 rounded w-48 mb-3" />
        <div className="h-4 bg-white/5 rounded w-32" />
      </div>
    );
  }

  const handleConnect = async () => {
    setActionLoading(true);
    try {
      const authUrl = await startGscConnect();
      window.location.href = authUrl;
    } catch {
      setActionLoading(false);
    }
  };

  const handleSync = async () => {
    setActionLoading(true);
    try {
      await triggerGscSync();
      await mutate();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Search Console? Synced keyword data will be preserved.')) return;
    setActionLoading(true);
    try {
      await disconnectGsc();
      await mutate();
    } finally {
      setActionLoading(false);
    }
  };

  // Not connected state
  if (!status?.connected) {
    return (
      <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-brand-cyan/10 ring-1 ring-brand-cyan/20">
            <svg className="w-6 h-6 text-brand-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white/90">Connect Google Search Console</h3>
            <p className="text-sm text-white/60 mt-1 mb-4 leading-relaxed">
              Import real keyword rankings, impressions, and click data from your domain.
              SAGE will use this data to generate SEO-specific action proposals.
            </p>
            <button
              type="button"
              onClick={handleConnect}
              disabled={actionLoading}
              className="px-4 py-2 text-sm font-semibold bg-brand-cyan text-slate-0 rounded-lg hover:bg-brand-cyan/90 shadow-[0_0_16px_rgba(0,217,255,0.25)] transition-all duration-150 disabled:opacity-50"
            >
              {actionLoading ? 'Connecting...' : 'Connect GSC'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Connected state
  const isSyncing = status.sync_status === 'syncing';
  const hasError = status.sync_status === 'error';

  return (
    <div className="bg-panel border border-border-subtle rounded-xl shadow-elev-1 p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-semantic-success/10 ring-1 ring-semantic-success/20">
            <svg className="w-6 h-6 text-semantic-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white/90">Google Search Console</h3>
              <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider rounded border bg-semantic-success/10 text-semantic-success border-semantic-success/20">
                Connected
              </span>
            </div>
            <p className="text-sm text-white/60 mt-1">{status.site_url}</p>

            <div className="flex items-center gap-4 mt-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">Keywords</span>
                <span className="text-lg font-bold text-brand-cyan tabular-nums">{status.keyword_count}</span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">Last Synced</span>
                <span className="text-sm text-white/70">
                  {status.last_synced_at ? formatRelativeTime(status.last_synced_at) : 'Never'}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 block">Status</span>
                <span className={`text-sm font-medium ${
                  hasError ? 'text-semantic-danger' :
                  isSyncing ? 'text-semantic-warning' :
                  'text-semantic-success'
                }`}>
                  {hasError ? 'Error' : isSyncing ? 'Syncing...' : 'Synced'}
                </span>
              </div>
            </div>

            {hasError && status.error_message && (
              <p className="text-sm text-semantic-danger mt-2">{status.error_message}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSync}
            disabled={actionLoading || isSyncing}
            className="px-3 py-1.5 text-sm font-medium text-white/60 border border-white/10 rounded-lg hover:text-white/90 hover:border-white/20 hover:bg-white/5 transition-all duration-150 disabled:opacity-50"
          >
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={actionLoading}
            className="px-3 py-1.5 text-sm font-medium text-semantic-danger/70 border border-semantic-danger/20 rounded-lg hover:text-semantic-danger hover:border-semantic-danger/40 hover:bg-semantic-danger/5 transition-all duration-150 disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
}
