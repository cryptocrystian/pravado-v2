'use client';

/**
 * ArticleEditor - Full article editing experience
 *
 * Three-panel layout:
 * [ Outline (left, collapsible) ] [ Writing Canvas (center, dominant) ] [ Intelligence Margin (right) ]
 *
 * Features:
 * - Focus mode (hides panels and toolbar, Escape to exit)
 * - Active heading tracking (wires cursor position to outline)
 * - Document-level meta header (type, status, save state, mode)
 * - Intelligence margin with writer-oriented sections
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { TiptapEditor, type TiptapEditorHandle, type HeadingNode, type SaveState } from './TiptapEditor';
import { DocumentOutline } from './DocumentOutline';
import type { ContentStatus } from '../types';
import { CONTENT_STATUS_CONFIG, CONTENT_TYPE_CONFIG } from '../types';

// ============================================
// TYPES
// ============================================

export interface ArticleEditorProps {
  /** Article ID */
  id: string;
  /** Article title (editable) */
  initialTitle?: string;
  /** Initial HTML content for the editor */
  initialContent?: string;
  /** Current status */
  status?: ContentStatus;
  /** Content type label */
  contentType?: 'article' | 'email' | 'social_post' | 'landing_page' | 'campaign';
  /** Called when content is auto-saved */
  onSave?: (data: { title: string; content: string }) => void;
  /** Called when status changes */
  onStatusChange?: (status: ContentStatus) => void;
  /** Called when user navigates back */
  onBack?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ArticleEditor({
  id: _id,
  initialTitle = '',
  initialContent = '',
  status = 'draft',
  contentType = 'article',
  onSave,
  onStatusChange,
  onBack,
}: ArticleEditorProps) {
  const editorRef = useRef<TiptapEditorHandle>(null);

  // Editor state
  const [title, setTitle] = useState(initialTitle);
  const [headings, setHeadings] = useState<HeadingNode[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [activeHeadingId, setActiveHeadingId] = useState<string | undefined>();
  const [outlineCollapsed, setOutlineCollapsed] = useState(false);
  const [marginCollapsed, setMarginCollapsed] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  // Preserve panel state when entering/exiting focus mode
  const [preFocusOutline, setPreFocusOutline] = useState(false);
  const [preFocusMargin, setPreFocusMargin] = useState(true);

  // Title input ref for auto-focus
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus title if empty
  useEffect(() => {
    if (!initialTitle && titleRef.current) {
      titleRef.current.focus();
    }
  }, []);

  // Focus mode: Escape key handler
  useEffect(() => {
    if (!focusMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitFocusMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusMode]);

  const enterFocusMode = () => {
    setPreFocusOutline(outlineCollapsed);
    setPreFocusMargin(marginCollapsed);
    setOutlineCollapsed(true);
    setMarginCollapsed(true);
    setFocusMode(true);
  };

  const exitFocusMode = () => {
    setOutlineCollapsed(preFocusOutline);
    setMarginCollapsed(preFocusMargin);
    setFocusMode(false);
  };

  // Handle heading extraction from editor
  const handleHeadingsChange = useCallback((newHeadings: HeadingNode[]) => {
    setHeadings(newHeadings);
  }, []);

  // Handle content update (for callbacks)
  const handleContentUpdate = useCallback((html: string) => {
    // Word count is now tracked inside TiptapEditor via onWordCountChange
    void html;
  }, []);

  // Handle word count from TiptapEditor
  const handleWordCountChange = useCallback((count: number) => {
    setWordCount(count);
  }, []);

  // Handle cursor position change -> active heading tracking
  const handleSelectionChange = useCallback(
    (pos: number) => {
      if (headings.length === 0) {
        setActiveHeadingId(undefined);
        return;
      }

      // Find the heading just before or at the cursor position
      let active: HeadingNode | undefined;
      for (const h of headings) {
        if (h.pos <= pos) {
          active = h;
        } else {
          break;
        }
      }
      setActiveHeadingId(active?.id);
    },
    [headings]
  );

  // Handle auto-save
  const handleAutoSave = useCallback(
    (html: string) => {
      onSave?.({ title, content: html });
    },
    [title, onSave]
  );

  // Handle save state from editor
  const handleSaveStateChange = useCallback((state: SaveState) => {
    setSaveState(state);
  }, []);

  // Handle outline heading click
  const handleHeadingClick = useCallback(
    (pos: number) => {
      editorRef.current?.scrollToPos(pos);
    },
    []
  );

  // Handle title Enter key -> move to editor
  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editorRef.current?.getEditor()?.commands.focus('start');
    }
  };

  // Auto-resize title textarea
  const handleTitleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTitle(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = e.target.scrollHeight + 'px';
  };

  const statusConfig = CONTENT_STATUS_CONFIG[status];
  const typeConfig = CONTENT_TYPE_CONFIG[contentType];

  return (
    <div className="h-full flex flex-col bg-slate-1 overflow-hidden">
      {/* App navigation bar — ultra-receded, almost invisible */}
      {focusMode ? (
        <div className="shrink-0 border-b border-white/[0.04]">
          <div className="flex items-center justify-center px-4 py-1">
            <button
              type="button"
              onClick={exitFocusMode}
              className="flex items-center gap-2 px-3 py-0.5 text-xs font-medium text-white/30 hover:text-white/60 bg-white/[0.02] hover:bg-white/[0.04] rounded transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
              </svg>
              Exit focus
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-xs font-mono">Esc</kbd>
            </button>
          </div>
        </div>
      ) : (
        <div className="shrink-0 border-b border-white/[0.04]">
          <div className="flex items-center gap-2 px-3 py-1">
            {/* Back button */}
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-0.5 text-white/20 hover:text-white/50 hover:bg-white/5 rounded transition-colors shrink-0"
                title="Back to content list"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Breadcrumb — ghosted */}
            <span className="text-xs text-white/15 select-none">
              Content
              <span className="mx-1 text-white/10">/</span>
              <span className="text-white/25">{typeConfig.label}</span>
            </span>

            <span className="flex-1" />

            {/* Panel toggles — ghosted until hover */}
            <div className="flex items-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={enterFocusMode}
                className="p-1 rounded transition-colors text-white/30 hover:text-white/60 hover:bg-white/5"
                title="Focus mode"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setOutlineCollapsed(!outlineCollapsed)}
                className={`p-1 rounded transition-colors ${
                  outlineCollapsed ? 'text-white/30 hover:text-white/60' : 'text-brand-iris/50'
                } hover:bg-white/5`}
                title={outlineCollapsed ? 'Show outline' : 'Hide outline'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h10M4 18h6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setMarginCollapsed(!marginCollapsed)}
                className={`p-1 rounded transition-colors ${
                  marginCollapsed ? 'text-white/30 hover:text-white/60' : 'text-brand-iris/50'
                } hover:bg-white/5`}
                title={marginCollapsed ? 'Show intelligence panel' : 'Hide intelligence panel'}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Three-panel layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* LEFT: Document Outline */}
        <div
          className={`shrink-0 border-r border-white/[0.04] transition-all duration-200 overflow-hidden ${
            outlineCollapsed ? 'w-0' : 'w-[220px]'
          }`}
        >
          {!outlineCollapsed && (
            <DocumentOutline
              headings={headings}
              activeHeadingId={activeHeadingId}
              onHeadingClick={handleHeadingClick}
              documentTitle={title || 'Untitled'}
              wordCount={wordCount}
            />
          )}
        </div>

        {/* CENTER: Writing Canvas (dominant, fills viewport) */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-1">
          {/* Document meta header — tight, receded, bound to the document */}
          {!focusMode && (
            <div className="shrink-0 px-8 py-1.5 flex items-center gap-2.5 border-b border-white/[0.04]">
              {/* Content type */}
              <span className="text-xs font-medium text-white/20 uppercase tracking-wider">
                {typeConfig.icon} {typeConfig.label}
              </span>

              <span className="w-px h-3 bg-white/[0.06]" />

              {/* Status badge */}
              <span className={`px-1.5 py-0.5 text-xs font-semibold rounded ${statusConfig.color} bg-white/[0.03]`}>
                {statusConfig.label}
              </span>

              {/* Mode indicator */}
              <span className="text-xs font-medium text-white/15">
                Manual
              </span>

              <span className="flex-1" />

              {/* Word count + reading time */}
              {wordCount > 0 && (
                <div className="flex items-center gap-2 text-xs text-white/20">
                  <span>{wordCount.toLocaleString()} words</span>
                  <span className="text-white/[0.06]">·</span>
                  <span>{Math.max(1, Math.ceil(wordCount / 238))} min read</span>
                </div>
              )}

              {/* Save state — always visible when active */}
              <div className="text-xs">
                {saveState === 'saving' && (
                  <span className="flex items-center gap-1.5 text-white/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-iris/60 animate-pulse" />
                    Saving...
                  </span>
                )}
                {saveState === 'saved' && (
                  <span className="flex items-center gap-1 text-semantic-success/60">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved
                  </span>
                )}
                {saveState === 'error' && (
                  <span className="flex items-center gap-1 text-semantic-danger/60">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                    </svg>
                    Save failed
                  </span>
                )}
              </div>

              {/* Status actions — compact */}
              {status === 'draft' && (
                <button
                  type="button"
                  onClick={() => onStatusChange?.('needs_review')}
                  className="px-2 py-0.5 text-xs font-medium text-white/40 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded transition-colors"
                >
                  Submit for Review
                </button>
              )}
              {status === 'needs_review' && (
                <button
                  type="button"
                  onClick={() => onStatusChange?.('ready')}
                  className="px-2 py-0.5 text-xs font-medium text-white bg-brand-iris hover:bg-brand-iris/90 rounded transition-colors"
                >
                  Mark Ready
                </button>
              )}
              {status === 'ready' && (
                <button
                  type="button"
                  onClick={() => onStatusChange?.('published')}
                  className="px-2 py-0.5 text-xs font-medium text-white bg-semantic-success hover:bg-semantic-success/90 rounded transition-colors"
                >
                  Publish
                </button>
              )}
            </div>
          )}

          {/* Title — tight to the document, prominent */}
          <div className="shrink-0">
            <div className="max-w-[720px] w-full mx-auto px-8 pt-5 pb-1">
              <textarea
                ref={titleRef}
                value={title}
                onChange={handleTitleInput}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled"
                rows={1}
                className="w-full text-[32px] font-bold text-white/95 bg-transparent border-none resize-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-white/10 leading-[1.15] tracking-[-0.025em]"
                style={{ overflow: 'hidden' }}
              />
            </div>
          </div>

          {/* Editor — fills remaining space */}
          <div className="flex-1 min-h-0">
            <TiptapEditor
              ref={editorRef}
              content={initialContent}
              onUpdate={handleContentUpdate}
              onHeadingsChange={handleHeadingsChange}
              onSelectionChange={handleSelectionChange}
              onAutoSave={handleAutoSave}
              onSaveStateChange={handleSaveStateChange}
              onWordCountChange={handleWordCountChange}
              autoSaveDelay={2000}
              showToolbar={!focusMode}
              placeholder="Start writing here..."
            />
          </div>
        </div>

        {/* RIGHT: Intelligence Margin */}
        <div
          className={`shrink-0 border-l border-white/[0.04] transition-all duration-200 overflow-hidden ${
            marginCollapsed ? 'w-0' : 'w-[280px]'
          }`}
        >
          {!marginCollapsed && <IntelligenceMargin />}
        </div>
      </div>
    </div>
  );
}

