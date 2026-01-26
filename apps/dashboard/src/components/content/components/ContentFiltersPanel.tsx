'use client';

/**
 * Content Filters Panel
 *
 * Multi-facet filtering for the Content Library view.
 * Supports status, type, entity, theme, and search filters.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import type { ContentStatus, ContentType } from '../types';

interface ContentFiltersPanelProps {
  statusFilter: ContentStatus | '';
  typeFilter: ContentType | '';
  searchQuery: string;
  onStatusChange: (status: ContentStatus | '') => void;
  onTypeChange: (type: ContentType | '') => void;
  onSearchChange: (query: string) => void;
  // Optional entity and theme filters
  entityFilter?: string;
  themeFilter?: string;
  onEntityChange?: (entity: string) => void;
  onThemeChange?: (theme: string) => void;
  // Available options (dynamic)
  availableEntities?: string[];
  availableThemes?: string[];
}

const STATUS_OPTIONS: { value: ContentStatus | ''; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'In Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

const TYPE_OPTIONS: { value: ContentType | ''; label: string }[] = [
  { value: '', label: 'All Types' },
  { value: 'blog_post', label: 'Blog Post' },
  { value: 'long_form', label: 'Long Form' },
  { value: 'landing_page', label: 'Landing Page' },
  { value: 'guide', label: 'Guide' },
  { value: 'case_study', label: 'Case Study' },
];

export function ContentFiltersPanel({
  statusFilter,
  typeFilter,
  searchQuery,
  onStatusChange,
  onTypeChange,
  onSearchChange,
  entityFilter,
  themeFilter,
  onEntityChange,
  onThemeChange,
  availableEntities = [],
  availableThemes = [],
}: ContentFiltersPanelProps) {
  const hasActiveFilters = statusFilter || typeFilter || entityFilter || themeFilter || searchQuery;

  const clearAllFilters = () => {
    onStatusChange('');
    onTypeChange('');
    onSearchChange('');
    onEntityChange?.('');
    onThemeChange?.('');
  };

  return (
    <div className="p-4 space-y-4 border-b border-[#1A1A24]">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-sm text-white bg-[#13131A] border border-[#1F1F28] rounded-lg placeholder:text-white/40 focus:outline-none focus:border-brand-iris/40 focus:ring-1 focus:ring-brand-iris/20 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex gap-2">
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as ContentStatus | '')}
          className="flex-1 px-3 py-2 text-sm text-white bg-[#13131A] border border-[#1F1F28] rounded-lg focus:outline-none focus:border-brand-iris/40 appearance-none cursor-pointer hover:border-[#2A2A36] transition-colors"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value as ContentType | '')}
          className="flex-1 px-3 py-2 text-sm text-white bg-[#13131A] border border-[#1F1F28] rounded-lg focus:outline-none focus:border-brand-iris/40 appearance-none cursor-pointer hover:border-[#2A2A36] transition-colors"
        >
          {TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Optional Entity Filter */}
      {availableEntities.length > 0 && onEntityChange && (
        <select
          value={entityFilter || ''}
          onChange={(e) => onEntityChange(e.target.value)}
          className="w-full px-3 py-2 text-sm text-white bg-[#13131A] border border-[#1F1F28] rounded-lg focus:outline-none focus:border-brand-iris/40 appearance-none cursor-pointer hover:border-[#2A2A36] transition-colors"
        >
          <option value="">All Entities</option>
          {availableEntities.map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
      )}

      {/* Optional Theme Filter */}
      {availableThemes.length > 0 && onThemeChange && (
        <select
          value={themeFilter || ''}
          onChange={(e) => onThemeChange(e.target.value)}
          className="w-full px-3 py-2 text-sm text-white bg-[#13131A] border border-[#1F1F28] rounded-lg focus:outline-none focus:border-brand-iris/40 appearance-none cursor-pointer hover:border-[#2A2A36] transition-colors"
        >
          <option value="">All Themes</option>
          {availableThemes.map((theme) => (
            <option key={theme} value={theme}>
              {theme}
            </option>
          ))}
        </select>
      )}

      {/* Active Filters & Clear */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {statusFilter && (
              <FilterChip
                label={`Status: ${statusFilter}`}
                onRemove={() => onStatusChange('')}
              />
            )}
            {typeFilter && (
              <FilterChip
                label={`Type: ${typeFilter}`}
                onRemove={() => onTypeChange('')}
              />
            )}
            {entityFilter && (
              <FilterChip
                label={`Entity: ${entityFilter}`}
                onRemove={() => onEntityChange?.('')}
              />
            )}
            {themeFilter && (
              <FilterChip
                label={`Theme: ${themeFilter}`}
                onRemove={() => onThemeChange?.('')}
              />
            )}
          </div>
          <button
            onClick={clearAllFilters}
            className="text-xs text-brand-iris hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================
// FILTER CHIP COMPONENT
// ============================================

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] bg-brand-iris/10 text-brand-iris rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-white transition-colors"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}

// ============================================
// QUICK FILTER BAR (Alternative compact layout)
// ============================================

interface QuickFilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts?: Record<string, number>;
}

export function QuickFilterBar({ activeFilter, onFilterChange, counts = {} }: QuickFilterBarProps) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Draft' },
    { key: 'review', label: 'Review' },
    { key: 'published', label: 'Published' },
  ];

  return (
    <div className="flex items-center gap-1 p-2 bg-[#0A0A0F] border-b border-[#1A1A24]">
      {filters.map((filter) => (
        <button
          key={filter.key}
          onClick={() => onFilterChange(filter.key)}
          className={`
            px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
            ${
              activeFilter === filter.key
                ? 'bg-brand-iris/15 text-brand-iris'
                : 'text-white/50 hover:text-white hover:bg-[#13131A]'
            }
          `}
        >
          {filter.label}
          {counts[filter.key] !== undefined && (
            <span className="ml-1 text-[10px] opacity-60">({counts[filter.key]})</span>
          )}
        </button>
      ))}
    </div>
  );
}
