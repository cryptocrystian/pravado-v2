/**
 * Enrichment Source Badge Component (Sprint S50)
 * Displays the source type of an enrichment record
 */

import React from 'react';
import {
  EnvelopeIcon,
  GlobeAltIcon,
  UserGroupIcon,
  PencilIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

type EnrichmentSourceType =
  | 'email_verification'
  | 'social_scraping'
  | 'outlet_authority'
  | 'manual_entry'
  | 'api_integration'
  | 'web_scraping'
  | 'media_database'
  | 'contact_import';

interface EnrichmentSourceBadgeProps {
  sourceType: EnrichmentSourceType;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  variant?: 'default' | 'outlined';
}

export function EnrichmentSourceBadge({
  sourceType,
  size = 'md',
  showIcon = true,
  variant = 'default',
}: EnrichmentSourceBadgeProps) {
  const sourceConfig: Record<
    EnrichmentSourceType,
    { label: string; color: string; icon: React.ComponentType<any> }
  > = {
    email_verification: {
      label: 'Email Verified',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: EnvelopeIcon,
    },
    social_scraping: {
      label: 'Social Media',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: UserGroupIcon,
    },
    outlet_authority: {
      label: 'Outlet Authority',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: GlobeAltIcon,
    },
    manual_entry: {
      label: 'Manual Entry',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: PencilIcon,
    },
    api_integration: {
      label: 'API Integration',
      color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      icon: LinkIcon,
    },
    web_scraping: {
      label: 'Web Scraping',
      color: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      icon: MagnifyingGlassIcon,
    },
    media_database: {
      label: 'Media Database',
      color: 'bg-teal-100 text-teal-800 border-teal-200',
      icon: DocumentTextIcon,
    },
    contact_import: {
      label: 'Contact Import',
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      icon: ArrowDownTrayIcon,
    },
  };

  const config = sourceConfig[sourceType];
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const variantClasses =
    variant === 'outlined'
      ? `bg-white border-2 ${config.color.split(' ')[1]} ${config.color.split(' ')[2]}`
      : config.color;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${variantClasses} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

interface EnrichmentSourceListProps {
  sources: EnrichmentSourceType[];
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function EnrichmentSourceList({
  sources,
  maxDisplay = 3,
  size = 'sm',
}: EnrichmentSourceListProps) {
  const displaySources = sources.slice(0, maxDisplay);
  const remaining = sources.length - maxDisplay;

  return (
    <div className="flex flex-wrap gap-1.5">
      {displaySources.map((source) => (
        <EnrichmentSourceBadge key={source} sourceType={source} size={size} />
      ))}
      {remaining > 0 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          +{remaining} more
        </span>
      )}
    </div>
  );
}
