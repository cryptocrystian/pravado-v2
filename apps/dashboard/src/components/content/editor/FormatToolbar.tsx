'use client';

/**
 * FormatToolbar - Always-visible formatting toolbar
 *
 * Persistent horizontal toolbar above the editor with block type selectors,
 * inline formatting, list controls, and save state indicator.
 * Complements the BubbleMenu (floating toolbar on selection).
 *
 * Editor v2: Inline link editing UI replaces window.prompt.
 */

import { useState, useRef, useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import type { SaveState } from './TiptapEditor';
import { EDITOR_V2 } from './editor-flags';

export interface FormatToolbarProps {
  editor: Editor;
  saveState: SaveState;
  className?: string;
  /** Set to true to programmatically open the link editor (e.g. from Cmd+K) */
  linkEditRequested?: boolean;
  /** Called when the inline link editor closes */
  onLinkEditDone?: () => void;
}

export function FormatToolbar({
  editor,
  saveState,
  className = '',
  linkEditRequested,
  onLinkEditDone,
}: FormatToolbarProps) {
  // Inline link editing state (Editor v2)
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus link input when shown
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  // Handle Cmd+K request from parent
  useEffect(() => {
    if (linkEditRequested && EDITOR_V2) {
      openLinkEditor();
    }
  }, [linkEditRequested]);

  const openLinkEditor = () => {
    const existingUrl = editor.getAttributes('link').href || '';
    setLinkUrl(existingUrl);
    setShowLinkInput(true);
  };

  const applyLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    closeLinkEditor();
  };

  const removeLink = () => {
    editor.chain().focus().unsetLink().run();
    closeLinkEditor();
  };

  const closeLinkEditor = () => {
    setShowLinkInput(false);
    setLinkUrl('');
    onLinkEditDone?.();
  };

  const handleLinkClick = () => {
    if (editor.isActive('link')) {
      if (EDITOR_V2) {
        openLinkEditor();
      } else {
        editor.chain().focus().unsetLink().run();
      }
    } else if (EDITOR_V2) {
      openLinkEditor();
    } else {
      const url = window.prompt('Enter URL');
      if (url) {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
    }
  };

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-brand-iris/20 text-brand-iris'
        : 'text-white/50 hover:text-white hover:bg-white/10'
    }`;

  const disabledBtnClass =
    'p-1.5 rounded transition-colors text-white/50 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:cursor-not-allowed';

  return (
    <div
      className={`shrink-0 ${className}`}
    >
      {/* Toolbar — document-bound, separated zones */}
      <div className="flex items-center gap-0 px-2 py-1 bg-slate-1 border-b border-white/[0.05]">
        {/* Document actions zone (left) */}
        <div className="flex items-center gap-0.5 pr-2 mr-2 border-r border-white/[0.06]">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={disabledBtnClass}
            title="Undo (Cmd+Z)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={disabledBtnClass}
            title="Redo (Cmd+Shift+Z)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 10H11a5 5 0 00-5 5v2m15-7l-4-4m4 4l-4 4" />
            </svg>
          </button>
        </div>

        {/* Block type zone */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().setParagraph().run()}
            className={btnClass(editor.isActive('paragraph') && !editor.isActive('heading'))}
            title="Paragraph"
          >
            <span className="text-xs font-medium w-5 h-5 flex items-center justify-center">P</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={btnClass(editor.isActive('heading', { level: 1 }))}
            title="Heading 1"
          >
            <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">H1</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={btnClass(editor.isActive('heading', { level: 2 }))}
            title="Heading 2"
          >
            <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">H2</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={btnClass(editor.isActive('heading', { level: 3 }))}
            title="Heading 3"
          >
            <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">H3</span>
          </button>
        </div>

        <Separator />

        {/* Formatting zone (center) */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={btnClass(editor.isActive('bold'))}
            title="Bold (Cmd+B)"
          >
            <span className="text-sm font-bold w-5 h-5 flex items-center justify-center">B</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={btnClass(editor.isActive('italic'))}
            title="Italic (Cmd+I)"
          >
            <span className="text-sm italic w-5 h-5 flex items-center justify-center">I</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={btnClass(editor.isActive('underline'))}
            title="Underline (Cmd+U)"
          >
            <span className="text-sm underline w-5 h-5 flex items-center justify-center">U</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={btnClass(editor.isActive('strike'))}
            title="Strikethrough"
          >
            <span className="text-sm line-through w-5 h-5 flex items-center justify-center">S</span>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={btnClass(editor.isActive('code'))}
            title="Inline code"
          >
            <span className="text-xs font-mono w-5 h-5 flex items-center justify-center">{'{}'}</span>
          </button>
        </div>

        <Separator />

        {/* Structure zone */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={btnClass(editor.isActive('bulletList'))}
            title="Bullet list"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={btnClass(editor.isActive('orderedList'))}
            title="Numbered list"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 6h13M8 12h13M8 18h13" />
              <text x="1.5" y="8" className="text-xs" fill="currentColor" stroke="none">1</text>
              <text x="1.5" y="14" className="text-xs" fill="currentColor" stroke="none">2</text>
              <text x="1.5" y="20" className="text-xs" fill="currentColor" stroke="none">3</text>
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={btnClass(editor.isActive('blockquote'))}
            title="Blockquote"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className={btnClass(false)}
            title="Horizontal rule"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 12h16" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleLinkClick}
            className={btnClass(editor.isActive('link'))}
            title="Link (Cmd+K)"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </button>
        </div>

        {/* Inline link editor (Editor v2) */}
        {showLinkInput && EDITOR_V2 && (
          <div className="flex items-center gap-1 ml-2">
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyLink();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  closeLinkEditor();
                }
              }}
              placeholder="Paste URL..."
              className="w-44 px-2 py-0.5 text-xs bg-white/[0.03] border border-white/[0.08] rounded text-white placeholder:text-white/25 focus:outline-none focus:border-brand-iris/40"
            />
            <button
              type="button"
              onClick={applyLink}
              className="px-2 py-0.5 text-xs font-medium text-white bg-brand-iris rounded hover:bg-brand-iris/90 transition-colors"
            >
              Apply
            </button>
            {editor.isActive('link') && (
              <button
                type="button"
                onClick={removeLink}
                className="px-2 py-0.5 text-xs font-medium text-semantic-danger/70 hover:text-semantic-danger bg-semantic-danger/10 rounded transition-colors"
                title="Remove link"
              >
                Remove
              </button>
            )}
            <button
              type="button"
              onClick={closeLinkEditor}
              className="p-0.5 text-white/30 hover:text-white transition-colors"
              title="Cancel"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Spacer */}
        <span className="flex-1" />

        {/* Save state indicator — subdued */}
        <div className="flex items-center gap-2 text-xs">
          {saveState === 'saving' && (
            <span className="flex items-center gap-1 text-white/25">
              <span className="w-1 h-1 rounded-full bg-white/20 animate-pulse" />
              Saving
            </span>
          )}
          {saveState === 'saved' && (
            <span className="flex items-center gap-1 text-semantic-success/50">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {saveState === 'error' && (
            <span className="flex items-center gap-1 text-semantic-danger/60">
              Save failed
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Separator() {
  return <span className="w-px h-5 bg-white/10 mx-1" />;
}
