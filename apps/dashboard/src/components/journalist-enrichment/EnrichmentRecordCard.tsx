/**
 * Enrichment Record Card Component (Sprint S50)
 * Card view of an enrichment record with key information
 */

import React from 'react';
import { ConfidenceBadge, ConfidenceBar } from './ConfidenceBadge';
import { EnrichmentSourceBadge } from './EnrichmentSourceBadge';
import {
  EnvelopeIcon,
  PhoneIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface EnrichmentRecordCardProps {
  record: {
    id: string;
    sourceType: string;
    email?: string;
    emailVerified?: boolean;
    phone?: string;
    phoneVerified?: boolean;
    outlet?: string;
    outletAuthorityScore?: number;
    jobTitle?: string;
    beat?: string[];
    location?: string;
    overallConfidenceScore: number;
    completenessScore: number;
    dataFreshnessScore: number;
    status: string;
    qualityFlags?: string[];
    createdAt: string | Date;
    enrichedAt?: string | Date;
  };
  onClick?: () => void;
  selected?: boolean;
}

export function EnrichmentRecordCard({
  record,
  onClick,
  selected = false,
}: EnrichmentRecordCardProps) {
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      completed: 'bg-green-100 text-green-800 border-green-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      merged: 'bg-purple-100 text-purple-800 border-purple-200',
      archived: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[status] || colors.pending;
  };

  const hasQualityIssues = record.qualityFlags && record.qualityFlags.length > 0;

  return (
    <div
      className={`relative bg-white rounded-lg border-2 p-4 transition-all duration-200 cursor-pointer hover:shadow-md ${
        selected
          ? 'border-blue-500 shadow-md'
          : hasQualityIssues
          ? 'border-yellow-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <EnrichmentSourceBadge
              sourceType={record.sourceType as any}
              size="sm"
            />
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getStatusColor(
                record.status
              )}`}
            >
              {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
            </span>
          </div>
          {hasQualityIssues && (
            <div className="flex items-center gap-1 mt-1">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-yellow-700">
                {record.qualityFlags!.length} quality issue
                {record.qualityFlags!.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <div className="text-right">
          <ConfidenceBadge
            score={record.overallConfidenceScore}
            label=""
            size="sm"
            showPercentage={false}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-3">
        {record.email && (
          <div className="flex items-center gap-2 text-sm">
            <EnvelopeIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 truncate flex-1">{record.email}</span>
            {record.emailVerified && (
              <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
            )}
          </div>
        )}

        {record.phone && (
          <div className="flex items-center gap-2 text-sm">
            <PhoneIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900">{record.phone}</span>
            {record.phoneVerified && (
              <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
            )}
          </div>
        )}

        {record.outlet && (
          <div className="flex items-center gap-2 text-sm">
            <GlobeAltIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 truncate flex-1">{record.outlet}</span>
            {record.outletAuthorityScore !== undefined && (
              <span className="text-xs text-gray-600 flex-shrink-0">
                ({record.outletAuthorityScore}/100)
              </span>
            )}
          </div>
        )}

        {record.jobTitle && (
          <div className="flex items-center gap-2 text-sm">
            <UserCircleIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700 truncate">{record.jobTitle}</span>
          </div>
        )}

        {record.location && (
          <div className="flex items-center gap-2 text-sm">
            <MapPinIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-700">{record.location}</span>
          </div>
        )}
      </div>

      {/* Beat Tags */}
      {record.beat && record.beat.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {record.beat.slice(0, 3).map((b) => (
            <span
              key={b}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
            >
              {b}
            </span>
          ))}
          {record.beat.length > 3 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-600">
              +{record.beat.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Quality Metrics */}
      <div className="space-y-2 mb-3">
        <ConfidenceBar score={record.completenessScore} showLabel={true} />
        <ConfidenceBar score={record.dataFreshnessScore} showLabel={true} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1">
          <ClockIcon className="h-3 w-3" />
          {record.enrichedAt
            ? `Enriched ${formatDate(record.enrichedAt)}`
            : `Created ${formatDate(record.createdAt)}`}
        </div>
        <button className="text-blue-600 hover:text-blue-800 font-medium">
          View Details →
        </button>
      </div>
    </div>
  );
}

interface EnrichmentRecordListProps {
  records: any[];
  selectedId?: string;
  onSelect?: (record: any) => void;
  emptyMessage?: string;
}

export function EnrichmentRecordList({
  records,
  selectedId,
  onSelect,
  emptyMessage = 'No enrichment records found',
}: EnrichmentRecordListProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <EnrichmentRecordCard
          key={record.id}
          record={record}
          selected={record.id === selectedId}
          onClick={() => onSelect?.(record)}
        />
      ))}
    </div>
  );
}
