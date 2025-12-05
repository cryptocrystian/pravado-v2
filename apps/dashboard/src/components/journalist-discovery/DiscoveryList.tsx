'use client';

/**
 * Discovery List Component (Sprint S48.2)
 * Displays a list of discovered journalists with key information
 */

import type { DiscoveredJournalist } from '@pravado/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceTypeBadge } from './SourceTypeBadge';
import { SocialProfileChips } from './SocialProfileChips';

interface DiscoveryListProps {
  discoveries: DiscoveredJournalist[];
  onSelect?: (discovery: DiscoveredJournalist) => void;
  selectedId?: string;
  loading?: boolean;
}

export function DiscoveryList({
  discoveries,
  onSelect,
  selectedId,
  loading = false,
}: DiscoveryListProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-500">Loading discoveries...</div>
      </div>
    );
  }

  if (discoveries.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center py-12">
        <div className="text-gray-400 text-lg mb-2">No discoveries found</div>
        <div className="text-gray-500 text-sm">
          Try adjusting your filters or check back later
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'merged':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-3">
      {discoveries.map((discovery) => (
        <div
          key={discovery.id}
          onClick={() => onSelect?.(discovery)}
          className={`bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer ${
            selectedId === discovery.id
              ? 'ring-2 ring-blue-500 border-blue-500'
              : 'border-gray-200'
          }`}
        >
          {/* Header: Name and Status */}
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {discovery.fullName}
              </h3>
              {discovery.outlet && (
                <p className="text-sm text-gray-600 mb-1">{discovery.outlet}</p>
              )}
              {discovery.email && (
                <p className="text-sm text-gray-500">{discovery.email}</p>
              )}
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded capitalize ${getStatusColor(discovery.status)}`}
            >
              {discovery.status}
            </span>
          </div>

          {/* Metadata Row */}
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <ConfidenceBadge score={discovery.confidenceScore} size="sm" />
            <SourceTypeBadge sourceType={discovery.sourceType} size="sm" />
            {discovery.beats && discovery.beats.length > 0 && (
              <div className="flex gap-1">
                {discovery.beats.slice(0, 2).map((beat, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-800"
                  >
                    {beat}
                  </span>
                ))}
                {discovery.beats.length > 2 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    +{discovery.beats.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Social Links */}
          {discovery.socialLinks && Object.keys(discovery.socialLinks).length > 0 && (
            <div className="mb-3">
              <SocialProfileChips
                socialLinks={discovery.socialLinks}
                size="sm"
                maxDisplay={3}
                clickable={false}
              />
            </div>
          )}

          {/* Suggested Matches Count */}
          {discovery.suggestedMatches && discovery.suggestedMatches.length > 0 && (
            <div className="text-xs text-gray-500">
              {discovery.suggestedMatches.length} suggested match
              {discovery.suggestedMatches.length !== 1 ? 'es' : ''} found
            </div>
          )}

          {/* Bio Preview */}
          {discovery.bio && (
            <div className="mt-2 text-sm text-gray-600 line-clamp-2">{discovery.bio}</div>
          )}

          {/* Discovery Date */}
          <div className="mt-2 text-xs text-gray-400">
            Discovered {new Date(discovery.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}
