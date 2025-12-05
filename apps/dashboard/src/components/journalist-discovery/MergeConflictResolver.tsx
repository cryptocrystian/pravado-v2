'use client';

/**
 * Merge Conflict Resolver Component (Sprint S48.2)
 * Shows field-level conflicts and resolution options when merging discoveries
 */

import { useEffect, useState } from 'react';
import type { MergePreview } from '@pravado/types';
import { generateMergePreview } from '@/lib/journalistDiscoveryApi';

type MergeConflict = MergePreview['conflicts'][number];

export interface MergeConflictResolverProps {
  discoveryId: string;
  targetJournalistId: string;
  onCancel: () => void;
  onConfirm: (resolutions: Record<string, 'keep_existing' | 'use_discovery' | 'merge_both'>) => void;
}

export function MergeConflictResolver({
  discoveryId,
  targetJournalistId,
  onCancel,
  onConfirm,
}: MergeConflictResolverProps) {
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolutions, setResolutions] = useState<
    Record<string, 'keep_existing' | 'use_discovery' | 'merge_both'>
  >({});

  useEffect(() => {
    loadPreview();
  }, [discoveryId, targetJournalistId]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const data = await generateMergePreview(discoveryId, targetJournalistId);
      setPreview(data);

      // Initialize resolutions with recommendations
      const initialResolutions: Record<
        string,
        'keep_existing' | 'use_discovery' | 'merge_both'
      > = {};
      data.conflicts.forEach((conflict) => {
        initialResolutions[conflict.field] = conflict.recommendation;
      });
      setResolutions(initialResolutions);
    } catch (error) {
      console.error('Failed to load merge preview:', error);
      alert('Failed to load merge preview');
      onCancel();
    } finally {
      setLoading(false);
    }
  };

  const handleResolutionChange = (
    field: string,
    resolution: 'keep_existing' | 'use_discovery' | 'merge_both'
  ) => {
    setResolutions((prev) => ({ ...prev, [field]: resolution }));
  };

  const handleConfirm = () => {
    if (preview && !preview.autoResolvable) {
      const hasUnresolved = preview.conflicts.some(
        (conflict) => !resolutions[conflict.field]
      );
      if (hasUnresolved) {
        alert('Please resolve all conflicts before confirming');
        return;
      }
    }

    onConfirm(resolutions);
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      email: 'Email',
      outlet: 'Outlet',
      socialLinks: 'Social Links',
      beats: 'Beats',
      bio: 'Bio',
    };
    return labels[field] || field;
  };

  const renderFieldValue = (value: any): string => {
    if (!value) return 'N/A';
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') {
      return Object.entries(value)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">Loading merge preview...</div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8 text-red-500">Failed to load merge preview</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b bg-gray-50">
        <h3 className="text-lg font-semibold mb-1">Merge Conflict Resolution</h3>
        <p className="text-sm text-gray-600">
          {preview.conflicts.length === 0 ? (
            <span className="text-green-600 font-medium">
              No conflicts found - merge can proceed automatically
            </span>
          ) : preview.autoResolvable ? (
            <span className="text-blue-600 font-medium">
              {preview.conflicts.length} conflict(s) with automatic resolution recommendations
            </span>
          ) : (
            <span className="text-orange-600 font-medium">
              {preview.conflicts.length} conflict(s) require manual resolution
            </span>
          )}
        </p>
      </div>

      {/* Conflicts List */}
      {preview.conflicts.length > 0 && (
        <div className="p-6 space-y-6">
          {preview.conflicts.map((conflict: MergeConflict, idx: number) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-900">
                  {getFieldLabel(conflict.field)}
                </h4>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Recommended: {conflict.recommendation.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Existing Value */}
                <div className="bg-red-50 rounded p-3 border border-red-200">
                  <div className="text-xs font-medium text-red-700 mb-1">
                    Existing Value
                  </div>
                  <div className="text-sm text-gray-900 break-words">
                    {renderFieldValue(conflict.existingValue)}
                  </div>
                </div>

                {/* Discovery Value */}
                <div className="bg-blue-50 rounded p-3 border border-blue-200">
                  <div className="text-xs font-medium text-blue-700 mb-1">
                    Discovery Value
                  </div>
                  <div className="text-sm text-gray-900 break-words">
                    {renderFieldValue(conflict.discoveryValue)}
                  </div>
                </div>
              </div>

              {/* Resolution Options */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`conflict-${idx}`}
                    checked={resolutions[conflict.field] === 'keep_existing'}
                    onChange={() => handleResolutionChange(conflict.field, 'keep_existing')}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Keep existing value</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`conflict-${idx}`}
                    checked={resolutions[conflict.field] === 'use_discovery'}
                    onChange={() => handleResolutionChange(conflict.field, 'use_discovery')}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Use discovery value (overwrite)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name={`conflict-${idx}`}
                    checked={resolutions[conflict.field] === 'merge_both'}
                    onChange={() => handleResolutionChange(conflict.field, 'merge_both')}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Merge both values (combine)</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Conflicts Message */}
      {preview.conflicts.length === 0 && (
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <div className="text-green-800 font-medium mb-1">
              Ready to Merge
            </div>
            <div className="text-sm text-green-600">
              All fields are compatible. The merge can proceed without conflicts.
            </div>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="p-6 border-t bg-gray-50 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-100"
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700"
        >
          Confirm Merge
        </button>
      </div>
    </div>
  );
}
