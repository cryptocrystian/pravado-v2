/**
 * Journalist Intelligence Client Component (Sprint S100 · identity-only re-source)
 * Client-side UI — ALL data loaded via /api/pr/journalists route handler.
 *
 * INVARIANT: This component does NOT import from prDataServer.
 * All data flows through /api/pr/* route handlers (real journalist_profiles).
 *
 * IDENTITY-ONLY: This surface renders journalist IDENTITY only (name, outlet,
 * beat, engagement, last activity). Contact fields (primaryEmail / secondary
 * emails) are deliberately NOT part of the local type and are never rendered —
 * CAN-SPAM-sensitive contact data must not surface until outreach egress +
 * governance are live. Do not add an email column to this surface.
 */

'use client';

import Link from 'next/link';
import { useState, useTransition, useEffect } from 'react';

/**
 * Journalist profile type (inline to avoid prDataServer import).
 * Identity-only: no email/contact fields by construction.
 */
interface JournalistProfile {
  id: string;
  fullName: string;
  primaryOutlet: string | null;
  beat: string | null;
  engagementScore: number;
  lastActivityAt: string | null;
}

interface JournalistsClientProps {
  initialProfiles: JournalistProfile[];
  initialTotal: number;
}

export default function JournalistsClient({
  initialProfiles,
  initialTotal,
}: JournalistsClientProps) {
  const [journalists, setJournalists] =
    useState<JournalistProfile[]>(initialProfiles);
  const [total, setTotal] = useState(initialTotal);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(
    initialProfiles.length === 0
  );

  // Load data on mount via route handler
  useEffect(() => {
    if (initialProfiles.length === 0) {
      loadJournalists();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadJournalists = async () => {
    try {
      setError(null);
      const params = new URLSearchParams();
      params.set('limit', '50');
      params.set('sortBy', 'engagement_score');
      params.set('sortOrder', 'desc');

      const response = await fetch(`/api/pr/journalists?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Failed to load journalists: ${response.status}`
        );
      }

      const data = await response.json();
      setJournalists(data.profiles || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to load journalists';
      setError(message);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSearch = () => {
    startTransition(async () => {
      try {
        setError(null);
        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        params.set('limit', '50');
        params.set('sortBy', 'engagement_score');
        params.set('sortOrder', 'desc');

        const response = await fetch(
          `/api/pr/journalists?${params.toString()}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Search failed: ${response.status}`
          );
        }

        const data = await response.json();
        setJournalists(data.profiles || []);
        setTotal(data.total || 0);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Search failed';
        setError(message);
      }
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Journalist Intelligence
        </h1>
        <p className="text-sm text-white/45 mt-1">
          Unified contact intelligence and identity resolution
        </p>
      </div>

      {/* Search */}
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Search journalists…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30"
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isPending}
          className="bg-brand-magenta text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-brand-magenta/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Searching…' : 'Search'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <p className="text-sm text-red-400">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-2 text-xs text-red-400/70 hover:text-red-400 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Initial loading */}
      {isInitialLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-brand-magenta mx-auto mb-3" />
            <p className="text-sm text-white/45">Loading journalists…</p>
          </div>
        </div>
      )}

      {/* Journalist list */}
      {!isInitialLoading && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                  Name
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                  Outlet
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                  Beat
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3 pr-4">
                  Engagement
                </th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-white/45 py-3">
                  Last Activity
                </th>
              </tr>
            </thead>
            <tbody>
              {journalists.map((journalist) => (
                <tr
                  key={journalist.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <Link
                      href={`/app/pr/journalists/${journalist.id}`}
                      className="text-sm font-medium text-white hover:text-brand-magenta transition-colors"
                    >
                      {journalist.fullName}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-sm text-white/70">
                    {journalist.primaryOutlet || '—'}
                  </td>
                  <td className="py-3 pr-4 text-sm text-white/70">
                    {journalist.beat || '—'}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-white/10 rounded-full h-1.5">
                        <div
                          className="bg-brand-magenta h-1.5 rounded-full"
                          style={{
                            width: `${Math.max(0, Math.min(1, journalist.engagementScore)) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-white/45">
                        {(journalist.engagementScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-sm text-white/70">
                    {journalist.lastActivityAt
                      ? new Date(journalist.lastActivityAt).toLocaleDateString()
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {journalists.length === 0 && (
            <div className="text-center py-16 text-sm text-white/45">
              No journalists yet — identities populate as PR discovery and
              enrichment run.
            </div>
          )}

          {total > 0 && (
            <div className="mt-4 pt-4 border-t border-white/8 text-xs text-white/45">
              Showing {journalists.length} of {total} journalists
            </div>
          )}
        </div>
      )}
    </div>
  );
}
