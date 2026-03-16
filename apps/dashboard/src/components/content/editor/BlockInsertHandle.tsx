'use client';

/**
 * BlockInsertHandle - Gutter "+" button on empty paragraphs
 *
 * Like Notion's block handle: appears in the left gutter when the cursor
 * is on an empty paragraph. Clicking opens the slash menu at that position.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Editor } from '@tiptap/react';

export interface BlockInsertHandleProps {
  editor: Editor;
  onOpenSlashMenu: (position: { top: number; left: number }) => void;
}

export function BlockInsertHandle({ editor, onOpenSlashMenu }: BlockInsertHandleProps) {
  const [handlePos, setHandlePos] = useState<{ top: number; left: number } | null>(null);

  const updatePosition = useCallback(() => {
    if (!editor || editor.isDestroyed) {
      setHandlePos(null);
      return;
    }

    const { state } = editor;
    const { $from } = state.selection;
    const currentNode = $from.parent;

    // Only show on empty paragraphs
    if (
      currentNode.type.name === 'paragraph' &&
      currentNode.content.size === 0
    ) {
      try {
        const pos = $from.before($from.depth);
        const coords = editor.view.coordsAtPos(pos);
        const editorRect = editor.view.dom.getBoundingClientRect();

        setHandlePos({
          top: coords.top - editorRect.top,
          left: -32,
        });
      } catch {
        setHandlePos(null);
      }
    } else {
      setHandlePos(null);
    }
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', updatePosition);
    editor.on('update', updatePosition);

    return () => {
      editor.off('selectionUpdate', updatePosition);
      editor.off('update', updatePosition);
    };
  }, [editor, updatePosition]);

  if (!handlePos) return null;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        // Insert a slash to trigger the slash menu
        editor.chain().focus().insertContent('/').run();
        // Compute position for the menu
        const { state } = editor;
        const { from } = state.selection;
        const coords = editor.view.coordsAtPos(from);
        onOpenSlashMenu({ top: coords.bottom + 4, left: coords.left });
      }}
      className="absolute w-6 h-6 rounded-full border border-white/10 bg-slate-2 flex items-center justify-center text-white/30 hover:text-white/60 hover:border-white/20 hover:bg-slate-3 transition-all opacity-0 hover:opacity-100 focus:opacity-100 group-hover/editor:opacity-60"
      style={{
        top: handlePos.top,
        left: handlePos.left,
      }}
      title="Add a block"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    </button>
  );
}
