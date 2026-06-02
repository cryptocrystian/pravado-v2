/**
 * Content Editor — /app/content/[documentId]
 *
 * Phase 0 Track 0B: REAL BUG FIX (not a gate).
 *
 * The page used to ignore the `documentId` route param entirely and render
 * `mockDocuments[0]` regardless of which ID was visited (audit finding §6).
 * No `fetchDocument` helper exists yet, so per spec the honest Phase 0
 * behavior is to `notFound()` until Phase 1 wires real document loading.
 *
 * The CONTENT_EDITOR_WIRED flag stays in the gate position so when Phase 1
 * lands the editor, it can flip the flag rather than re-architect this file.
 *
 * Spec: docs/sprints/PHASE-0-FIRE-BREAK/TRACK-0B-MOCK-CONTAINMENT.md §4
 */

import { isEnabled } from '@pravado/feature-flags';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { documentId: string };
}

export default function ContentEditorPage(_props: PageProps) {
  // Phase 0: flag is always false → notFound. Phase 1 flips the flag and
  // implements the real document fetch + editor render below.
  if (!isEnabled('CONTENT_EDITOR_WIRED')) {
    notFound();
  }
  // Phase 1: const document = await fetchDocument(_props.params.documentId);
  // Phase 1: if (!document) notFound();
  // Phase 1: return <ContentEditor document={document} />;
  notFound();
}
