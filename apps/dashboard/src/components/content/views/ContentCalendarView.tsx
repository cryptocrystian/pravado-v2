'use client';

/**
 * Content Calendar View
 *
 * Calendar view for content scheduling and planning.
 * Shows content publication schedule with theme grouping.
 * Entries link to content asset pages.
 *
 * Phase 4C: Calendar entries bound to content asset IDs
 * Clicking calendar entry opens asset work surface.
 *
 * NAVIGATION BEHAVIOR NOTE:
 * This Content Calendar differs from the Orchestration Calendar in click behavior:
 * - Content Calendar: Click navigates to the asset/brief detail page (work surface)
 * - Orchestration Calendar: Click opens a day-view drawer/modal (per ORCHESTRATION_CALENDAR_CONTRACT §3.2)
 *
 * This distinction is intentional:
 * - Content Calendar is a pillar-specific view optimized for content workflow
 * - Orchestration Calendar is a cross-pillar coordination view with inline day expansion
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md Section 4.4 (calendar integration)
 * @see /docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md Section 3.2 (day view behavior)
 * @see /docs/canon/UX_SURFACES.md (surface hierarchy and navigation)
 * @see /docs/canon/AUTOMATION_MODES_UX.md
 */

import { useRouter } from 'next/navigation';
import { useState, useMemo, useCallback } from 'react';

import { ContentEmptyState } from '../components/ContentEmptyState';
import { ContentLoadingSkeleton } from '../components/ContentLoadingSkeleton';
import { modeTokens } from '../tokens';
import type { ContentAsset, ContentBrief, AutomationMode, CrossPillarDependency } from '../types';

interface ContentCalendarViewProps {
  /** Published/scheduled assets */
  assets: ContentAsset[];
  /** Briefs with deadlines */
  briefs: ContentBrief[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error?: Error | null;
  /** Action handlers */
  onSelectAsset?: (assetId: string) => void;
  onSelectBrief?: (briefId: string) => void;
  onCreateBrief?: () => void;
}

// ============================================
// CONTENT FORMAT TYPES
// ============================================

type ContentFormat = 'long_form' | 'blog_post' | 'case_study' | 'whitepaper' | 'video' | 'infographic' | 'social';

const FORMAT_CONFIG: Record<ContentFormat, { label: string; color: string; bgColor: string }> = {
  long_form: { label: 'Long Form', color: 'text-brand-iris', bgColor: 'bg-brand-iris/10' },
  blog_post: { label: 'Blog', color: 'text-brand-cyan', bgColor: 'bg-brand-cyan/10' },
  case_study: { label: 'Case Study', color: 'text-brand-magenta', bgColor: 'bg-brand-magenta/10' },
  whitepaper: { label: 'Whitepaper', color: 'text-semantic-success', bgColor: 'bg-semantic-success/10' },
  video: { label: 'Video', color: 'text-semantic-warning', bgColor: 'bg-semantic-warning/10' },
  infographic: { label: 'Infographic', color: 'text-brand-cyan', bgColor: 'bg-brand-cyan/10' },
  social: { label: 'Social', color: 'text-white/60', bgColor: 'bg-slate-4' },
};

// ============================================
// CAMPAIGN TAGS
// ============================================

interface CampaignTag {
  id: string;
  name: string;
  color: string;
}

const MOCK_CAMPAIGNS: CampaignTag[] = [
  { id: 'camp-1', name: 'Q1 Launch', color: 'bg-brand-iris' },
  { id: 'camp-2', name: 'Authority Build', color: 'bg-brand-cyan' },
  { id: 'camp-3', name: 'Product Update', color: 'bg-brand-magenta' },
];

// ============================================
// DATE UTILITIES
// ============================================

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDay = firstDay.getDay();

  const days: (number | null)[] = [];

