/**
 * Journalist Intelligence Dashboard (Sprint S46)
 * Unified journalist contact intelligence interface
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as journalistGraphApi from '@/lib/journalistGraphApi';

export default function JournalistsPage() {
  const [journalists, setJournalists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadJournalists();
  }, []);

  const loadJournalists = async () => {
    try {
      setLoading(true);
      const response = await journalistGraphApi.listProfiles({
        q: searchQuery || undefined,
        sortBy: 'engagement_score',
        sortOrder: 'desc',
        limit: 50,
      });

      if (response.success) {
        setJournalists(response.data.profiles);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading journalist intelligence...</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
        <button
          onClick={loadJournalists}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

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
        <input
          type="text"
          placeholder="Search journalists..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && loadJournalists()}
          className="w-full px-4 py-2 border rounded"
        />
      </div>

      {/* Journalist List */}
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
                    {journalist.primaryOutlet || '—'}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link href={`/app/pr/journalists/${journalist.id}`} className="block hover:text-blue-600">
                    {journalist.beat || '—'}
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
                      : '—'}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {journalists.length === 0 && (
          <div className="text-center py-12 text-gray-500">No journalists found</div>
        )}
      </div>
    </div>
  );
}
