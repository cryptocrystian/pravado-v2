/**
 * Media List Entry Table Component (Sprint S47)
 * Displays journalists in a media list with fit scores and details
 */

'use client';

import type { MediaListEntryWithJournalist } from '@pravado/types';
import { FitScoreBadge } from './FitScoreBadge';
import { TierBadge } from './TierBadge';

interface MediaListEntryTableProps {
  entries: MediaListEntryWithJournalist[];
  onSelectJournalist?: (journalistId: string) => void;
}

export function MediaListEntryTable({ entries, onSelectJournalist }: MediaListEntryTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-sm">No journalists in this list</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Journalist
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Outlet
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Beat
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tier
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fit Score
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Reason
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => onSelectJournalist?.(entry.journalistId)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex flex-col">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.journalist.fullName}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.journalist.primaryEmail}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {entry.journalist.primaryOutlet || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {entry.journalist.beat || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <TierBadge tier={entry.tier} size="sm" />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <FitScoreBadge score={entry.fitScore} size="sm" />
              </td>
              <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                {entry.reason}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