  // Fill in empty slots before the first day
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }

  // Fill in the days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return days;
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function ContentCalendarView({
  assets,
  briefs,
  isLoading,
  error,
  onSelectAsset,
  onSelectBrief,
  onCreateBrief,
}: ContentCalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedFormat, setSelectedFormat] = useState<ContentFormat | 'all'>('all');
  const today = new Date();

  // Get days for current month
  const days = getMonthDays(currentDate.getFullYear(), currentDate.getMonth());

  // Filter by format
  const filteredAssets = useMemo(() => {
    if (selectedFormat === 'all') return assets;
    return assets.filter((a) => a.contentType === selectedFormat);
  }, [assets, selectedFormat]);

  // Group items by date
  const itemsByDate = useMemo(() => {
    const map = new Map<string, { assets: ContentAsset[]; briefs: ContentBrief[] }>();

    // Group assets by publish date
    filteredAssets.forEach((asset) => {
      if (asset.publishedAt) {
        const date = new Date(asset.publishedAt);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!map.has(key)) {
          map.set(key, { assets: [], briefs: [] });
        }
        map.get(key)!.assets.push(asset);
      }
    });

    // Group briefs by deadline
    briefs.forEach((brief) => {
      if (brief.deadline) {
        const date = new Date(brief.deadline);
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        if (!map.has(key)) {
          map.set(key, { assets: [], briefs: [] });
        }
        map.get(key)!.briefs.push(brief);
      }
    });

    return map;
  }, [filteredAssets, briefs]);

  // Navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Handle asset click - navigate to asset page
  const handleAssetClick = (assetId: string) => {
    router.push(`/app/content/asset/${assetId}`);
    onSelectAsset?.(assetId);
  };

  // Handle brief click - navigate to brief page
  const handleBriefClick = (briefId: string) => {
    router.push(`/app/content/brief/${briefId}`);
    onSelectBrief?.(briefId);
  };

  if (isLoading) {
    return <ContentLoadingSkeleton type="calendar" />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="p-4 bg-semantic-danger/10 border border-semantic-danger/20 rounded-lg">
          <h4 className="text-sm font-semibold text-semantic-danger">Failed to load calendar</h4>
          <p className="text-xs text-white/55 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  const hasData = assets.length > 0 || briefs.length > 0;

  if (!hasData) {
    return (
      <ContentEmptyState
        view="calendar"
        onAction={onCreateBrief}
        actionLabel="Create Brief"
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Calendar Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-[#1A1A24]">
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-white min-w-[140px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 text-white/50 hover:text-white hover:bg-[#1A1A24] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Format Filter */}
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as ContentFormat | 'all')}
            className="px-2 py-1 text-xs bg-[#13131A] border border-[#1F1F28] rounded-lg text-white/70 focus:outline-none focus:border-brand-iris/40"
          >
            <option value="all">All Formats</option>
            {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs text-brand-iris hover:bg-brand-iris/10 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Format Lanes Legend */}
      <div className="px-4 py-2 flex items-center gap-3 border-b border-[#1A1A24] overflow-x-auto">
        {Object.entries(FORMAT_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setSelectedFormat(selectedFormat === key ? 'all' : key as ContentFormat)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium transition-colors ${
              selectedFormat === key
                ? `${config.bgColor} ${config.color} ring-1 ring-current`
                : 'bg-slate-4/50 text-white/40 hover:text-white/60'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${config.bgColor.replace('/10', '')}`} />
            {config.label}
          </button>
        ))}
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-[#1A1A24]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="px-2 py-2 text-center text-[10px] text-white/40 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-7 auto-rows-[minmax(100px,1fr)]">
          {days.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="border-r border-b border-[#1A1A24] bg-[#0A0A0F]" />;
            }

            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isToday = isSameDay(cellDate, today);
            const key = `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`;
            const items = itemsByDate.get(key);

            return (
              <CalendarCell
                key={key}
                day={day}
                isToday={isToday}
                assets={items?.assets || []}
                briefs={items?.briefs || []}
                onSelectAsset={handleAssetClick}
                onSelectBrief={handleBriefClick}
              />
            );
          })}
        </div>
      </div>

      {/* Campaign Legend */}
      <div className="px-4 py-2 flex items-center gap-4 border-t border-[#1A1A24]">
        <span className="text-[10px] text-white/40 uppercase">Campaigns:</span>
        {MOCK_CAMPAIGNS.map((campaign) => (
          <div key={campaign.id} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${campaign.color}`} />
            <span className="text-[10px] text-white/40">{campaign.name}</span>
          </div>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-semantic-success" />
            <span className="text-[10px] text-white/40">Published</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand-iris" />
            <span className="text-[10px] text-white/40">Brief Due</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CALENDAR ENTRY CARD
// Per CONTENT_WORK_SURFACE_CONTRACT.md Section 4.4
// ============================================

interface CalendarEntryCardProps {
  asset: ContentAsset;
  automationMode?: AutomationMode;
  crossPillarDeps?: CrossPillarDependency[];
  onClick: () => void;
}

function CalendarEntryCard({
  asset,
  // Default to manual (most restrictive) per AUTOMATION_MODES_UX.md mode ceiling principle
  automationMode = 'manual',
  crossPillarDeps = [],
  onClick,
}: CalendarEntryCardProps) {
  const format = (asset.contentType || 'long_form') as ContentFormat;
  const formatConfig = FORMAT_CONFIG[format] || FORMAT_CONFIG.long_form;
  const modeConfig = modeTokens[automationMode];

  // Check for cross-pillar dependencies
  const hasPRDeps = crossPillarDeps.some((d) => d.pillar === 'pr');
  const hasSEODeps = crossPillarDeps.some((d) => d.pillar === 'seo');

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-1.5 py-1 text-[10px] rounded transition-colors ${formatConfig.bgColor} ${formatConfig.color} hover:opacity-80 group`}
      title={`Click to open: ${asset.title}`}
    >
      <div className="flex items-center gap-1">
        <span className={`w-1 h-1 rounded-full shrink-0 ${formatConfig.bgColor.replace('/10', '')}`} />
        <span className="truncate flex-1">{asset.title}</span>
        {/* Mode badge */}
        <span className={`px-1 py-0.5 text-[7px] font-medium rounded ${modeConfig.bg} ${modeConfig.text} opacity-0 group-hover:opacity-100 transition-opacity`}>
          {modeConfig.label.charAt(0)}
        </span>
      </div>
      {/* Cross-pillar dependency indicators */}
      {(hasPRDeps || hasSEODeps) && (
        <div className="flex items-center gap-1 mt-0.5 pl-2">
          {hasPRDeps && (
            <span className="text-[7px] text-brand-magenta" title="PR dependency">
              PR
            </span>
          )}
          {hasSEODeps && (
            <span className="text-[7px] text-brand-cyan" title="SEO dependency">
              SEO
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ============================================
// CALENDAR CELL
// ============================================

interface CalendarCellProps {
  day: number;
  isToday: boolean;
  assets: ContentAsset[];
  briefs: ContentBrief[];
  onSelectAsset?: (assetId: string) => void;
  onSelectBrief?: (briefId: string) => void;
  /** Cross-pillar dependencies by asset ID */
  crossPillarDepsMap?: Map<string, CrossPillarDependency[]>;
  /** Automation mode per asset ID */
  automationModeMap?: Map<string, AutomationMode>;
}

function CalendarCell({
  day,
  isToday,
  assets,
  briefs,
  onSelectAsset,
  onSelectBrief,
  crossPillarDepsMap = new Map(),
  automationModeMap = new Map(),
}: CalendarCellProps) {
  const hasItems = assets.length > 0 || briefs.length > 0;

  return (
    <div
      className={`
        border-r border-b border-[#1A1A24] p-1.5
        ${isToday ? 'bg-brand-iris/5' : 'bg-[#0A0A0F]'}
        ${hasItems ? 'hover:bg-[#13131A]' : ''}
        transition-colors
      `}
    >
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1">
        <span
          className={`
            text-xs font-medium
            ${isToday ? 'text-brand-iris' : 'text-white/70'}
          `}
        >
          {day}
        </span>
        {isToday && (
          <span className="px-1 py-0.5 text-[8px] bg-brand-iris/20 text-brand-iris rounded">
            Today
          </span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-1">
        {/* Published assets with CalendarEntryCard */}
        {assets.slice(0, 2).map((asset) => (
          <CalendarEntryCard
            key={asset.id}
            asset={asset}
            automationMode={automationModeMap.get(asset.id) || 'manual'}
            crossPillarDeps={crossPillarDepsMap.get(asset.id) || []}
            onClick={() => onSelectAsset?.(asset.id)}
          />
        ))}

        {/* Briefs */}
        {briefs.slice(0, 2).map((brief) => (
          <button
            key={brief.id}
            onClick={() => onSelectBrief?.(brief.id)}
            className={`
              w-full text-left px-1.5 py-1 text-[10px] rounded truncate transition-colors
              ${
                brief.status === 'draft'
                  ? 'bg-semantic-warning/10 text-semantic-warning hover:bg-semantic-warning/20'
                  : 'bg-brand-iris/10 text-brand-iris hover:bg-brand-iris/20'
              }
            `}
            title={`Brief: ${brief.title}`}
          >
            <span className="flex items-center gap-1">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
              </svg>
              <span className="truncate">{brief.title}</span>
            </span>
          </button>
        ))}

        {/* Overflow indicator */}
        {(assets.length > 2 || briefs.length > 2) && (
          <span className="text-[9px] text-white/40">
            +{assets.length + briefs.length - 4} more
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================
// AGENDA VIEW (Alternative list layout)
// ============================================

interface ContentAgendaViewProps {
  assets: ContentAsset[];
  briefs: ContentBrief[];
  isLoading: boolean;
  onSelectAsset?: (assetId: string) => void;
  onSelectBrief?: (briefId: string) => void;
}

export function ContentAgendaView({
  assets,
  briefs,
  isLoading,
  onSelectAsset,
  onSelectBrief,
}: ContentAgendaViewProps) {
  const router = useRouter();

  // Handle asset click - navigate to asset page
  const handleAssetClick = (assetId: string) => {
    router.push(`/app/content/asset/${assetId}`);
    onSelectAsset?.(assetId);
  };

  // Handle brief click - navigate to brief page
  const handleBriefClick = (briefId: string) => {
    router.push(`/app/content/brief/${briefId}`);
    onSelectBrief?.(briefId);
  };

  // Group by date and sort
  const groupedItems = useMemo(() => {
    const items: Array<{
      date: Date;
      type: 'asset' | 'brief';
      item: ContentAsset | ContentBrief;
    }> = [];

    assets.forEach((asset) => {
      if (asset.publishedAt) {
        items.push({
          date: new Date(asset.publishedAt),
          type: 'asset',
          item: asset,
        });
      }
    });

    briefs.forEach((brief) => {
      if (brief.deadline) {
        items.push({
          date: new Date(brief.deadline),
          type: 'brief',
          item: brief,
        });
      }
    });

    // Sort by date
    items.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by date
    const grouped = new Map<string, typeof items>();
    items.forEach((item) => {
      const key = item.date.toDateString();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(item);
    });

    return grouped;
  }, [assets, briefs]);

  if (isLoading) {
    return <ContentLoadingSkeleton type="card" density="standard" count={6} />;
  }

  if (groupedItems.size === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-white/50">No scheduled content</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {Array.from(groupedItems.entries()).map(([dateKey, items]) => (
        <div key={dateKey}>
          <h4 className="text-xs font-medium text-white/50 mb-2">
            {new Date(dateKey).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </h4>
          <div className="space-y-2">
            {items.map((item, index) => {
              const format = item.type === 'asset'
                ? ((item.item as ContentAsset).contentType || 'long_form') as ContentFormat
                : null;
              const formatConfig = format ? FORMAT_CONFIG[format] : null;

              return (
                <button
                  key={index}
                  onClick={() =>
                    item.type === 'asset'
                      ? handleAssetClick(item.item.id)
                      : handleBriefClick(item.item.id)
                  }
                  className={`
                    w-full text-left p-3 rounded-lg border transition-colors
                    ${
                      item.type === 'asset'
                        ? 'bg-semantic-success/5 border-semantic-success/20 hover:border-semantic-success/40'
                        : 'bg-brand-iris/5 border-brand-iris/20 hover:border-brand-iris/40'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        item.type === 'asset' ? 'bg-semantic-success' : 'bg-brand-iris'
                      }`}
                    />
                    <span className="text-[10px] text-white/40 uppercase">
                      {item.type === 'asset' ? 'Published' : 'Brief Due'}
                    </span>
                    {formatConfig && (
                      <span className={`px-1.5 py-0.5 text-[9px] rounded-full ${formatConfig.bgColor} ${formatConfig.color}`}>
                        {formatConfig.label}
                      </span>
                    )}
                  </div>
                  <h5 className="text-sm font-medium text-white">{item.item.title}</h5>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
