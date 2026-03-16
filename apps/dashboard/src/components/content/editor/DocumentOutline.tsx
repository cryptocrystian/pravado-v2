'use client';

/**
 * DocumentOutline - Left rail heading navigator
 *
 * Reads the heading hierarchy from the Tiptap editor and renders a
 * clickable outline. Updates in real-time as the user types.
 *
 * When no document is being edited, shows a content list for navigation.
 */

import type { HeadingNode } from './TiptapEditor';

// ============================================
// TYPES
// ============================================

export interface DocumentOutlineProps {
  /** Heading nodes extracted from the editor */
  headings: HeadingNode[];
  /** Currently active heading (by scroll position) */
  activeHeadingId?: string;
  /** Called when user clicks a heading to scroll to it */
  onHeadingClick: (pos: number) => void;
  /** Document title for the header */
  documentTitle?: string;
  /** Word count for display */
  wordCount?: number;
}

// ============================================
// COMPONENT
// ============================================

export function DocumentOutline({
  headings,
  activeHeadingId,
  onHeadingClick,
  documentTitle,
  wordCount,
}: DocumentOutlineProps) {
  // Indentation by heading level
  const indent: Record<number, string> = {
    1: 'pl-3',
    2: 'pl-6',
    3: 'pl-9',
  };

  const textSize: Record<number, string> = {
    1: 'text-[12px] font-semibold',
    2: 'text-[12px] font-medium',
    3: 'text-xs font-normal',
  };

  return (
    <div className="h-full flex flex-col bg-slate-1">
      {/* Header — compact */}
      <div className="px-3 py-2.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-1.5 mb-1">
          <svg className="w-3.5 h-3.5 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
          </svg>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/25">
            Outline
          </h3>
        </div>
        {documentTitle && (
          <p className="text-[12px] font-medium text-white/60 truncate leading-snug">{documentTitle}</p>
        )}
        {wordCount !== undefined && wordCount > 0 && (
          <p className="text-xs text-white/20 mt-0.5">
            {wordCount.toLocaleString()} words · {Math.max(1, Math.ceil(wordCount / 238))} min
          </p>
        )}
      </div>

      {/* Heading list with tracking line */}
      <div className="flex-1 overflow-y-auto py-2 relative">
        {headings.length === 0 ? (
          <div className="px-3 py-4">
            {/* Guided empty state — explain purpose + how to create headings */}
            <div className="space-y-4">
              <div className="p-2.5 bg-white/[0.02] border border-white/[0.04] rounded-lg">
                <p className="text-xs text-white/30 leading-relaxed">
                  Your headings appear here as a navigable table of contents. Click any heading to jump to it.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/15 mb-2">Create headings with</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-white/20">
                    <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-xs font-mono text-white/30">/</kbd>
                    <span>then choose H1, H2, or H3</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/20">
                    <span className="w-5 text-center text-xs font-bold text-white/20 bg-white/[0.04] rounded py-0.5">H2</span>
                    <span>from the toolbar above</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <nav>
            {/* Vertical tracking line */}
            <div className="absolute left-0 top-2 bottom-2 w-px bg-white/[0.04]" />

            {headings.map((heading) => {
              const isActive = heading.id === activeHeadingId;

              return (
                <button
                  key={heading.id}
                  type="button"
                  onClick={() => onHeadingClick(heading.pos)}
                  className={`
                    w-full text-left py-1.5 transition-all duration-150 group relative
                    ${indent[heading.level] || 'pl-3'}
                    ${isActive
                      ? 'bg-brand-iris/[0.06]'
                      : 'hover:bg-white/[0.03]'
                    }
                  `}
                >
                  {/* Active indicator — left edge glow */}
                  {isActive && (
                    <div className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-brand-iris rounded-r" />
                  )}

                  <span
                    className={`
                      block truncate leading-snug pr-3
                      ${textSize[heading.level] || 'text-xs'}
                      ${isActive ? 'text-white/90' : 'text-white/35 group-hover:text-white/55'}
                    `}
                  >
                    {heading.text || (
                      <span className="italic text-white/15">Empty heading</span>
                    )}
                  </span>
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-1.5 border-t border-white/[0.04] shrink-0">
        {headings.length > 0 ? (
          <span className="text-xs text-white/15">
            Click a heading to jump
          </span>
        ) : (
          <span className="text-xs text-white/10">
            {(wordCount ?? 0) > 0 ? `${headings.length} sections` : 'Start writing to build your outline'}
          </span>
        )}
      </div>
    </div>
  );
}
