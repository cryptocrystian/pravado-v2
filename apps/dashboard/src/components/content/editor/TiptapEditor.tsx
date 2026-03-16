'use client';

/**
 * TiptapEditor - Block-based document editor
 *
 * Core writing surface for the Content Hub. Built on Tiptap (ProseMirror).
 *
 * Features:
 * - Block-based document model (headings, paragraphs, lists, quotes)
 * - Persistent formatting toolbar (FormatToolbar)
 * - Floating toolbar on text selection (BubbleMenu)
 * - Slash command menu with categories and descriptions
 * - Block insert handle ("+" button on empty paragraphs)
 * - CiteMind mark registration
 * - Auto-save with visible state indicator
 * - Heading extraction for outline navigation
 */

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { FormatToolbar } from './FormatToolbar';
import { BlockInsertHandle } from './BlockInsertHandle';
import { CiteMindMark } from './CiteMindMark';
import { CalloutExtension } from './CalloutExtension';
import { EDITOR_V2 } from './editor-flags';

// ============================================
// TYPES
// ============================================

export interface HeadingNode {
  id: string;
  level: number;
  text: string;
  pos: number;
}

export interface TiptapEditorProps {
  /** Initial HTML content */
  content?: string;
  /** Called when content changes (debounced for auto-save) */
  onUpdate?: (html: string) => void;
  /** Called when heading structure changes */
  onHeadingsChange?: (headings: HeadingNode[]) => void;
  /** Called when cursor position changes (for active heading tracking) */
  onSelectionChange?: (pos: number) => void;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Whether editor is read-only */
  editable?: boolean;
  /** Auto-save delay in ms (0 = disabled) */
  autoSaveDelay?: number;
  /** Called when auto-save triggers */
  onAutoSave?: (html: string) => void;
  /** Show the persistent formatting toolbar (default: true) */
  showToolbar?: boolean;
  /** Called when save state changes */
  onSaveStateChange?: (state: SaveState) => void;
  /** Additional class names for the editor wrapper */
  className?: string;
  /** Called with word count on each update */
  onWordCountChange?: (count: number) => void;
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export interface TiptapEditorHandle {
  getHTML: () => string;
  getEditor: () => Editor | null;
  scrollToPos: (pos: number) => void;
}

// ============================================
// SLASH COMMAND ITEMS (with categories)
// ============================================

interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  category: string;
  command: (editor: Editor) => void;
}

// ============================================
// PASTE SANITIZATION (Editor v2)
// ============================================

