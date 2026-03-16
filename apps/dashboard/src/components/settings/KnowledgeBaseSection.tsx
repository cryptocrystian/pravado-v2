'use client';

import { useState } from 'react';
import { CaretDown, CaretRight, Upload, X } from '@phosphor-icons/react';
import type { KBCategory } from '@/components/content/content-mock-data';

interface KnowledgeBaseSectionProps {
  category: KBCategory;
}

// Mock uploaded files per category
const mockFiles: Record<string, Array<{ name: string; size: string }>> = {
  'kb-1': [{ name: 'company-overview-2026.txt', size: '4.2 KB' }],
  'kb-2': [
    { name: 'product-catalog.docx', size: '18.7 KB' },
    { name: 'pricing-table.txt', size: '2.1 KB' },
  ],
  'kb-4': [{ name: 'brand-messaging-guide.docx', size: '12.3 KB' }],
};

export function KnowledgeBaseSection({ category }: KnowledgeBaseSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const files = mockFiles[category.id] ?? [];

  return (
    <div className="bg-cc-surface border border-white/8 rounded-2xl mb-3 overflow-hidden">
      {/* Header row */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <CaretDown size={16} className="text-white/45" />
          ) : (
            <CaretRight size={16} className="text-white/45" />
          )}
          <span className="text-base font-semibold text-white">
            {category.name}
          </span>
          {category.fileCount > 0 && (
            <span className="bg-white/5 text-white/45 text-xs px-2 py-0.5 rounded-full">
              {category.fileCount} file{category.fileCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-white/5">
          <p className="text-xs text-white/45 mt-4 mb-4">{category.helper}</p>

          {/* Upload zone */}
          <div className="border border-dashed border-white/[0.16] rounded-xl p-6 text-center mb-4">
            <Upload size={24} className="text-white/45 mx-auto mb-2" />
            <p className="text-sm text-white/45">
              Drop files here or click to upload
            </p>
            <p className="text-xs text-white/30 mt-1">Accepts .txt, .docx, .pdf</p>
          </div>

          {/* Paste textarea */}
          <textarea
            rows={4}
            placeholder={`Paste ${category.name.toLowerCase()} content here...`}
            className="w-full bg-white/5 border border-white/8 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cc-cyan/50 transition-colors resize-none mb-4"
          />

          {/* Uploaded files list */}
          {files.length > 0 && (
            <div>
              <span className="text-xs text-white/45 block mb-2">Uploaded files</span>
              <div className="space-y-1.5">
                {files.map((file) => (
                  <div
                    key={file.name}
                    className="flex items-center justify-between bg-cc-page border border-white/8 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-white truncate">{file.name}</span>
                      <span className="text-xs text-white/45 flex-shrink-0">{file.size}</span>
                    </div>
                    <button
                      type="button"
                      className="text-white/30 hover:text-red-500 transition-colors flex-shrink-0 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
