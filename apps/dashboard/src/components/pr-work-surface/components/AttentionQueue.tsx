'use client';

/**
 * Attention Queue - DS 3.0
 *
 * Displays items requiring immediate user attention.
 * All actions require manual execution.
 *
 * @see /docs/canon/PR_WORK_SURFACE_CONTRACT.md
 */

import type { AttentionItem } from '../types';

interface Props {
  items: AttentionItem[];
  onActionClick?: (item: AttentionItem) => void;
}

function PriorityBadge({ priority }: { priority: string }) {
  const colors = {
    critical: 'bg-semantic-danger/15 text-semantic-danger ring-semantic-danger/30',
    high: 'bg-semantic-warning/15 text-semantic-warning ring-semantic-warning/30',
    medium: 'bg-brand-cyan/15 text-brand-cyan ring-brand-cyan/30',
    low: 'bg-white/10 text-white/50 ring-white/20',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ring-1 ${colors[priority as keyof typeof colors] || colors.low}`}>
      {priority}
    </span>
  );
}

export function AttentionQueue({ items, onActionClick }: Props) {
  if (items.length === 0) {
    return (
      <div className="p-8 text-center rounded-xl border border-dashed border-[#1A1A24]">
        <svg className="w-12 h-12 mx-auto text-white/40 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-white/55">All caught up! No items require attention.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="p-4 rounded-xl bg-[#0D0D12] border border-[#1A1A24] hover:border-[#2A2A36] transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <PriorityBadge priority={item.priority} />
                {item.dueBy && (
                  <span className="text-xs text-white/55">
                    Due {new Date(item.dueBy).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
              <h3 className="font-medium text-white">{item.title}</h3>
              <p className="text-sm text-white/55 mt-1">{item.description}</p>
            </div>
            <button
              type="button"
              onClick={() => onActionClick?.(item)}
              className="shrink-0 px-4 py-2 text-sm font-medium text-white bg-brand-iris rounded-lg hover:bg-brand-iris/90 transition-colors"
            >
              {item.actionLabel}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
