/**
 * CrisisFiltersBar Component (Sprint S55)
 *
 * Horizontal filter bar for crisis incidents with severity, status,
 * trajectory, search, and sorting options
 */

'use client';

import React from 'react';
import {
  Search,
  Filter,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import type {
  CrisisSeverity,
  IncidentStatus,
  CrisisTrajectory,
  CrisisPropagationLevel,
} from '@pravado/types';
import { SEVERITY_COLORS, STATUS_COLORS, TRAJECTORY_COLORS, PROPAGATION_COLORS } from '@/lib/crisisApi';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface CrisisFilters {
  searchQuery?: string;
  severity?: CrisisSeverity[];
  status?: IncidentStatus[];
  trajectory?: CrisisTrajectory[];
  propagationLevel?: CrisisPropagationLevel[];
  isEscalated?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'severity' | 'riskScore' | 'mentionCount';
  sortOrder?: 'asc' | 'desc';
}

interface CrisisFiltersBarProps {
  filters: CrisisFilters;
  onFiltersChange: (filters: CrisisFilters) => void;
  totalCount?: number;
  filteredCount?: number;
  className?: string;
}

const SEVERITY_OPTIONS: CrisisSeverity[] = ['severe', 'critical', 'high', 'medium', 'low'];
const STATUS_OPTIONS: IncidentStatus[] = ['active', 'contained', 'resolved', 'closed'];
const TRAJECTORY_OPTIONS: CrisisTrajectory[] = [
  'critical',
  'worsening',
  'stable',
  'improving',
  'resolved',
  'unknown',
];
const PROPAGATION_OPTIONS: CrisisPropagationLevel[] = [
  'saturated',
  'mainstream',
  'viral',
  'spreading',
  'contained',
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'severity', label: 'Severity' },
  { value: 'riskScore', label: 'Risk Score' },
  { value: 'mentionCount', label: 'Mentions' },
];

