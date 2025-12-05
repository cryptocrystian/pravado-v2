/**
 * NarrativeFiltersBar Component (Sprint S70)
 *
 * Filters for the unified narratives list
 */

'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import type { NarrativeType, NarrativeStatus } from '@pravado/types';
import {
  NARRATIVE_TYPE_LABELS,
  NARRATIVE_STATUS_LABELS,
} from '@pravado/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface NarrativeFilters {
  search: string;
  narrativeType?: NarrativeType;
  status?: NarrativeStatus;
  sortBy: 'created_at' | 'updated_at' | 'period_start' | 'title';
  sortOrder: 'asc' | 'desc';
}

interface NarrativeFiltersBarProps {
  filters: NarrativeFilters;
  onFiltersChange: (filters: NarrativeFilters) => void;
  className?: string;
}

export default function NarrativeFiltersBar({
  filters,
  onFiltersChange,
  className = '',
}: NarrativeFiltersBarProps) {
  const hasActiveFilters =
    filters.search ||
    filters.narrativeType ||
    filters.status;

  const handleClearFilters = () => {
    onFiltersChange({
      search: '',
      narrativeType: undefined,
      status: undefined,
      sortBy: 'updated_at',
      sortOrder: 'desc',
    });
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search narratives..."
          value={filters.search}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="pl-9"
        />
      </div>

      {/* Narrative Type */}
      <Select
        value={filters.narrativeType || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            narrativeType: value === 'all' ? undefined : (value as NarrativeType),
          })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All Types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {Object.entries(NARRATIVE_TYPE_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={filters.status || 'all'}
        onValueChange={(value) =>
          onFiltersChange({
            ...filters,
            status: value === 'all' ? undefined : (value as NarrativeStatus),
          })
        }
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          {Object.entries(NARRATIVE_STATUS_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort By */}
      <Select
        value={`${filters.sortBy}-${filters.sortOrder}`}
        onValueChange={(value) => {
          const [sortBy, sortOrder] = value.split('-') as [
            'created_at' | 'updated_at' | 'period_start' | 'title',
            'asc' | 'desc'
          ];
          onFiltersChange({ ...filters, sortBy, sortOrder });
        }}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="updated_at-desc">Latest Updated</SelectItem>
          <SelectItem value="updated_at-asc">Oldest Updated</SelectItem>
          <SelectItem value="created_at-desc">Newest Created</SelectItem>
          <SelectItem value="created_at-asc">Oldest Created</SelectItem>
          <SelectItem value="period_start-desc">Latest Period</SelectItem>
          <SelectItem value="period_start-asc">Earliest Period</SelectItem>
          <SelectItem value="title-asc">Title A-Z</SelectItem>
          <SelectItem value="title-desc">Title Z-A</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
}
