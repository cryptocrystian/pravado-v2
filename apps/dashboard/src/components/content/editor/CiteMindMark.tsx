/**
 * CiteMindMark - Tiptap Mark extension stub for CiteMind governance
 *
 * Phase 2 stub: Registers the mark type in the Tiptap schema so that
 * future CiteMind integration can apply inline underlines to flagged
 * claims. No logic attached yet — just schema + CSS class.
 *
 * Usage: Add to TiptapEditor extensions array when CiteMind is enabled.
 *
 * @see /docs/canon/CONTENT_PILLAR_CANON.md (CiteMind governance)
 * @see editor-styles.css (.citemind-flag styles)
 */

import { Mark, mergeAttributes } from '@tiptap/react';

export interface CiteMindMarkOptions {
  /** CSS class applied to flagged spans */
  HTMLAttributes: Record<string, string>;
}

/**
 * Tiptap Mark that wraps flagged text with a wavy underline.
 * Severity is stored as a `data-severity` attribute (warning | error).
 */
export const CiteMindMark = Mark.create<CiteMindMarkOptions>({
  name: 'citemindFlag',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      severity: {
        default: 'warning',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-severity') || 'warning',
        renderHTML: (attributes: Record<string, string>) => ({
          'data-severity': attributes.severity,
        }),
      },
      message: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-message'),
        renderHTML: (attributes: Record<string, string | null>) => {
          if (!attributes.message) return {};
          return { 'data-message': attributes.message };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-citemind]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, string> }) {
    const severity = HTMLAttributes['data-severity'] || 'warning';
    const className = severity === 'error' ? 'citemind-flag citemind-flag-error' : 'citemind-flag';

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-citemind': '',
        class: className,
      }),
      0,
    ];
  },
});
