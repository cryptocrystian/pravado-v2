'use client';

/**
 * DocumentRail - Left rail document list for Manual mode workbench
 *
 * 220px fixed width. Shows a flat list of ContentAsset[] sorted by updatedAt.
 * Supports selection, status badges, and create-new button.
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useMemo } from 'react';
import type { ContentAsset } from '../types';
import { CONTENT_STATUS_CONFIG } from '../types';

// ============================================
// TYPES
// ============================================

export interface DocumentRailProps {
  documents: ContentAsset[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  isLoading?: boolean;
}

// ============================================
// HELPERS
// ============================================

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// ============================================
// MAIN COMPONENT
// ============================================

export function DocumentRail({
  documents,
  selectedId,
  onSelect,
  onCreateNew,
  isLoading,
}: DocumentRailProps) {
  // Sort by updatedAt descending
  const sorted = useMemo(
    () => [...documents].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [documents]
  );

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2.5 border-b border-slate-4 shrink-0">
          <h3 className="text-sm font-semibold text-white/70">Documents</h3>
        </div>
        <div className="flex-1 p-2 space-y-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 bg-slate-3 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-slate-4 shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white/70">Documents</h3>
          <span className="px-1.5 py-0.5 text-xs font-medium text-white/45 bg-white/5 rounded">
            {sorted.length}
          </span>
        </div>
      </div>

      {/* Document list */}
      {sorted.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-brand-iris/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-brand-iris/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-white/70">No documents yet</p>
            <button
              onClick={onCreateNew}
              className="mt-3 px-4 py-2 text-sm font-semibold text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors"
            >
              Create your first document
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5" role="listbox">
          {sorted.map((doc) => {
            const isSelected = selectedId === doc.id;
            const statusConf = CONTENT_STATUS_CONFIG[doc.status];

            return (
              <button
                key={doc.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => onSelect(doc.id)}
                className={`
                  w-full text-left px-3 py-2.5 rounded-lg cursor-pointer
                  transition-all duration-100 border-l-2
                  focus:outline-none focus-visible:ring-1 focus-visible:ring-brand-iris/50
                  ${isSelected
                    ? 'bg-brand-iris/10 border-l-brand-iris'
                    : 'bg-transparent border-l-transparent hover:bg-slate-3'
                  }
                `}
              >
                {/* Title */}
                <span className={`block text-sm font-medium leading-snug line-clamp-2 ${
                  isSelected ? 'text-white' : 'text-white/85'
                }`}>
                  {doc.title || 'Untitled'}
                </span>

                {/* Status + timestamp */}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`px-1.5 py-0.5 text-xs font-medium rounded bg-white/5 ${statusConf.color}`}>
                    {statusConf.label}
                  </span>
                  <span className="text-xs text-white/30">
                    {formatRelativeTime(doc.updatedAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer: Create new */}
      {sorted.length > 0 && (
        <div className="p-2 border-t border-slate-4 shrink-0">
          <button
            onClick={onCreateNew}
            className="w-full px-3 py-2 text-sm font-semibold text-white bg-brand-iris hover:bg-brand-iris/90 rounded-lg transition-colors"
          >
            + New Document
          </button>
        </div>
      )}
    </div>
  );
}