export default function CrisisFiltersBar({
  filters,
  onFiltersChange,
  totalCount = 0,
  filteredCount = 0,
  className = '',
}: CrisisFiltersBarProps) {
  const hasActiveFilters =
    (filters.severity && filters.severity.length > 0) ||
    (filters.status && filters.status.length > 0) ||
    (filters.trajectory && filters.trajectory.length > 0) ||
    (filters.propagationLevel && filters.propagationLevel.length > 0) ||
    filters.isEscalated !== undefined ||
    filters.searchQuery;

  const activeFilterCount = [
    filters.severity?.length || 0,
    filters.status?.length || 0,
    filters.trajectory?.length || 0,
    filters.propagationLevel?.length || 0,
    filters.isEscalated !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({ ...filters, searchQuery: e.target.value || undefined });
  };

  const toggleSeverity = (severity: CrisisSeverity) => {
    const current = filters.severity || [];
    const updated = current.includes(severity)
      ? current.filter((s) => s !== severity)
      : [...current, severity];
    onFiltersChange({ ...filters, severity: updated.length > 0 ? updated : undefined });
  };

  const toggleStatus = (status: IncidentStatus) => {
    const current = filters.status || [];
    const updated = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];
    onFiltersChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const toggleTrajectory = (trajectory: CrisisTrajectory) => {
    const current = filters.trajectory || [];
    const updated = current.includes(trajectory)
      ? current.filter((t) => t !== trajectory)
      : [...current, trajectory];
    onFiltersChange({ ...filters, trajectory: updated.length > 0 ? updated : undefined });
  };

  const togglePropagation = (level: CrisisPropagationLevel) => {
    const current = filters.propagationLevel || [];
    const updated = current.includes(level)
      ? current.filter((l) => l !== level)
      : [...current, level];
    onFiltersChange({
      ...filters,
      propagationLevel: updated.length > 0 ? updated : undefined,
    });
  };

  const toggleEscalated = () => {
    onFiltersChange({
      ...filters,
      isEscalated: filters.isEscalated === true ? undefined : true,
    });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({
      ...filters,
      sortBy: value as CrisisFilters['sortBy'],
    });
  };

  const toggleSortOrder = () => {
    onFiltersChange({
      ...filters,
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={filters.searchQuery || ''}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>

        {/* Severity Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Severity
              {filters.severity && filters.severity.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1">
                  {filters.severity.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Severity Level</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SEVERITY_OPTIONS.map((severity) => {
              const colors = SEVERITY_COLORS[severity];
              return (
                <DropdownMenuCheckboxItem
                  key={severity}
                  checked={filters.severity?.includes(severity)}
                  onCheckedChange={() => toggleSeverity(severity)}
                >
                  <span className={cn('capitalize', colors.text)}>{severity}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Filter className="h-4 w-4 mr-1" />
              Status
              {filters.status && filters.status.length > 0 && (
                <Badge variant="secondary" className="ml-1 px-1">
                  {filters.status.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Incident Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {STATUS_OPTIONS.map((status) => {
              const colors = STATUS_COLORS[status];
              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filters.status?.includes(status)}
                  onCheckedChange={() => toggleStatus(status)}
                >
                  <span className={cn('capitalize', colors.text)}>{status}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Advanced Filters */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <SlidersHorizontal className="h-4 w-4 mr-1" />
              More
              {(filters.trajectory?.length ||
                filters.propagationLevel?.length ||
                filters.isEscalated) && (
                <Badge variant="secondary" className="ml-1 px-1">
                  {(filters.trajectory?.length || 0) +
                    (filters.propagationLevel?.length || 0) +
                    (filters.isEscalated ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Trajectory</DropdownMenuLabel>
            {TRAJECTORY_OPTIONS.map((trajectory) => {
              const colors = TRAJECTORY_COLORS[trajectory];
              return (
                <DropdownMenuCheckboxItem
                  key={trajectory}
                  checked={filters.trajectory?.includes(trajectory)}
                  onCheckedChange={() => toggleTrajectory(trajectory)}
                >
                  <span className={cn('capitalize', colors.text)}>{trajectory}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Propagation</DropdownMenuLabel>
            {PROPAGATION_OPTIONS.map((level) => {
              const colors = PROPAGATION_COLORS[level];
              return (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={filters.propagationLevel?.includes(level)}
                  onCheckedChange={() => togglePropagation(level)}
                >
                  <Radio className="h-3 w-3 mr-1" />
                  <span className={cn('capitalize', colors.text)}>{level}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={filters.isEscalated === true}
              onCheckedChange={toggleEscalated}
            >
              <AlertTriangle className="h-3 w-3 mr-1 text-red-600" />
              Escalated Only
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort */}
        <div className="flex items-center gap-1">
          <Select
            value={filters.sortBy || 'createdAt'}
            onValueChange={handleSortChange}
          >
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={toggleSortOrder}
          >
            <ArrowUpDown
              className={cn(
                'h-4 w-4',
                filters.sortOrder === 'asc' && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Filter Summary & Results Count */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <span className="text-muted-foreground">
              Showing {filteredCount} of {totalCount} incidents
            </span>
          )}
          {!hasActiveFilters && (
            <span className="text-muted-foreground">
              {totalCount} incidents
            </span>
          )}
        </div>

        {/* Active Filter Badges */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-1">
            {filters.severity?.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className={cn('text-xs', SEVERITY_COLORS[s].bg, SEVERITY_COLORS[s].text)}
              >
                {s}
                <button
                  className="ml-1 hover:text-destructive"
                  onClick={() => toggleSeverity(s)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.status?.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className={cn('text-xs', STATUS_COLORS[s].bg, STATUS_COLORS[s].text)}
              >
                {s}
                <button
                  className="ml-1 hover:text-destructive"
                  onClick={() => toggleStatus(s)}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {filters.isEscalated && (
              <Badge variant="outline" className="text-xs bg-red-100 text-red-700">
                Escalated
                <button
                  className="ml-1 hover:text-destructive"
                  onClick={toggleEscalated}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
