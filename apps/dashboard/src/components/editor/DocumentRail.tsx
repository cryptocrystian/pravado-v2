'use client';

import { FileText, Plus, MagnifyingGlass } from '@phosphor-icons/react';
import type { EditorDocument } from './editor-mock-data';

function scoreColor(score: number): string {
  if (score >= 85) return 'text-cc-cyan';
  if (score >= 70) return 'text-semantic-success';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

const statusDot: Record<EditorDocument['status'], string> = {
  draft: 'bg-white/30',
  needs_review: 'bg-amber-500',
  ready: 'bg-semantic-success',
  published: 'bg-cc-cyan',
};

interface DocumentRailProps {
  documents: EditorDocument[];
  currentId: string;
  onSelect: (id: string) => void;
}

export function DocumentRail({ documents, currentId, onSelect }: DocumentRailProps) {
  return (
    <div className="w-[220px] flex-shrink-0 bg-cc-surface border-r border-white/8 flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/45 uppercase tracking-wider">
            Documents
          </span>
          <button
            type="button"
            className="p-1 rounded-md hover:bg-white/5 transition-colors"
          >
            <Plus size={14} className="text-white/45" />
          </button>
        </div>
        <div className="relative">
          <MagnifyingGlass
            size={13}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30"
          />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white/5 border border-white/8 rounded-lg pl-7 pr-2 py-1.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/30 transition-colors"
          />
        </div>
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto py-1">
        {documents.map((doc) => {
          const isActive = doc.id === currentId;
          return (
            <button
              key={doc.id}
              type="button"
              onClick={() => onSelect(doc.id)}
              className={`w-full text-left px-3 py-2.5 flex items-start gap-2 transition-colors ${
                isActive
                  ? 'bg-white/5 border-l-2 border-cc-cyan'
                  : 'border-l-2 border-transparent hover:bg-white/[0.02]'
              }`}
            >
              <FileText size={16} className="text-white/30 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span
                  className={`text-xs block truncate ${
                    isActive ? 'text-white font-medium' : 'text-white/70'
                  }`}
                >
                  {doc.title}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${statusDot[doc.status]}`}
                    />
                    <span className="text-xs text-white/30 capitalize">
                      {doc.status.replace('_', ' ')}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] tabular-nums font-medium ${scoreColor(doc.citeMindScore)}`}
                  >
                    {doc.citeMindScore}
                  </span>
                </div>
                <span className="text-xs text-white/30 block mt-0.5">
                  {doc.updatedAt}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
