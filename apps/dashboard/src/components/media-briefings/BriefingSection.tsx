/**
 * BriefingSection Component (Sprint S54)
 *
 * Renders a single section in a media briefing with content and actions
 */

'use client';

import React, { useState } from 'react';
import { RefreshCw, Copy, Check, ChevronDown, ChevronUp, Edit2, Sparkles } from 'lucide-react';
import type { BriefingSection as BriefingSectionType } from '@pravado/types';
import {
  getSectionTypeLabel,
  getSectionTypeIcon,
  formatTokens,
  formatDuration,
} from '@/lib/mediaBriefingApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface BriefingSectionProps {
  section: BriefingSectionType;
  onRegenerate?: (sectionId: string, customInstructions?: string) => Promise<void>;
  onUpdate?: (sectionId: string, content: string) => Promise<void>;
  isRegenerating?: boolean;
  className?: string;
}

export default function BriefingSection({
  section,
  onRegenerate,
  onUpdate,
  isRegenerating = false,
  className = '',
}: BriefingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.content || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = async () => {
    if (!section.content) return;
    await navigator.clipboard.writeText(section.content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegenerate = async () => {
    if (onRegenerate) {
      await onRegenerate(section.id);
    }
  };

  const handleSave = async () => {
    if (!onUpdate || editContent === section.content) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onUpdate(section.id, editContent);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(section.content || '');
    setIsEditing(false);
  };

  return (
    <Card className={cn('transition-all', isRegenerating && 'opacity-70', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{getSectionTypeIcon(section.sectionType)}</span>
            <CardTitle className="text-base">
              {section.title || getSectionTypeLabel(section.sectionType)}
            </CardTitle>
            {section.isGenerated && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                <Sparkles className="h-3 w-3 mr-1" />
                AI Generated
              </Badge>
            )}
            {section.isManuallyEdited && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700">
                <Edit2 className="h-3 w-3 mr-1" />
                Edited
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              disabled={!section.content || isRegenerating}
              className="h-8 w-8 p-0"
            >
              {isCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>

            {onRegenerate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className={cn('h-4 w-4', isRegenerating && 'animate-spin')} />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Metadata row */}
        {section.isGenerated && (section.llmModel || section.tokensUsed) && (
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {section.llmModel && <span>Model: {section.llmModel}</span>}
            {section.tokensUsed && <span>Tokens: {formatTokens(section.tokensUsed)}</span>}
            {section.generationDurationMs && (
              <span>Duration: {formatDuration(section.generationDurationMs)}</span>
            )}
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-2">
          {isRegenerating ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-muted-foreground">Regenerating section...</span>
            </div>
          ) : isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                className="w-full font-mono text-sm"
                placeholder="Enter section content..."
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Main Content */}
              {section.content ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded -m-2"
                  onClick={() => onUpdate && setIsEditing(true)}
                >
                  {section.content.split('\n').map((paragraph, idx) => (
                    <p key={idx} className="mb-2 last:mb-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  No content generated yet.
                  {onRegenerate && (
                    <Button variant="link" onClick={handleRegenerate} className="ml-1">
                      Generate now
                    </Button>
                  )}
                </div>
              )}

              {/* Bullet Points */}
              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points</h4>
                  <ul className="space-y-1">
                    {section.bulletPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{point.text}</span>
                        {point.importance === 'high' && (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-600 ml-auto">
                            High
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Source Summary */}
              {section.sourceSummary && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Sources</h4>
                  <p className="text-xs text-muted-foreground">{section.sourceSummary}</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
