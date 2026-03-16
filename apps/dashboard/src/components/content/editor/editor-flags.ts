/**
 * Editor v2 Feature Flag
 *
 * Gates enhanced editor capabilities behind a single flag.
 * Set NEXT_PUBLIC_ENABLE_EDITOR_V2=false to revert to v1 behavior.
 *
 * Enhancements gated:
 * - Callout block type
 * - Paste sanitization (Google Docs / Notion)
 * - Inline link editing UI (replaces window.prompt)
 * - Enhanced slash menu (Paragraph + Callout blocks)
 * - Block hover affordances
 * - Cmd/Ctrl+K link shortcut
 */
export const EDITOR_V2 = process.env.NEXT_PUBLIC_ENABLE_EDITOR_V2 !== 'false';