function sanitizePastedHTML(html: string): string {
  if (typeof document === 'undefined') return html;

  const container = document.createElement('div');
  container.innerHTML = html;

  // Unwrap Google Docs internal wrappers (preserve children)
  container.querySelectorAll('[id^="docs-internal-guid"]').forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
  });

  // Remove all inline styles
  container.querySelectorAll('[style]').forEach((el) => el.removeAttribute('style'));

  // Remove all class attributes
  container.querySelectorAll('[class]').forEach((el) => el.removeAttribute('class'));

  // Remove MS Office and Google Sheets elements
  container.querySelectorAll('o\\:p, google-sheets-html-origin').forEach((el) => el.remove());

  // Unwrap empty/styling-only spans (preserve text)
  container.querySelectorAll('span').forEach((el) => {
    if (el.attributes.length === 0) {
      const parent = el.parentNode;
      if (parent) {
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      }
    }
  });

  // Unwrap font tags (preserve text)
  container.querySelectorAll('font').forEach((el) => {
    const parent = el.parentNode;
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      parent.removeChild(el);
    }
  });

  return container.innerHTML;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  // Text (Editor v2)
  ...(EDITOR_V2
    ? [
        {
          title: 'Paragraph',
          description: 'Plain text block',
          icon: 'P',
          category: 'Text',
          command: (editor: Editor) => {
            editor.chain().focus().setParagraph().run();
          },
        },
      ]
    : []),
  // Structure
  {
    title: 'Heading 1',
    description: 'Top-level section heading',
    icon: 'H1',
    category: 'Structure',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Sub-section heading',
    icon: 'H2',
    category: 'Structure',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Minor section heading',
    icon: 'H3',
    category: 'Structure',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  // Lists
  {
    title: 'Bullet List',
    description: 'Create an unordered list',
    icon: '\u2022\u2022',
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create an ordered list',
    icon: '1.',
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  // Media
  {
    title: 'Quote',
    description: 'Add a blockquote for emphasis',
    icon: '\u201C ',
    category: 'Media',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Monospace code snippet',
    icon: '<>',
    category: 'Media',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  // Divider
  {
    title: 'Divider',
    description: 'Visual separator between sections',
    icon: '\u2014',
    category: 'Divider',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  // Callout (Editor v2)
  ...(EDITOR_V2
    ? [
        {
          title: 'Callout',
          description: 'Highlighted notice or tip',
          icon: '!',
          category: 'Blocks',
          command: (editor: Editor) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (editor.chain().focus() as any).toggleCallout().run();
          },
        },
      ]
    : []),
];

// ============================================
// SLASH COMMAND MENU (enhanced)
// ============================================

interface SlashMenuProps {
  editor: Editor;
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  filter: string;
}

function SlashMenu({ editor, isOpen, onClose, position, filter }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = SLASH_COMMANDS.filter(
    (item) =>
      item.title.toLowerCase().includes(filter.toLowerCase()) ||
      item.description.toLowerCase().includes(filter.toLowerCase())
  );

  // Group by category
  const grouped: { category: string; items: SlashCommandItem[] }[] = [];
  for (const item of filteredItems) {
    const existing = grouped.find((g) => g.category === item.category);
    if (existing) {
      existing.items.push(item);
    } else {
      grouped.push({ category: item.category, items: [item] });
    }
  }

  // Flat list for keyboard nav
  const flatItems = grouped.flatMap((g) => g.items);

  // Reset selection when filter changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, flatItems.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (flatItems[selectedIndex]) {
          selectItem(flatItems[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, flatItems]);

  const selectItem = (item: SlashCommandItem) => {
    const { state } = editor;
    const { from } = state.selection;

    // Find the slash character position
    const textBefore = state.doc.textBetween(
      Math.max(0, from - 20),
      from,
      '\n'
    );
    const slashIndex = textBefore.lastIndexOf('/');
    if (slashIndex !== -1) {
      const deleteFrom = from - (textBefore.length - slashIndex);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }

    item.command(editor);
    onClose();
  };

  if (!isOpen || flatItems.length === 0) return null;

  let flatIdx = 0;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-80 bg-slate-2 border border-slate-4 rounded-lg shadow-xl py-1 max-h-80 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      {grouped.map((group) => (
        <div key={group.category}>
          <div className="px-3 py-1.5 border-b border-slate-4">
            <span className="text-xs font-bold uppercase tracking-wider text-white/40">
              {group.category}
            </span>
          </div>
          {group.items.map((item) => {
            const idx = flatIdx++;
            return (
              <button
                key={item.title}
                type="button"
                onClick={() => selectItem(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                  idx === selectedIndex ? 'bg-brand-iris/10' : 'hover:bg-white/5'
                }`}
              >
                <span className="w-10 h-10 flex items-center justify-center text-xs font-mono font-bold text-white/50 bg-slate-3 rounded-lg shrink-0">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white/95">{item.title}</div>
                  <div className="text-xs text-white/40 leading-snug">{item.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ============================================
// BUBBLE TOOLBAR
// ============================================

interface BubbleToolbarProps {
  editor: Editor;
}

function BubbleToolbar({ editor }: BubbleToolbarProps) {
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
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: linkUrl })
        .run();
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
            if (e.key === 'Enter') {
              e.preventDefault();
              applyLink();
            }
            if (e.key === 'Escape') {
              setShowLinkInput(false);
              setLinkUrl('');
            }
          }}
          placeholder="Paste URL..."
          className="w-48 px-2 py-1 text-sm bg-slate-3 border border-slate-4 rounded text-white placeholder:text-white/30 focus:outline-none focus:border-brand-iris/40"
        />
        <button
          type="button"
          onClick={applyLink}
          className="px-2 py-1 text-xs font-medium text-white bg-brand-iris rounded hover:bg-brand-iris/90 transition-colors"
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => {
            setShowLinkInput(false);
            setLinkUrl('');
          }}
          className="p-1 text-white/40 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5 px-1.5 py-1 bg-slate-2 border border-slate-4 rounded-lg shadow-xl">
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

      <span className="w-px h-5 bg-white/10 mx-1" />

      <button
        type="button"
        onClick={toggleLink}
        className={btnClass(editor.isActive('link'))}
        title="Link (Cmd+K)"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      </button>
    </div>
  );
}

// ============================================
// EXTRACT HEADINGS UTILITY
// ============================================

function extractHeadings(editor: Editor): HeadingNode[] {
  const headings: HeadingNode[] = [];
  const { doc } = editor.state;

  doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      headings.push({
        id: `heading-${pos}`,
        level: node.attrs.level as number,
        text: node.textContent,
        pos,
      });
    }
  });

  return headings;
}

// ============================================
// MAIN EDITOR COMPONENT
// ============================================

export const TiptapEditor = forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor(
    {
      content = '',
      onUpdate,
      onHeadingsChange,
      onSelectionChange,
      placeholder = 'Start writing, or type / for commands...',
      editable = true,
      autoSaveDelay = 2000,
      onAutoSave,
      showToolbar = true,
      onSaveStateChange,
      className = '',
      onWordCountChange,
    },
    ref
  ) {
    const [saveState, setSaveStateInternal] = useState<SaveState>('idle');
    const setSaveState = (state: SaveState) => {
      setSaveStateInternal(state);
      onSaveStateChange?.(state);
    };
    const [linkEditRequested, setLinkEditRequested] = useState(false);
    const [wordCount, setWordCount] = useState(0);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [slashMenu, setSlashMenu] = useState<{
      isOpen: boolean;
      position: { top: number; left: number };
      filter: string;
    }>({ isOpen: false, position: { top: 0, left: 0 }, filter: '' });

    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
    const savedIndicatorTimerRef = useRef<NodeJS.Timeout | null>(null);
    const lastHeadingsRef = useRef<string>('');

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3],
          },
        }),
        Placeholder.configure({
          placeholder: ({ node }) => {
            if (node.type.name === 'heading') {
              const level = node.attrs.level as number;
              return `Heading ${level}`;
            }
            return placeholder;
          },
          includeChildren: true,
          emptyEditorClass: 'is-editor-empty',
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: 'text-brand-iris underline decoration-brand-iris/40 hover:decoration-brand-iris cursor-pointer',
          },
        }),
        Underline,
        CiteMindMark,
        ...(EDITOR_V2 ? [CalloutExtension] : []),
      ],
      content,
      editable,
      editorProps: {
        attributes: {
          class: `prose-editor${EDITOR_V2 ? ' prose-editor-v2' : ''} focus:outline-none min-h-full`,
        },
        ...(EDITOR_V2 ? { transformPastedHTML: sanitizePastedHTML } : {}),
        handleKeyDown: (_view, event) => {
          if (event.key === '/' && !slashMenu.isOpen) {
            return false;
          }
          // Cmd/Ctrl+K for link editing (Editor v2)
          if (EDITOR_V2 && (event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            setLinkEditRequested(true);
            return true;
          }
          return false;
        },
      },
      onSelectionUpdate: ({ editor: ed }) => {
        const { from } = ed.state.selection;
        onSelectionChange?.(from);
      },
      onUpdate: ({ editor: ed }) => {
        const html = ed.getHTML();
        onUpdate?.(html);

        // Dismiss onboarding hints after first real edit
        if (!hasInteracted) setHasInteracted(true);

        // Live word count
        const text = ed.getText();
        const wc = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
        setWordCount(wc);
        onWordCountChange?.(wc);

        // Check for slash command trigger
        const { state } = ed;
        const { from } = state.selection;
        const textBefore = state.doc.textBetween(
          Math.max(0, from - 20),
          from,
          '\n'
        );

        const slashMatch = textBefore.match(/\/([a-zA-Z0-9]*)$/);
        if (slashMatch) {
          const coords = ed.view.coordsAtPos(from);
          setSlashMenu({
            isOpen: true,
            position: { top: coords.bottom + 4, left: coords.left },
            filter: slashMatch[1],
          });
        } else if (slashMenu.isOpen) {
          setSlashMenu((prev) => ({ ...prev, isOpen: false, filter: '' }));
        }

        // Extract headings
        const headings = extractHeadings(ed);
        const headingsKey = JSON.stringify(headings);
        if (headingsKey !== lastHeadingsRef.current) {
          lastHeadingsRef.current = headingsKey;
          onHeadingsChange?.(headings);
        }

        // Auto-save
        if (autoSaveDelay > 0 && onAutoSave) {
          setSaveState('saving');

          if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
          }
          if (savedIndicatorTimerRef.current) {
            clearTimeout(savedIndicatorTimerRef.current);
          }

          autoSaveTimerRef.current = setTimeout(() => {
            onAutoSave(html);
            setSaveState('saved');

            savedIndicatorTimerRef.current = setTimeout(() => {
              setSaveState('idle');
            }, 2000);
          }, autoSaveDelay);
        }
      },
    });

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      getHTML: () => editor?.getHTML() || '',
      getEditor: () => editor,
      scrollToPos: (pos: number) => {
        if (!editor) return;
        const domAtPos = editor.view.domAtPos(pos);
        const node = domAtPos.node instanceof HTMLElement
          ? domAtPos.node
          : domAtPos.node.parentElement;
        node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    }));

    // Close slash menu on click outside
    useEffect(() => {
      if (!slashMenu.isOpen) return;
      const handler = () => setSlashMenu((prev) => ({ ...prev, isOpen: false }));
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }, [slashMenu.isOpen]);

    // Cleanup timers
    useEffect(() => {
      return () => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
        if (savedIndicatorTimerRef.current) clearTimeout(savedIndicatorTimerRef.current);
      };
    }, []);

    // Initial heading extraction
    useEffect(() => {
      if (editor && content) {
        const headings = extractHeadings(editor);
        onHeadingsChange?.(headings);
      }
    }, [editor, content]);

    // Open slash menu handler for BlockInsertHandle
    const handleOpenSlashMenu = (position: { top: number; left: number }) => {
      setSlashMenu({ isOpen: true, position, filter: '' });
    };

    if (!editor) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-brand-iris/30 border-t-brand-iris rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Persistent formatting toolbar */}
        {showToolbar && (
          <FormatToolbar
            editor={editor}
            saveState={saveState}
            linkEditRequested={linkEditRequested}
            onLinkEditDone={() => setLinkEditRequested(false)}
          />
        )}

        {/* Editor content area — fills remaining space, no floating card */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-[720px] mx-auto px-8 py-2 relative group/editor min-h-full">
            {/* Onboarding hints — fade after first interaction */}
            {!hasInteracted && (
              <div className="flex items-center gap-4 mb-3 px-1 py-2 animate-in fade-in duration-500">
                <span className="flex items-center gap-1.5 text-xs text-white/20">
                  <kbd className="px-1.5 py-0.5 bg-white/[0.04] border border-white/[0.06] rounded text-xs font-mono text-white/30">/</kbd>
                  <span>for blocks</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs text-white/20">
                  <svg className="w-3 h-3 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  <span>Select text to format</span>
                </span>
              </div>
            )}

            {/* Bubble menu (floating toolbar on selection) */}
            <BubbleMenu editor={editor}>
              <BubbleToolbar editor={editor} />
            </BubbleMenu>

            {/* Block insert handle */}
            <div className="relative">
              <BlockInsertHandle
                editor={editor}
                onOpenSlashMenu={handleOpenSlashMenu}
              />
              {/* Editor */}
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Status bar - bottom, informative */}
        <div className="flex items-center justify-between px-6 py-1.5 border-t border-white/[0.04] shrink-0 text-xs text-white/25">
          <div className="flex items-center gap-3">
            <span>{wordCount.toLocaleString()} words</span>
            <span className="w-px h-3 bg-white/[0.06]" />
            <span>{Math.max(1, Math.ceil(wordCount / 238))} min read</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:flex items-center gap-1.5 text-white/15">
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-xs font-mono">⌘B</kbd>
              <span>bold</span>
              <span className="mx-0.5">·</span>
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-xs font-mono">⌘K</kbd>
              <span>link</span>
              <span className="mx-0.5">·</span>
              <kbd className="px-1 py-0.5 bg-white/5 rounded text-xs font-mono">/</kbd>
              <span>blocks</span>
            </span>
          </div>
        </div>

        {/* Slash command menu */}
        {editor && (
          <SlashMenu
            editor={editor}
            isOpen={slashMenu.isOpen}
            onClose={() => setSlashMenu((prev) => ({ ...prev, isOpen: false }))}
            position={slashMenu.position}
            filter={slashMenu.filter}
          />
        )}
      </div>
    );
  }
);

