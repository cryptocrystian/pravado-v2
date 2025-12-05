'use client';

/**
 * Discovery Detail Drawer Component (Sprint S48.2)
 * Displays full discovery details with resolution actions
 */

import { useState } from 'react';
import type { DiscoveredJournalist, ResolveDiscoveryInput, SuggestedMatch } from '@pravado/types';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SourceTypeBadge } from './SourceTypeBadge';
import { SocialProfileChips } from './SocialProfileChips';
import { resolveDiscovery } from '@/lib/journalistDiscoveryApi';

export interface DiscoveryDetailDrawerProps {
  discovery: DiscoveredJournalist;
  onClose: () => void;
  onResolved: () => void;
}

export function DiscoveryDetailDrawer({
  discovery,
  onClose,
  onResolved,
}: DiscoveryDetailDrawerProps) {
  const [resolving, setResolving] = useState(false);
  const [notes, setNotes] = useState('');

  const handleResolve = async (action: 'merge' | 'confirm' | 'reject', targetId?: string) => {
    const message =
      action === 'merge'
        ? `Merge this discovery into the selected journalist profile?`
        : action === 'confirm'
          ? `Confirm this as a valid journalist discovery?`
          : `Reject this discovery as invalid?`;

    if (!confirm(message)) return;

    setResolving(true);
    try {
      const input: ResolveDiscoveryInput = {
        action,
        targetJournalistId: targetId,
        notes: notes || undefined,
      };

      await resolveDiscovery(discovery.id, input);
      onResolved();
      onClose();
    } catch (error) {
      console.error('Failed to resolve discovery:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setResolving(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b flex items-center justify-between bg-gray-50">
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{discovery.fullName}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Discovered {formatDate(discovery.createdAt)}
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded"
          disabled={resolving}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Status & Metadata */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Status</div>
                <span
                  className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize ${
                    discovery.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : discovery.status === 'confirmed'
                        ? 'bg-blue-100 text-blue-800'
                        : discovery.status === 'merged'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                  }`}
                >
                  {discovery.status}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Source Type</div>
                <SourceTypeBadge sourceType={discovery.sourceType} size="sm" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="font-medium mb-2">Contact Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div>
                <div className="text-sm text-gray-600">Full Name</div>
                <div className="font-medium">{discovery.fullName}</div>
              </div>
              {discovery.email && (
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{discovery.email}</div>
                </div>
              )}
              {discovery.outlet && (
                <div>
                  <div className="text-sm text-gray-600">Outlet</div>
                  <div className="font-medium">{discovery.outlet}</div>
                </div>
              )}
            </div>
          </div>

          {/* Confidence Score */}
          <div>
            <h3 className="font-medium mb-2">Confidence Score</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <ConfidenceBadge
                score={discovery.confidenceScore}
                size="lg"
                showLabel
                showBreakdown
                breakdown={discovery.confidenceBreakdown}
              />
            </div>
          </div>

          {/* Social Links */}
          {discovery.socialLinks && Object.keys(discovery.socialLinks).length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Social Profiles</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <SocialProfileChips
                  socialLinks={discovery.socialLinks}
                  size="md"
                  clickable={true}
                />
              </div>
            </div>
          )}

          {/* Beats */}
          {discovery.beats && discovery.beats.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Beats</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {discovery.beats.map((beat, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800"
                    >
                      {beat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Bio */}
          {discovery.bio && (
            <div>
              <h3 className="font-medium mb-2">Bio</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">{discovery.bio}</p>
              </div>
            </div>
          )}

          {/* Suggested Matches */}
          {discovery.suggestedMatches && discovery.suggestedMatches.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Suggested Matches</h3>
              <div className="space-y-2">
                {discovery.suggestedMatches.map((match: SuggestedMatch, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-medium">{match.journalistName}</div>
                        <div className="text-sm text-gray-600">{match.matchReason}</div>
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        {Math.round(match.similarityScore * 100)}% match
                      </div>
                    </div>
                    {discovery.status === 'pending' && (
                      <button
                        onClick={() => handleResolve('merge', match.journalistId)}
                        disabled={resolving}
                        className="text-sm text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                      >
                        Merge with this profile
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Source Information */}
          {discovery.sourceUrl && (
            <div>
              <h3 className="font-medium mb-2">Source</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <a
                  href={discovery.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 break-all"
                >
                  {discovery.sourceUrl}
                </a>
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          {discovery.status === 'pending' && (
            <div>
              <h3 className="font-medium mb-2">Resolution Notes (Optional)</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this resolution..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Resolution Metadata (if resolved) */}
          {discovery.status !== 'pending' && discovery.resolvedAt && (
            <div>
              <h3 className="font-medium mb-2">Resolution Information</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div>
                  <div className="text-sm text-gray-600">Resolved At</div>
                  <div className="font-medium">{formatDate(discovery.resolvedAt)}</div>
                </div>
                {discovery.resolutionNotes && (
                  <div>
                    <div className="text-sm text-gray-600">Notes</div>
                    <div className="text-sm">{discovery.resolutionNotes}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {discovery.status === 'pending' && (
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <button
            onClick={() => handleResolve('confirm')}
            disabled={resolving}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Confirm as Valid
          </button>
          <button
            onClick={() => handleResolve('reject')}
            disabled={resolving}
            className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}
