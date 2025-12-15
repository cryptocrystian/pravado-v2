/**
 * Journalist Intelligence Client Component (Sprint S100)
 * Client-side UI - ALL data loaded via /api/pr/journalists route handler
 *
 * INVARIANT: This component does NOT import from prDataServer.
 * All data flows through /api/pr/* route handlers.
 */

'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';

/**
 * Journalist profile type (inline to avoid prDataServer import)
 * S100: Types are defined locally to avoid ANY dependency on prDataServer
 */
interface JournalistProfile {
  id: string;
  fullName: string;
  primaryEmail: string | null;
  primaryOutlet: string | null;
  beat: string | null;
  engagementScore: number;
  lastActivityAt: string | null;
}

interface JournalistsClientProps {
  initialProfiles: JournalistProfile[];
  initialTotal: number;
}

export default function JournalistsClient({ initialProfiles, initialTotal }: JournalistsClientProps) {
  const [journalists, setJournalists] = useState<JournalistProfile[]>(initialProfiles);
  const [total, setTotal] = useState(initialTotal);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(initialProfiles.length === 0);

  // S100: Load data on mount via route handler
  useEffect(() => {
    if (initialProfiles.length === 0) {
      loadJournalists();
    }
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
        throw new Error(errorData.error || `Failed to load journalists: ${response.status}`);
      }

      const data = await response.json();
      setJournalists(data.profiles || []);
      setTotal(data.total || 0);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load journalists';
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

        const response = await fetch(`/api/pr/journalists?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Search failed: ${response.status}`);
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
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Journalist Intelligence</h1>
        <p className="text-gray-600 mt-2">
          Unified contact intelligence and identity resolution
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search journalists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={handleSearch}
            disabled={isPending}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isPending ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">Error: {error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Initial Loading State */}
      {isInitialLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading journalists...</p>
          </div>
        </div>
      )}

      {/* Journalist List */}
      {!isInitialLoading && (
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Outlet
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Beat
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Engagement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Last Activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {journalists.map((journalist) => (
              <tr key={journalist.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/app/pr/journalists/${journalist.id}`} className="block">
                    <div className="font-medium text-gray-900 hover:text-blue-600">{journalist.fullName}</div>
                    <div className="text-sm text-gray-500">{journalist.primaryEmail}</div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link href={`/app/pr/journalists/${journalist.id}`} className="block hover:text-blue-600">
                    {journalist.primaryOutlet || '\u2014'}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link href={`/app/pr/journalists/${journalist.id}`} className="block hover:text-blue-600">
                    {journalist.beat || '\u2014'}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link href={`/app/pr/journalists/${journalist.id}`} className="block">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${journalist.engagementScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {(journalist.engagementScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Link href={`/app/pr/journalists/${journalist.id}`} className="block hover:text-blue-600">
                    {journalist.lastActivityAt
                      ? new Date(journalist.lastActivityAt).toLocaleDateString()
                      : '\u2014'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {journalists.length === 0 && (
          <div className="text-center py-12 text-gray-500">No journalists found</div>
        )}

        {total > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
            Showing {journalists.length} of {total} journalists
          </div>
        )}
      </div>
      )}
    </div>
  );
}
