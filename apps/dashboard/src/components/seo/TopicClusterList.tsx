'use client';

/**
 * TopicClusterList — Left panel cluster list (300px).
 */

import { useState } from 'react';
import {
  MagnifyingGlass,
  CaretDown,
  CaretRight,
  ArrowUp,
  ArrowDown,
  Minus,
  WarningCircle,
} from '@phosphor-icons/react';
import {
  mockClusters,
  mockSuggestedClusters,
  getClusterStatusLabel,
  getClusterStatusColor,
} from './seo-mock-data';
import type { TopicCluster } from './seo-mock-data';

interface TopicClusterListProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function TopicClusterList({ selectedId, onSelect }: TopicClusterListProps) {
  const [search, setSearch] = useState('');
  const [managedOpen, setManagedOpen] = useState(true);
  const [suggestedOpen, setSuggestedOpen] = useState(true);

  const filtered = search
    ? mockClusters.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : mockClusters;

  return (
    <div className="w-[300px] flex-shrink-0 border-r border-white/8 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-5 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">Topic Clusters</h2>
          <button
            type="button"
            className="bg-cc-cyan text-cc-page rounded-xl px-3 py-1.5 text-sm font-medium hover:bg-cc-cyan/90 transition-colors"
          >
            + Add Cluster
          </button>
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
            className="w-full bg-white/5 border border-white/8 rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30 transition-colors"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {/* Managed section */}
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
            Managed Clusters ({filtered.length})
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

        {/* Suggested section */}
        <button
          type="button"
          onClick={() => setSuggestedOpen(!suggestedOpen)}
          className="flex items-center gap-2 px-4 py-2 w-full text-left mt-2"
        >
          {suggestedOpen ? (
            <CaretDown size={12} className="text-white/30" />
          ) : (
            <CaretRight size={12} className="text-white/30" />
          )}
          <span className="text-xs font-bold uppercase tracking-wider text-white/45">
            SAGE Suggested ({mockSuggestedClusters.length})
          </span>
        </button>

        {suggestedOpen &&
          mockSuggestedClusters.map((s) => (
            <div
              key={s.name}
              className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between"
            >
              <span className="text-sm text-white/70">{s.name}</span>
              <button
                type="button"
                className="text-xs text-cc-cyan hover:text-cc-cyan/80 transition-colors"
              >
                Add to track?
              </button>
            </div>
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
  cluster: TopicCluster;
  isActive: boolean;
  onClick: () => void;
}) {
  const statusLabel = getClusterStatusLabel(cluster.score);
  const statusColor = getClusterStatusColor(cluster.score);
  const isCritical = cluster.score < 50;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full px-3 py-2.5 cursor-pointer border-b border-white/5 flex items-center justify-between text-left transition-colors hover:bg-white/[0.03] ${
        isActive ? 'bg-white/5 border-l-2 border-l-cc-cyan' : ''
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {isCritical && (
          <WarningCircle size={14} className="text-red-500 shrink-0" weight="fill" />
        )}
        <span className="text-sm text-white truncate">{cluster.name}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <span className="text-sm font-bold text-white">{cluster.score}</span>
        <span
          className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
        {cluster.trend === 'up' && (
          <ArrowUp size={10} className="text-semantic-success" weight="bold" />
        )}
        {cluster.trend === 'down' && (
          <ArrowDown size={10} className="text-red-500" weight="bold" />
        )}
        {cluster.trend === 'stable' && (
          <Minus size={10} className="text-white/30" weight="bold" />
        )}
      </div>
    </button>
  );
}
