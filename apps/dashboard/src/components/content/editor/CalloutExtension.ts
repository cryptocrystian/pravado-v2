/**
 * CalloutExtension - Visual callout/notice block for Tiptap
 *
 * A block-level wrapper that highlights content in a styled container.
 * No logic, no AI - just a visual affordance for tips, notes, and warnings.
 *
 * Gated behind EDITOR_V2 flag.
 *
 * @see editor-styles.css (.callout-block styles)
 */

import { Node, mergeAttributes } from '@tiptap/react';

export interface CalloutExtensionOptions {
  HTMLAttributes: Record<string, string>;
}

export const CalloutExtension = Node.create<CalloutExtensionOptions>({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-callout': '',
        class: 'callout-block',
      }),
      0,
    ];
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      setCallout:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.wrapIn(this.name);
        },
      toggleCallout:
        () =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ({ commands }: any) => {
          return commands.toggleWrap(this.name);
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      'Mod-Shift-c': () => (this.editor.commands as any).toggleCallout(),
    };
  },
});
