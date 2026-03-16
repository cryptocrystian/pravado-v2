'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';
import Highlight from '@tiptap/extension-highlight';
import {
  FloppyDisk,
  SidebarSimple,
  Clock,
  X,
  Lightning,
} from '@phosphor-icons/react';
import { SlashCommandPalette } from './SlashCommandPalette';
import { BubbleToolbar } from './BubbleToolbar';
import type { BriefContext, SlashCommand } from './editor-mock-data';
import './editor-canvas-styles.css';

interface EditorCanvasProps {
  documentTitle: string;
  initialContent: string;
  briefContext: BriefContext | null;
  citeMindScore: number;
  showDocRail: boolean;
  showCiteMindRail: boolean;
  onToggleDocRail: () => void;
  onToggleCiteMindRail: () => void;
}

export function EditorCanvas({
  documentTitle,
  initialContent,
  briefContext,
  citeMindScore,
  showDocRail,
  showCiteMindRail,
  onToggleDocRail,
  onToggleCiteMindRail,
}: EditorCanvasProps) {
  const [showBrief, setShowBrief] = useState(!!briefContext);
  const [autoSaveStatus, setAutoSaveStatus] = useState('Saved');
  const [slashMenu, setSlashMenu] = useState<{
    top: number;
    left: number;
    filter: string;
  } | null>(null);
  const slashStartPosRef = useRef<number | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing or type / for commands...',
      }),
      Typography,
      CharacterCount,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'focus:outline-none',
      },
    },
    onUpdate: ({ editor: ed }) => {
      setAutoSaveStatus('Unsaved');

      // Slash command detection
      const { state } = ed;
      const { from } = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        '\n',
      );

      const slashMatch = textBefore.match(/\/([a-zA-Z]*)$/);
      if (slashMatch) {
        if (slashStartPosRef.current === null) {
          slashStartPosRef.current = from - slashMatch[0].length;
        }
        const coords = ed.view.coordsAtPos(from);
        setSlashMenu({
          top: coords.bottom + 4,
          left: coords.left,
          filter: slashMatch[1],
        });
      } else {
        setSlashMenu(null);
        slashStartPosRef.current = null;
      }
    },
  });

  // Autosave simulation (3s debounce → Saving... → Saved)
  useEffect(() => {
    if (autoSaveStatus !== 'Unsaved') return;
    const timer = setTimeout(() => {
      setAutoSaveStatus('Saving...');
      setTimeout(() => setAutoSaveStatus('Saved'), 800);
    }, 3000);
    return () => clearTimeout(timer);
  }, [autoSaveStatus]);

  const handleSlashSelect = useCallback(
    (command: SlashCommand) => {
      if (!editor || slashStartPosRef.current === null) return;

      // Remove the slash text
      const { from } = editor.state.selection;
      editor
        .chain()
        .focus()
        .deleteRange({ from: slashStartPosRef.current, to: from })
        .run();

      // Apply command (structural commands execute; AI commands are stubs)
      switch (command.id) {
        case 'h2':
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case 'h3':
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case 'bullet':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'numbered':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'divider':
          editor.chain().focus().setHorizontalRule().run();
          break;
        default:
          // AI commands would trigger generation — stub for now
          break;
      }

      setSlashMenu(null);
      slashStartPosRef.current = null;
    },
    [editor],
  );

  const handleBubbleAction = useCallback(
    (_action: string, _value?: string) => {
      // In production, these trigger AI processing — stub for now
    },
    [],
  );

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const charCount = editor?.storage.characterCount?.characters() ?? 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const publishDisabled = citeMindScore < 70;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full editor-canvas">
      {/* ── Document Toolbar (sticky top) ─────────────── */}
      <div className="sticky top-0 z-20 bg-slate-0/95 backdrop-blur-sm border-b border-slate-4 px-4 py-2.5 flex items-center gap-3">
        {/* Doc rail toggle */}
        <button
          type="button"
          onClick={onToggleDocRail}
          className={`p-1.5 rounded-lg transition-colors ${
            showDocRail
              ? 'bg-white/5 text-white/70'
              : 'text-white/30 hover:text-white/45'
          }`}
          title="Toggle document rail"
        >
          <SidebarSimple size={16} />
        </button>

        {/* Title */}
        <h1 className="text-sm font-semibold text-white truncate flex-1">
          {documentTitle}
        </h1>

        {/* Status indicators */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-white/30" />
            <span className="text-xs text-white/45">{autoSaveStatus}</span>
          </div>
          <span className="text-xs text-white/30">{wordCount} words</span>

          {/* Publish button */}
          <button
            type="button"
            disabled={publishDisabled}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              publishDisabled
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-brand-teal text-slate-0 hover:bg-brand-teal/90 shadow-[0_0_10px_rgba(0,217,255,0.2)]'
            }`}
            title={
              publishDisabled
                ? `CiteMind score must be \u2265 70 (current: ${citeMindScore})`
                : 'Publish'
            }
          >
            Publish
          </button>

          {/* CiteMind rail toggle */}
          <button
            type="button"
            onClick={onToggleCiteMindRail}
            className={`p-1.5 rounded-lg transition-colors ${
              showCiteMindRail
                ? 'bg-white/5 text-white/70'
                : 'text-white/30 hover:text-white/45'
            }`}
            title="Toggle CiteMind rail"
          >
            <SidebarSimple size={16} className="scale-x-[-1]" />
          </button>
        </div>
      </div>

      {/* ── Scrollable content ────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {/* Brief context bar */}
        {showBrief && briefContext && (
          <div className="mx-4 mt-4 bg-brand-iris/5 border border-brand-iris/10 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lightning size={16} className="text-brand-iris" />
                <span className="text-xs font-semibold text-brand-iris uppercase tracking-wider">
                  SAGE Brief
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBrief(false)}
                className="p-0.5 rounded hover:bg-white/5 transition-colors"
              >
                <X size={14} className="text-white/30" />
              </button>
            </div>
            <p className="text-sm text-white/70 mb-2">{briefContext.angle}</p>
            <div className="flex flex-wrap gap-1.5">
              {briefContext.keywords.map((kw) => (
                <span
                  key={kw}
                  className="bg-white/5 text-white/45 text-xs px-2 py-0.5 rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Editor body */}
        <div className="max-w-[780px] mx-auto px-8 py-6">
          {editor && (
            <>
              <EditorContent editor={editor} />
              <BubbleMenu editor={editor}>
                <BubbleToolbar onAction={handleBubbleAction} />
              </BubbleMenu>
            </>
          )}
        </div>
      </div>

      {/* ── Status bar (sticky bottom) ────────────────── */}
      <div className="sticky bottom-0 z-20 bg-slate-0/95 backdrop-blur-sm border-t border-slate-4 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/30">{wordCount} words</span>
          <span className="text-xs text-white/30">{charCount} characters</span>
          <span className="text-xs text-white/30">{readingTime} min read</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FloppyDisk
            size={12}
            className={
              autoSaveStatus === 'Saved' ? 'text-semantic-success' : 'text-white/30'
            }
          />
          <span
            className={`text-xs ${
              autoSaveStatus === 'Saved' ? 'text-semantic-success' : 'text-white/30'
            }`}
          >
            {autoSaveStatus}
          </span>
        </div>
      </div>

      {/* ── Slash command palette (floating) ──────────── */}
      {slashMenu && (
        <SlashCommandPalette
          position={{ top: slashMenu.top, left: slashMenu.left }}
          filter={slashMenu.filter}
          onSelect={handleSlashSelect}
          onClose={() => {
            setSlashMenu(null);
            slashStartPosRef.current = null;
          }}
        />
      )}
    </div>
  );
}
