/**
 * Enrichment Record Detail Drawer Component (Sprint S50)
 * Detailed view of enrichment record with all fields and actions
 */

import React from 'react';
import { ConfidenceBadge } from './ConfidenceBadge';
import { EnrichmentSourceBadge } from './EnrichmentSourceBadge';
import {
  XMarkIcon,
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  DocumentDuplicateIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface EnrichmentRecordDetailDrawerProps {
  record: any;
  onClose: () => void;
  onMerge?: (recordId: string) => void;
  onUpdate?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
  open: boolean;
}

export function EnrichmentRecordDetailDrawer({
  record,
  onClose,
  onMerge,
  onUpdate,
  onDelete,
  open,
}: EnrichmentRecordDetailDrawerProps) {
  if (!open || !record) return null;

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const socialPlatforms = record.socialProfiles
    ? Object.entries(record.socialProfiles).filter(([_, url]) => url)
    : [];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Enrichment Details
            </h2>
            <p className="text-sm text-gray-600 mt-1">ID: {record.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Status & Source */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Record Status
            </h3>
            <div className="flex flex-wrap gap-2">
              <EnrichmentSourceBadge
                sourceType={record.sourceType as any}
                size="md"
              />
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  record.status === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : record.status === 'processing'
                    ? 'bg-blue-100 text-blue-800'
                    : record.status === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Quality Scores */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Quality Metrics
            </h3>
            <div className="space-y-3 bg-gray-50 rounded-lg p-4">
              <ConfidenceBadge score={record.overallConfidenceScore} size="lg" />
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Completeness</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(record.completenessScore)}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 mb-1">Data Freshness</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(record.dataFreshnessScore)}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quality Flags */}
          {record.qualityFlags && record.qualityFlags.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Quality Issues
              </h3>
              <div className="space-y-2">
                {record.qualityFlags.map((flag: string) => (
                  <div
                    key={flag}
                    className="flex items-center gap-2 p-2 bg-yellow-50 rounded border border-yellow-200"
                  >
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm text-yellow-800">
                      {flag.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Contact Information
            </h3>
            <div className="space-y-3">
              {record.email && (
                <div className="flex items-start gap-3">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {record.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {record.emailVerified ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <CheckCircleIcon className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <XCircleIcon className="h-3 w-3" />
                          Not verified
                        </span>
                      )}
                      {record.emailConfidence !== undefined && (
                        <span className="text-xs text-gray-600">
                          Confidence: {Math.round(record.emailConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {record.phone && (
                <div className="flex items-start gap-3">
                  <PhoneIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {record.phone}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {record.phoneVerified ? (
                        <span className="flex items-center gap-1 text-xs text-green-700">
                          <CheckCircleIcon className="h-3 w-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <XCircleIcon className="h-3 w-3" />
                          Not verified
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Professional Information */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Professional Information
            </h3>
            <div className="space-y-3">
              {record.outlet && (
                <div className="flex items-start gap-3">
                  <GlobeAltIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {record.outlet}
                    </p>
                    {record.outletAuthorityScore !== undefined && (
                      <p className="text-xs text-gray-600 mt-1">
                        Authority Score: {record.outletAuthorityScore}/100
                      </p>
                    )}
                    {record.outletDomain && (
                      <p className="text-xs text-gray-600">{record.outletDomain}</p>
                    )}
                  </div>
                </div>
              )}

              {record.jobTitle && (
                <div className="flex items-start gap-3">
                  <UserCircleIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-900">{record.jobTitle}</p>
                </div>
              )}

              {record.location && (
                <div className="flex items-start gap-3">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-900">{record.location}</p>
                </div>
              )}

              {record.beat && record.beat.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 mb-2">Beat / Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {record.beat.map((b: string) => (
                      <span
                        key={b}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Social Profiles */}
          {socialPlatforms.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Social Profiles
              </h3>
              <div className="space-y-2">
                {socialPlatforms.map(([platform, url]) => (
                  <a
                    key={platform}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded transition-colors"
                  >
                    <LinkIcon className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-900 capitalize">
                      {platform}
                    </span>
                    <span className="text-xs text-gray-500 truncate flex-1">
                      {url as string}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Bio */}
          {record.bio && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Bio</h3>
              <p className="text-sm text-gray-900 leading-relaxed">{record.bio}</p>
            </div>
          )}

          {/* Timestamps */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Created:</span>
                <span className="text-gray-900">{formatDate(record.createdAt)}</span>
              </div>
              {record.enrichedAt && (
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Enriched:</span>
                  <span className="text-gray-900">
                    {formatDate(record.enrichedAt)}
                  </span>
                </div>
              )}
              {record.lastVerifiedAt && (
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Last Verified:</span>
                  <span className="text-gray-900">
                    {formatDate(record.lastVerifiedAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex gap-3">
              {onMerge && record.status === 'completed' && (
                <button
                  onClick={() => onMerge(record.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  <DocumentDuplicateIcon className="h-5 w-5" />
                  Merge to Profile
                </button>
              )}
              {onUpdate && (
                <button
                  onClick={() => onUpdate(record.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <ArrowPathIcon className="h-5 w-5" />
                  Re-enrich
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    if (
                      confirm('Are you sure you want to delete this enrichment record?')
                    ) {
                      onDelete(record.id);
                    }
                  }}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
