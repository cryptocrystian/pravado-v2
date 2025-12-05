/**
 * Investor Q&A Card Component (Sprint S64)
 * Displays a single Q&A entry with actions
 */

'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  type InvestorQnA,
  getQnACategoryLabel,
  formatRelativeTime,
} from '@/lib/investorRelationsApi';
import { cn } from '@/lib/utils';
import {
  HelpCircle,
  MessageSquare,
  Edit,
  Save,
  X,
  Trash2,
  CheckCircle,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface InvestorQnACardProps {
  qna: InvestorQnA;
  onUpdate?: (question: string, answer: string) => Promise<void>;
  onApprove?: () => Promise<void>;
  onDelete?: () => Promise<void>;
  className?: string;
}

export function InvestorQnACard({
  qna,
  onUpdate,
  onApprove,
  onDelete,
  className,
}: InvestorQnACardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editQuestion, setEditQuestion] = useState(qna.question);
  const [editAnswer, setEditAnswer] = useState(qna.answerMd);
  const [isSaving, setIsSaving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(editQuestion, editAnswer);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    setEditQuestion(qna.question);
    setEditAnswer(qna.answerMd);
    setIsEditing(false);
  };

  const getStatusColor = () => {
    switch (qna.status) {
      case 'approved':
        return 'bg-green-100 text-green-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getConfidenceColor = () => {
    if (qna.confidence >= 80) return 'text-green-600';
    if (qna.confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={cn(qna.status === 'archived' && 'opacity-50', className)}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Question
              </label>
              <Input
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="Enter the question..."
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">
                Answer
              </label>
              <Textarea
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="Enter the answer in Markdown..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isSaving}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Question */}
            <div className="flex items-start gap-3">
              <HelpCircle className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{qna.question}</p>

                {/* Meta row */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    {getQnACategoryLabel(qna.category)}
                  </Badge>
                  <Badge variant="secondary" className={cn('text-xs', getStatusColor())}>
                    {qna.status}
                  </Badge>
                  {qna.isLlmGenerated && (
                    <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generated
                    </Badge>
                  )}
                  <span className={cn('text-xs font-medium', getConfidenceColor())}>
                    {qna.confidence}% confidence
                  </span>
                </div>
              </div>
            </div>

            {/* Answer */}
            <div className="flex items-start gap-3 mt-4">
              <MessageSquare className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div
                  className={cn(
                    'prose prose-sm max-w-none text-gray-700',
                    !isExpanded && 'line-clamp-3'
                  )}
                >
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {qna.answerMd}
                  </pre>
                </div>
                {qna.answerMd.split('\n').length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 text-indigo-600 -ml-2"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-4 w-4 mr-1" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Show more
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-xs text-gray-400">
                {qna.timesUsed > 0 && `Used ${qna.timesUsed} times | `}
                Created {formatRelativeTime(qna.createdAt)}
              </div>

              <div className="flex items-center gap-2">
                {qna.status === 'draft' && onApprove && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApprove}
                    disabled={isApproving}
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    {isApproving ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-1" />
                    )}
                    Approve
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 text-gray-400" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-400" />
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
