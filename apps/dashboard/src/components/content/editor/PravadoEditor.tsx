'use client';

/**
 * PravadoEditor - Document-first TipTap editor for Manual mode
 *
 * Purpose-built for the Manual workbench's document editing experience.
 * Simpler than TiptapEditor (no slash commands, no block insert handle).
 * Focused on clean writing with inline formatting via BubbleMenu.
 *
 * Extensions: StarterKit, Placeholder, Typography, CharacterCount,
 *             Link, Highlight, CiteMindMark
 *
 * @see /docs/canon/CONTENT_WORK_SURFACE_CONTRACT.md
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { CiteMindMark } from './CiteMindMark';
import type { ContentStatus } from '../types';
import { CONTENT_STATUS_CONFIG } from '../types';

// ============================================
// TYPES
// ============================================

export interface PravadoEditorProps {
  initialTitle?: string;
  initialContent?: string;
  status?: ContentStatus;
  onTitleChange?: (title: string) => void;
  onContentChange?: (html: string) => void;
  onWordCountChange?: (count: number) => void;
  onSave?: (data: { title: string; content: string }) => void;
  autoSaveDelay?: number;
}

// ============================================
// BUBBLE TOOLBAR
// ============================================

function EditorBubbleToolbar({ editor }: { editor: NonNullable<ReturnType<typeof useEditor>> }) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const linkInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
    }
  }, [showLinkInput]);

  const toggleLink = () => {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    setShowLinkInput(true);
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
  };

  const applyLink = () => {
    if (linkUrl) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded transition-colors ${
      isActive
        ? 'bg-brand-iris/20 text-brand-iris'
        : 'text-white/60 hover:text-white hover:bg-white/10'
    }`;

  if (showLinkInput) {
    return (
      <div className="flex items-center gap-1 px-2 py-1.5 bg-slate-2 border border-slate-4 rounded-lg shadow-xl">
        <input
          ref={linkInputRef}
          type="url"
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
            if (e.key === 'Escape') { setShowLinkInput(false); setLinkUrl(''); }
          }}
          placeholder="Paste URL..."
          className="w-48 px-2 py-1 text-sm bg-slate-3 border border-slate-4 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-brand-iris/40"
        />
        <button type="button" onClick={applyLink} className="px-2 py-1 text-xs font-medium text-white bg-brand-iris rounded hover:bg-brand-iris/90 transition-colors">
          Apply
        </button>
        <button type="button" onClick={() => { setShowLinkInput(false); setLinkUrl(''); }} className="p-1 text-white/40 hover:text-white transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 px-2 py-1.5 bg-slate-2 border border-slate-4 rounded-lg shadow-xl">
      {/* Bold */}
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))} title="Bold (Cmd+B)">
        <span className="text-sm font-bold w-5 h-5 flex items-center justify-center">B</span>
      </button>
      {/* Italic */}
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))} title="Italic (Cmd+I)">
        <span className="text-sm italic w-5 h-5 flex items-center justify-center">I</span>
      </button>
      <span className="w-px h-5 bg-white/10 mx-0.5" />
      {/* H1 */}
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btnClass(editor.isActive('heading', { level: 1 }))} title="Heading 1">
        <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">H1</span>
      </button>
      {/* H2 */}
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))} title="Heading 2">
        <span className="text-xs font-bold w-5 h-5 flex items-center justify-center">H2</span>
      </button>
      <span className="w-px h-5 bg-white/10 mx-0.5" />
      {/* Link */}
      <button type="button" onClick={toggleLink} className={btnClass(editor.isActive('link'))} title="Link (Cmd+K)">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
      {/* Highlight */}
      <button type="button" onClick={() => editor.chain().focus().toggleHighlight().run()} className={btnClass(editor.isActive('highlight'))} title="Highlight">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

// ============================================
// MAIN EDITOR COMPONENT
// ============================================

export function PravadoEditor({
  initialTitle = '',
  initialContent = '',
  status = 'draft',
  onTitleChange,
  onContentChange,
  onWordCountChange,
  onSave,
  autoSaveDelay = 2000,
}: PravadoEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [wordCount, setWordCount] = useState(0);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const savedTimerRef = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef(initialContent);

  // Sync title from props when switching documents
  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  // Auto-resize title textarea
  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto';
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`;
    }
  }, [title]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  // Schedule auto-save
  const scheduleAutoSave = useCallback(() => {
    if (!onSave || autoSaveDelay <= 0) return;

    setSaveStatus('saving');

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      onSave({ title, content: contentRef.current });
      setSaveStatus('saved');
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, autoSaveDelay);
  }, [onSave, autoSaveDelay, title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Typography,
      CharacterCount,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          class: 'text-brand-iris underline decoration-brand-iris/40 hover:decoration-brand-iris cursor-pointer',
        },
      }),
      Highlight.configure({
        HTMLAttributes: {
          class: 'bg-brand-iris/20 text-white rounded px-0.5',
        },
      }),
      CiteMindMark,
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[60vh] px-8 py-6 text-white/85 text-[15px] leading-relaxed',
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      contentRef.current = html;
      onContentChange?.(html);

      // Word count
      const text = ed.getText();
      const wc = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
      setWordCount(wc);
      onWordCountChange?.(wc);

      scheduleAutoSave();
    },
  });

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    onTitleChange?.(newTitle);
    scheduleAutoSave();
  };

  const statusConfig = CONTENT_STATUS_CONFIG[status];

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-iris/30 border-t-brand-iris rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Document header */}
      <div className="px-8 pt-6 pb-2 shrink-0">
        {/* Editable title */}
        <textarea
          ref={titleRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled document"
          rows={1}
          className="w-full text-2xl font-semibold text-white/95 bg-transparent border-none outline-none resize-none placeholder:text-white/20 leading-tight"
        />

        {/* Status row */}
        <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === 'draft' ? 'bg-white/40' :
              status === 'published' ? 'bg-green-400' :
              status === 'ready' ? 'bg-brand-cyan' :
              'bg-amber-400'
            }`} />
            <span className={statusConfig.color}>{statusConfig.label}</span>
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span>
            {saveStatus === 'saving' ? 'Saving...' :
             saveStatus === 'saved' ? 'Saved' :
             'Draft'}
          </span>
          <span className="w-px h-3 bg-white/10" />
          <span>{wordCount.toLocaleString()} words</span>
        </div>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <BubbleMenu editor={editor}>
          <EditorBubbleToolbar editor={editor} />
        </BubbleMenu>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
