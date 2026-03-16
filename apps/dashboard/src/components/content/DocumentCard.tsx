'use client';

import Link from 'next/link';
import type { ContentDocument, DocStatus } from './content-mock-data';

const statusConfig: Record<DocStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-white/5 text-white/45' },
  in_progress: { label: 'In Progress', className: 'bg-white/5 text-white/45' },
  review: { label: 'Review', className: 'bg-amber-500/10 text-amber-500' },
  published: { label: 'Published', className: 'bg-semantic-success/10 text-semantic-success' },
  archived: { label: 'Archived', className: 'bg-white/5 text-white/45' },
};

function citeMindColor(score: number): string {
  if (score >= 85) return 'text-cc-cyan';
  if (score >= 70) return 'text-semantic-success';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

function citeMindBarColor(score: number): string {
  if (score >= 85) return 'bg-cc-cyan';
  if (score >= 70) return 'bg-semantic-success';
  if (score >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

export function DocumentCard({ doc }: { doc: ContentDocument }) {
  const status = statusConfig[doc.status];

  return (
    <Link href={`/app/content/${doc.id}`}>
      <div className="bg-cc-surface border border-white/8 rounded-2xl p-5 hover:border-white/[0.16] transition-colors cursor-pointer h-full flex flex-col">
        {/* Top row: type badge + status chip */}
        <div className="flex items-center justify-between">
          <span className="bg-cc-cyan/10 text-cc-cyan text-xs px-2 py-0.5 rounded-full">
            {doc.typeLabel}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status.className}`}>
            {status.label}
          </span>
        </div>

        {/* Title */}
        <h4 className="text-base font-semibold text-white mt-2 mb-1 line-clamp-2">
          {doc.title}
        </h4>

        {/* Meta row */}
        <p className="text-[13px] text-white/50 mb-3">
          {doc.wordCount.toLocaleString()} words &middot; {doc.lastModified}
        </p>

        {/* CiteMind score row */}
        <div className="mt-auto flex items-center gap-2">
          <span className="text-[13px] text-white/50">CiteMind</span>
          <span className={`text-sm font-bold ${citeMindColor(doc.citeMindScore)}`}>
            {doc.citeMindScore}
          </span>
          <div className="w-20 h-1 rounded-full bg-white/8 flex-shrink-0">
            <div
              className={`h-full rounded-full ${citeMindBarColor(doc.citeMindScore)}`}
              style={{ width: `${doc.citeMindScore}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
