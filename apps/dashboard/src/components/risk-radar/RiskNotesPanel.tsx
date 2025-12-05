/**
 * Risk Notes Panel Component (Sprint S60)
 * Collaboration panel for executive notes
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { RiskRadarNote, RiskRadarNoteType } from '@/lib/riskRadarApi';
import { getNoteTypeLabel, formatRelativeTime } from '@/lib/riskRadarApi';
import {
  Loader2,
  MessageSquare,
  Send,
  Pin,
  Eye,
  User,
  CheckCircle,
  ArrowUp,
  BookOpen,
  Briefcase,
} from 'lucide-react';

interface RiskNotesPanelProps {
  notes: RiskRadarNote[];
  loading?: boolean;
  onAddNote?: (content: string, noteType: RiskRadarNoteType) => Promise<void>;
  className?: string;
}

const noteTypeIcons: Record<RiskRadarNoteType, React.ReactNode> = {
  observation: <Eye className="h-3 w-3" />,
  action_taken: <CheckCircle className="h-3 w-3" />,
  escalation: <ArrowUp className="h-3 w-3" />,
  resolution: <CheckCircle className="h-3 w-3" />,
  context: <BookOpen className="h-3 w-3" />,
  executive_comment: <Briefcase className="h-3 w-3" />,
};

const noteTypeColors: Record<RiskRadarNoteType, string> = {
  observation: 'bg-blue-50 text-blue-700 border-blue-200',
  action_taken: 'bg-green-50 text-green-700 border-green-200',
  escalation: 'bg-red-50 text-red-700 border-red-200',
  resolution: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  context: 'bg-gray-50 text-gray-700 border-gray-200',
  executive_comment: 'bg-purple-50 text-purple-700 border-purple-200',
};

export function RiskNotesPanel({
  notes,
  loading,
  onAddNote,
  className,
}: RiskNotesPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<RiskRadarNoteType>('observation');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newNote.trim() || !onAddNote) return;

    setSubmitting(true);
    try {
      await onAddNote(newNote.trim(), noteType);
      setNewNote('');
    } finally {
      setSubmitting(false);
    }
  };

  const pinnedNotes = notes.filter((n) => n.isPinned);
  const otherNotes = notes.filter((n) => !n.isPinned);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Notes & Collaboration
          <Badge variant="secondary" className="ml-auto">
            {notes.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add Note Form */}
        {onAddNote && (
          <div className="space-y-2 pb-4 border-b">
            <Textarea
              placeholder="Add a note or observation..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              className="min-h-[80px] resize-none"
              disabled={submitting}
            />
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {(['observation', 'action_taken', 'escalation', 'context'] as RiskRadarNoteType[]).map((type) => (
                  <Button
                    key={type}
                    variant={noteType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNoteType(type)}
                    className="text-xs"
                  >
                    {noteTypeIcons[type]}
                    <span className="ml-1 hidden sm:inline">{getNoteTypeLabel(type)}</span>
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newNote.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading notes...</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && notes.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No notes yet. Add the first one above.
          </div>
        )}

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
              <Pin className="h-3 w-3" />
              Pinned
            </div>
            <div className="space-y-2">
              {pinnedNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}

        {/* Other Notes */}
        {otherNotes.length > 0 && (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {pinnedNotes.length > 0 && (
              <div className="text-xs font-medium text-gray-500 uppercase">Recent</div>
            )}
            <div className="space-y-2">
              {otherNotes.map((note) => (
                <NoteCard key={note.id} note={note} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NoteCard({ note }: { note: RiskRadarNote }) {
  return (
    <div
      className={cn(
        'p-3 rounded-lg border',
        note.isPinned ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={cn('text-xs', noteTypeColors[note.noteType])}
          >
            {noteTypeIcons[note.noteType]}
            <span className="ml-1">{getNoteTypeLabel(note.noteType)}</span>
          </Badge>
          {note.isExecutiveVisible && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              <Briefcase className="h-3 w-3 mr-1" />
              Executive
            </Badge>
          )}
          {note.isPinned && (
            <Pin className="h-3 w-3 text-amber-500" />
          )}
        </div>
      </div>

      {note.title && (
        <div className="font-medium text-gray-900 mb-1">{note.title}</div>
      )}

      <div className="text-sm text-gray-700 whitespace-pre-wrap">{note.content}</div>

      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
        <User className="h-3 w-3" />
        <span>{note.createdBy}</span>
        <span className="text-gray-300">|</span>
        <span>{formatRelativeTime(note.createdAt)}</span>
      </div>

      {note.tags && note.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
