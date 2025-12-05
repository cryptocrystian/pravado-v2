/**
 * Media List Result Preview Component (Sprint S47)
 * Previews generated media list results before saving
 */

'use client';

import type { MediaListGenerationResult } from '@pravado/types';
import { FitScoreBadge } from './FitScoreBadge';
import { TierBadge } from './TierBadge';

interface MediaListResultPreviewProps {
  result: MediaListGenerationResult;
  onSave?: () => void;
  onCancel?: () => void;
}

export function MediaListResultPreview({ result, onSave, onCancel }: MediaListResultPreviewProps) {
  const { matches, metadata } = result;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Summary Header */}
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Generated Media List Results
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{metadata.totalMatches}</div>
            <div className="text-xs text-gray-500">Matches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{metadata.tierDistribution.A}</div>
            <div className="text-xs text-gray-500">A-Tier</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{metadata.tierDistribution.B}</div>
            <div className="text-xs text-gray-500">B-Tier</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{metadata.tierDistribution.C}</div>
            <div className="text-xs text-gray-500">C-Tier</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{metadata.tierDistribution.D}</div>
            <div className="text-xs text-gray-500">D-Tier</div>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Avg Fit Score: <span className="font-semibold">{Math.round(metadata.avgFitScore * 100)}%</span>
          <span className="mx-2">•</span>
          Total Candidates Evaluated: <span className="font-semibold">{metadata.totalCandidates}</span>
        </div>
      </div>

      {/* Results Table */}
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
            {matches.map((match, index) => (
              <tr key={match.journalistId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">
                      {match.journalist.fullName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {match.journalist.primaryEmail}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {match.journalist.primaryOutlet || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {match.journalist.beat || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <TierBadge tier={match.tier} size="sm" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <FitScoreBadge score={match.fitScore} size="sm" />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-md">
                  {match.reason}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
        {onSave && (
          <button
            onClick={onSave}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            Save Media List
          </button>
        )}
      </div>
    </div>
  );
}
