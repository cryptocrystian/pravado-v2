/**
 * TalkingPointCard Component (Sprint S54)
 *
 * Displays a single talking point with category, content, and actions
 */

'use client';

import React, { useState } from 'react';
import { Copy, Check, ThumbsUp, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import type { TalkingPoint } from '@pravado/types';
import {
  getTalkingPointCategoryLabel,
  getTalkingPointCategoryColor,
  getTalkingPointCategoryBgColor,
  getPriorityScoreColor,
} from '@/lib/mediaBriefingApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TalkingPointCardProps {
  talkingPoint: TalkingPoint;
  onApprove?: (id: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCopy?: (content: string) => void;
  className?: string;
}

export default function TalkingPointCard({
  talkingPoint,
  onApprove,
  onDelete,
  onCopy,
  className = '',
}: TalkingPointCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const handleCopy = async () => {
    const content = `${talkingPoint.headline}\n\n${talkingPoint.content}`;
    await navigator.clipboard.writeText(content);
    setIsCopied(true);
    onCopy?.(content);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!onApprove) return;
    setIsApproving(true);
    try {
      await onApprove(talkingPoint.id);
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Card
      className={cn(
        'transition-all',
        talkingPoint.isApproved && 'border-green-200 bg-green-50/30',
        talkingPoint.isArchived && 'opacity-60',
        className
      )}
    >
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            <Badge
              variant="outline"
              className={cn(
                'mb-2 text-xs',
                getTalkingPointCategoryBgColor(talkingPoint.category),
                getTalkingPointCategoryColor(talkingPoint.category)
              )}
            >
              {getTalkingPointCategoryLabel(talkingPoint.category)}
            </Badge>

            {/* Headline */}
            <h3 className="font-semibold text-gray-900 line-clamp-2">{talkingPoint.headline}</h3>
          </div>

          {/* Priority & Approval */}
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {talkingPoint.isApproved && (
              <Badge variant="outline" className="bg-green-100 text-green-700 text-xs">
                <ThumbsUp className="h-3 w-3 mr-1" />
                Approved
              </Badge>
            )}
            <span className={cn('text-xs font-medium', getPriorityScoreColor(talkingPoint.priorityScore))}>
              P{talkingPoint.priorityScore}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        {/* Content Preview */}
        <p className={cn('text-sm text-gray-600', isExpanded ? '' : 'line-clamp-2')}>
          {talkingPoint.content}
        </p>

        {/* Expand Toggle */}
        {talkingPoint.content.length > 150 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-1 h-6 px-2 text-xs text-muted-foreground"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" /> Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" /> Show more
              </>
            )}
          </Button>
        )}

        {/* Supporting Facts */}
        {isExpanded && talkingPoint.supportingFacts && talkingPoint.supportingFacts.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <h4 className="text-xs font-medium text-gray-500 mb-2">Supporting Facts</h4>
            <ul className="space-y-1">
              {talkingPoint.supportingFacts.map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{fact.fact}</span>
                  {fact.verifiable && (
                    <Badge variant="outline" className="text-[10px] ml-auto shrink-0">
                      Verifiable
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Context Notes */}
        {isExpanded && talkingPoint.contextNotes && (
          <div className="mt-3 pt-3 border-t">
            <h4 className="text-xs font-medium text-gray-500 mb-1">Context</h4>
            <p className="text-xs text-gray-600">{talkingPoint.contextNotes}</p>
          </div>
        )}

        {/* Use Case */}
        {isExpanded && talkingPoint.useCase && (
          <div className="mt-2">
            <span className="text-xs text-muted-foreground">Use when: </span>
            <span className="text-xs text-gray-700">{talkingPoint.useCase}</span>
          </div>
        )}

        {/* Target Audience */}
        {isExpanded && talkingPoint.targetAudience && (
          <div className="mt-1">
            <span className="text-xs text-muted-foreground">Audience: </span>
            <span className="text-xs text-gray-700">{talkingPoint.targetAudience}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2">
              {isCopied ? (
                <>
                  <Check className="h-3 w-3 mr-1 text-green-600" />
                  <span className="text-xs">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  <span className="text-xs">Copy</span>
                </>
              )}
            </Button>

            {!talkingPoint.isApproved && onApprove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleApprove}
                disabled={isApproving}
                className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                <span className="text-xs">{isApproving ? 'Approving...' : 'Approve'}</span>
              </Button>
            )}
          </div>

          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(talkingPoint.id)}
              className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Generation Badge */}
        {talkingPoint.isGenerated && (
          <div className="mt-2 text-[10px] text-muted-foreground">
            AI Generated{talkingPoint.llmModel && ` • ${talkingPoint.llmModel}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
