/**
 * NarrativeSectionCard Component (Sprint S70)
 *
 * Displays a narrative section with content, sources, and edit capabilities
 */

'use client';

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  RefreshCw,
  Link,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import type { UnifiedNarrativeSection } from '@pravado/types';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import NarrativeSectionTypeBadge from './NarrativeSectionTypeBadge';

interface NarrativeSectionCardProps {
  section: UnifiedNarrativeSection;
  onUpdate?: (sectionId: string, content: string) => Promise<void>;
  onRegenerate?: (sectionId: string) => Promise<void>;
  isEditable?: boolean;
  className?: string;
}

export default function NarrativeSectionCard({
  section,
  onUpdate,
  onRegenerate,
  isEditable = false,
  className = '',
}: NarrativeSectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(section.contentMd || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      await onUpdate(section.id, editContent);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditContent(section.contentMd || '');
    setIsEditing(false);
  };

  const handleRegenerate = async () => {
    if (!onRegenerate) return;
    setIsRegenerating(true);
    try {
      await onRegenerate(section.id);
    } finally {
      setIsRegenerating(false);
    }
  };

  const confidenceScore = section.confidenceScore ?? 0;
  const confidenceColor =
    confidenceScore >= 0.8
      ? 'text-green-600'
      : confidenceScore >= 0.5
        ? 'text-yellow-600'
        : 'text-red-600';

  return (
    <Card className={cn('transition-all', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <div>
              <CardTitle className="text-base">{section.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <NarrativeSectionTypeBadge sectionType={section.sectionType} size="sm" />
                <span className="text-xs text-muted-foreground">
                  Order: {section.sortOrder}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Confidence Score */}
            <Badge variant="outline" className={cn('text-xs', confidenceColor)}>
              {Math.round(confidenceScore * 100)}% confidence
            </Badge>

            {/* Edit Mode Toggle */}
            {isEditable && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="h-4 w-4" />
              </Button>
            )}

            {/* Regenerate */}
            {isEditable && onRegenerate && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={isRegenerating}
              >
                <RefreshCw
                  className={cn('h-4 w-4', isRegenerating && 'animate-spin')}
                />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Content */}
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="w-full"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4 mr-1" />
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap text-sm text-gray-700">
                {section.contentMd || section.contentPlain || 'No content yet.'}
              </div>
            </div>
          )}

          {/* Key Points */}
          {section.keyPoints && section.keyPoints.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Key Points
              </h4>
              <ul className="space-y-1">
                {section.keyPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-blue-500 mt-1">*</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Source References */}
          {section.sourceReferences && section.sourceReferences.length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1">
                <Link className="h-3 w-3" />
                Sources ({section.sourceReferences.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {section.sourceReferences.map((ref, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="text-xs"
                  >
                    {ref.title || ref.sourceSystem}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Supporting Data */}
          {section.supportingData && Object.keys(section.supportingData).length > 0 && (
            <div className="border-t pt-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Supporting Data
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(section.supportingData).slice(0, 6).map(([key, value]) => (
                  <div key={key}>
                    <span className="text-muted-foreground">{key}:</span>{' '}
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Low confidence warning */}
          {confidenceScore < 0.5 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-md border border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-700">
                Low confidence section - consider reviewing or regenerating
              </span>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
