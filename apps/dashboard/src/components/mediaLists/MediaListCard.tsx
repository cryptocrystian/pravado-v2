/**
 * Media List Card Component (Sprint S47)
 * Displays a summary card for a media list
 */

'use client';

import type { MediaListSummary } from '@pravado/types';
import { KeywordChips } from './KeywordChips';

interface MediaListCardProps {
  list: MediaListSummary;
  onView?: (listId: string) => void;
  onDelete?: (listId: string) => void;
}

export function MediaListCard({ list, onView, onDelete }: MediaListCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {list.name}
          </h3>
          {list.description && (
            <p className="text-sm text-gray-600 mb-2">
              {list.description}
            </p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Topic: {list.inputTopic}</span>
            {list.inputMarket && (
              <>
                <span>•</span>
                <span>Market: {list.inputMarket}</span>
              </>
            )}
            {list.inputGeography && (
              <>
                <span>•</span>
                <span>{list.inputGeography}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {list.inputKeywords && list.inputKeywords.length > 0 && (
        <div className="mb-4">
          <KeywordChips keywords={list.inputKeywords} maxDisplay={3} size="sm" />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{list.totalEntries}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{list.tierACount}</div>
          <div className="text-xs text-gray-500">A-Tier</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{list.tierBCount}</div>
          <div className="text-xs text-gray-500">B-Tier</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{list.tierCCount}</div>
          <div className="text-xs text-gray-500">C-Tier</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">{list.tierDCount}</div>
          <div className="text-xs text-gray-500">D-Tier</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Avg Fit: <span className="font-semibold text-gray-900">{Math.round(list.avgFitScore * 100)}%</span>
        </div>
        <div className="flex gap-2">
          {onView && (
            <button
              onClick={() => onView(list.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
              View List
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this media list?')) {
                  onDelete(list.id);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 hover:border-red-400 rounded-md transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
