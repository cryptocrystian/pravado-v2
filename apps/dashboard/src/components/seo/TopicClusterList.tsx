'use client';

/**
 * TopicClusterList — Left panel cluster list (300px).
 *
 * HONEST DATA: renders the real SERP-overlap clusters passed in from useSeoTopics.
 * Score is shown only when the org actually ranks (real avg position → score);
 * the trend arrow is shown only when a trend is genuinely computed (≥ 2 snapshots).
 * No mock clusters, and no "SAGE Suggested" section — there is no honest source for
 * suggested clusters, so it is omitted rather than fabricated.
 */

import {
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  ArrowUp,
  ArrowDown,
  Minus,
  WarningCircle,
} from '@phosphor-icons/react';
import { useState } from 'react';

import type { SeoTopicCluster } from '@/hooks/useSeoTopics';

import { getClusterStatusLabel, getClusterStatusColor } from './seo-mock-data';

interface TopicClusterListProps {
  clusters: SeoTopicCluster[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function TopicClusterList({
  clusters,
  selectedId,
  onSelect,
}: TopicClusterListProps) {
  const [search, setSearch] = useState('');
  const [managedOpen, setManagedOpen] = useState(true);

  const filtered = search
    ? clusters.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
      )
    : clusters;

  return (
    <div className="w-[300px] flex-shrink-0 border-r border-border-subtle flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Topic Clusters</h2>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <MagnifyingGlass
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="Search clusters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/5 border border-border-subtle rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-brand-cyan/30 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <button
          type="button"
          onClick={() => setManagedOpen(!managedOpen)}
          className="flex items-center gap-2 px-4 py-2 w-full text-left"
        >
          {managedOpen ? (
            <CaretDown size={12} className="text-white/30" />
          ) : (
            <CaretRight size={12} className="text-white/30" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-white/45">
            Clusters ({filtered.length})
          </span>
        </button>

        {managedOpen &&
          filtered.map((cluster) => (
            <ClusterListItem
              key={cluster.id}
              cluster={cluster}
              isActive={cluster.id === selectedId}
              onClick={() => onSelect(cluster.id)}
            />
          ))}
      </div>
    </div>
  );
}

function ClusterListItem({
  cluster,
  isActive,
  onClick,
}: {
  cluster: SeoTopicCluster;
  isActive: boolean;
  onClick: () => void;
}) {
  // Score can be null when the org doesn't rank for any member keyword — show a
  // status badge only when there is a real score.
  const hasScore = cluster.score !== null;
  const statusLabel = hasScore ? getClusterStatusLabel(cluster.score!) : null;
  const statusColor = hasScore ? getClusterStatusColor(cluster.score!) : '';
  const isCritical = hasScore && cluster.score! < 50;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2.5 cursor-pointer border-b border-border-subtle flex items-center justify-between text-left transition-colors hover:bg-white/[0.03] ${
        isActive ? 'bg-white/5 border-l-2 border-l-brand-cyan' : ''
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isCritical && (
          <WarningCircle
            size={14}
            className="text-semantic-danger shrink-0"
            weight="fill"
          />
        )}
        <span className="text-sm text-white truncate">{cluster.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {hasScore ? (
          <span className="text-sm font-bold text-white">{cluster.score}</span>
        ) : (
          <span
            className="text-xs text-white/40"
            title="No owned ranking yet — no visibility score"
          >
            —
          </span>
        )}
        {statusLabel && (
          <span
            className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}
          >
            {statusLabel}
          </span>
        )}
        {cluster.trend === 'up' && (
          <ArrowUp size={10} className="text-semantic-success" weight="bold" />
        )}
        {cluster.trend === 'down' && (
          <ArrowDown size={10} className="text-semantic-danger" weight="bold" />
        )}
        {cluster.trend === 'stable' && (
          <Minus size={10} className="text-white/30" weight="bold" />
        )}
      </div>
    </button>
  );
}
