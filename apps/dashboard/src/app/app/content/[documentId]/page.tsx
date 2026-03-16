'use client';

/**
 * Content Editor — /app/content/[documentId]
 *
 * Three-panel editing surface:
 *   Document Rail (220px) | Editor Canvas (flex) | CiteMind Rail (300px)
 * Both rails independently collapsible.
 */

import { useState } from 'react';
import { EditorCanvas } from '@/components/editor/EditorCanvas';
import { DocumentRail } from '@/components/editor/DocumentRail';
import { CiteMindRail } from '@/components/editor/CiteMindRail';
import {
  mockDocuments,
  mockBriefContext,
  mockAeoScore,
  mockEntities,
  mockCitationSignals,
  mockDerivatives,
  mockCrossPillarHooks,
  mockEditorContent,
} from '@/components/editor/editor-mock-data';

interface PageProps {
  params: { documentId: string };
}

export default function ContentEditorPage({ params }: PageProps) {
  const { documentId } = params;
  const [showDocRail, setShowDocRail] = useState(true);
  const [showCiteMindRail, setShowCiteMindRail] = useState(true);
  const [currentDocId, setCurrentDocId] = useState(documentId);

  const currentDoc =
    mockDocuments.find((d) => d.id === currentDocId) ?? mockDocuments[0];

  return (
    <div className="flex h-screen bg-slate-0 overflow-hidden">
      {/* Document Rail */}
      {showDocRail && (
        <DocumentRail
          documents={mockDocuments}
          currentId={currentDocId}
          onSelect={setCurrentDocId}
        />
      )}

      {/* Editor Canvas */}
      <EditorCanvas
        documentTitle={currentDoc.title}
        initialContent={mockEditorContent}
        briefContext={mockBriefContext}
        citeMindScore={mockAeoScore.overall}
        showDocRail={showDocRail}
        showCiteMindRail={showCiteMindRail}
        onToggleDocRail={() => setShowDocRail(!showDocRail)}
        onToggleCiteMindRail={() => setShowCiteMindRail(!showCiteMindRail)}
      />

      {/* CiteMind Rail */}
      {showCiteMindRail && (
        <CiteMindRail
          aeoScore={mockAeoScore}
          entities={mockEntities}
          citationSignals={mockCitationSignals}
          derivatives={mockDerivatives}
          crossPillarHooks={mockCrossPillarHooks}
        />
      )}
    </div>
  );
}