// ============================================
// INTELLIGENCE MARGIN (writer-oriented sections)
// ============================================

interface IntelligenceSection {
  icon: React.ReactNode;
  title: string;
  description: string;
  status: 'coming_soon';
}

const INTELLIGENCE_SECTIONS: IntelligenceSection[] = [
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Citation Health',
    description: 'CiteMind will flag claims that need sources and verify existing citations.',
    status: 'coming_soon',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Authority Signals',
    description: 'SAGE evaluates how content reinforces your entity authority and expertise.',
    status: 'coming_soon',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Readability & Clarity',
    description: 'Sentence complexity, passive voice detection, and reading level scoring.',
    status: 'coming_soon',
  },
  {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: 'Cross-Pillar Opportunities',
    description: 'Connections to PR pitches, SEO keywords, and campaign themes.',
    status: 'coming_soon',
  },
];

function IntelligenceMargin() {
  return (
    <div className="h-full flex flex-col bg-slate-1">
      <div className="px-4 py-2.5 border-b border-white/[0.04] shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-brand-iris/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/30">
            Intelligence
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {INTELLIGENCE_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="p-2.5 rounded-lg bg-white/[0.015] border border-white/[0.04]"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-brand-iris/30">{section.icon}</span>
                <h4 className="text-xs font-semibold text-white/40">{section.title}</h4>
              </div>
              <p className="text-xs text-white/20 leading-relaxed">{section.description}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-white/8" />
                <span className="text-xs text-white/15 uppercase tracking-wider">Coming soon</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-3 py-2 border-t border-white/[0.04] shrink-0">
        <p className="text-xs text-white/15 leading-relaxed">
          Intelligence signals are advisory. You always have final say.
        </p>
      </div>
    </div>
  );
}
