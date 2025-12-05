/**
 * BriefingGenerationForm Component (Sprint S54)
 *
 * Form for creating new media briefings with format selection,
 * source linking, and generation configuration options
 */

'use client';

import React, { useState, useCallback } from 'react';
import {
  FileText,
  Users,
  Building2,
  Target,
  Tag,
  X,
  Plus,
  Sparkles,
  Info,
} from 'lucide-react';
import type {
  BriefFormatType,
  CreateBriefingRequest,
} from '@pravado/types';
import { getFormatLabel, getFormatIcon } from '@/lib/mediaBriefingApi';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BriefingGenerationFormProps {
  onSubmit: (data: CreateBriefingRequest) => Promise<void>;
  onCancel?: () => void;
  availableJournalists?: Array<{ id: string; name: string }>;
  availablePersonas?: Array<{ id: string; name: string }>;
  availableCompetitors?: Array<{ id: string; name: string }>;
  availablePressReleases?: Array<{ id: string; title: string }>;
  defaultFormat?: BriefFormatType;
  isSubmitting?: boolean;
  className?: string;
}

const formatOptions: BriefFormatType[] = [
  'full_brief',
  'executive_summary',
  'talking_points_only',
  'media_prep',
  'crisis_brief',
  'interview_prep',
];

const toneOptions = [
  { value: 'professional', label: 'Professional' },
  { value: 'confident', label: 'Confident' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'authoritative', label: 'Authoritative' },
  { value: 'conversational', label: 'Conversational' },
  { value: 'formal', label: 'Formal' },
];

const formatDescriptions: Record<BriefFormatType, string> = {
  full_brief: 'Comprehensive briefing with all sections including background, key messages, Q&A prep, and competitive analysis',
  executive_summary: 'Condensed overview highlighting critical points for quick consumption by leadership',
  talking_points_only: 'Focused set of key talking points and messages without additional context',
  media_prep: 'Interview preparation with anticipated questions, messaging frameworks, and bridge statements',
  crisis_brief: 'Rapid response format with defensive messaging, risk assessment, and mitigation strategies',
  interview_prep: 'Detailed preparation for media appearances with anticipated questions and suggested answers',
};

export default function BriefingGenerationForm({
  onSubmit,
  onCancel,
  availableJournalists = [],
  availablePersonas = [],
  availableCompetitors = [],
  defaultFormat = 'full_brief',
  isSubmitting = false,
  className = '',
}: BriefingGenerationFormProps) {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [format, setFormat] = useState<BriefFormatType>(defaultFormat);
  const [tone, setTone] = useState('professional');
  const [selectedJournalists, setSelectedJournalists] = useState<string[]>([]);
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);
  const [selectedCompetitors, setSelectedCompetitors] = useState<string[]>([]);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [focusAreaInput, setFocusAreaInput] = useState('');
  const [excludedTopics, setExcludedTopics] = useState<string[]>([]);
  const [excludedTopicInput, setExcludedTopicInput] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddFocusArea = useCallback(() => {
    const trimmed = focusAreaInput.trim();
    if (trimmed && !focusAreas.includes(trimmed)) {
      setFocusAreas([...focusAreas, trimmed]);
      setFocusAreaInput('');
    }
  }, [focusAreaInput, focusAreas]);

  const handleRemoveFocusArea = useCallback((area: string) => {
    setFocusAreas(focusAreas.filter((a) => a !== area));
  }, [focusAreas]);

  const handleAddExcludedTopic = useCallback(() => {
    const trimmed = excludedTopicInput.trim();
    if (trimmed && !excludedTopics.includes(trimmed)) {
      setExcludedTopics([...excludedTopics, trimmed]);
      setExcludedTopicInput('');
    }
  }, [excludedTopicInput, excludedTopics]);

  const handleRemoveExcludedTopic = useCallback((topic: string) => {
    setExcludedTopics(excludedTopics.filter((t) => t !== topic));
  }, [excludedTopics]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 200) {
      newErrors.title = 'Title must be 200 characters or less';
    }

    if (subtitle && subtitle.length > 300) {
      newErrors.subtitle = 'Subtitle must be 300 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const data: CreateBriefingRequest = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      format,
      tone,
      journalistIds: selectedJournalists.length > 0 ? selectedJournalists : undefined,
      personaIds: selectedPersonas.length > 0 ? selectedPersonas : undefined,
      competitorIds: selectedCompetitors.length > 0 ? selectedCompetitors : undefined,
      focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
      excludedTopics: excludedTopics.length > 0 ? excludedTopics : undefined,
      customInstructions: customInstructions.trim() || undefined,
    };

    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Basic Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Q4 Product Launch Media Brief"
              className={cn(errors.title && 'border-red-500')}
            />
            {errors.title && <span className="text-xs text-red-500 mt-1">{errors.title}</span>}
          </div>

          <div>
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g., Key messages for TechCrunch interview"
              className={cn(errors.subtitle && 'border-red-500')}
            />
            {errors.subtitle && <span className="text-xs text-red-500 mt-1">{errors.subtitle}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Format Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Briefing Format</CardTitle>
          <CardDescription>Choose the format that best fits your needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {formatOptions.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={cn(
                  'flex flex-col items-start p-3 rounded-lg border text-left transition-all',
                  format === f
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{getFormatIcon(f)}</span>
                  <span className="text-sm font-medium">{getFormatLabel(f)}</span>
                </div>
                <span className="text-[11px] text-muted-foreground line-clamp-2">
                  {formatDescriptions[f]}
                </span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tone & Style */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tone & Style</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {toneOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sources & Context */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" />
            Sources & Context
          </CardTitle>
          <CardDescription>Link relevant sources to enrich the briefing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Journalists */}
          {availableJournalists.length > 0 && (
            <div>
              <Label className="flex items-center gap-2">
                <Users className="h-3 w-3" /> Target Journalists
              </Label>
              <Select
                value=""
                onValueChange={(id) => {
                  if (!selectedJournalists.includes(id)) {
                    setSelectedJournalists([...selectedJournalists, id]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select journalists..." />
                </SelectTrigger>
                <SelectContent>
                  {availableJournalists
                    .filter((j) => !selectedJournalists.includes(j.id))
                    .map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedJournalists.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedJournalists.map((id) => {
                    const journalist = availableJournalists.find((j) => j.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-xs">
                        {journalist?.name || id}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedJournalists(selectedJournalists.filter((j) => j !== id))
                          }
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Personas */}
          {availablePersonas.length > 0 && (
            <div>
              <Label className="flex items-center gap-2">
                <Users className="h-3 w-3" /> Target Personas
              </Label>
              <Select
                value=""
                onValueChange={(id) => {
                  if (!selectedPersonas.includes(id)) {
                    setSelectedPersonas([...selectedPersonas, id]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select personas..." />
                </SelectTrigger>
                <SelectContent>
                  {availablePersonas
                    .filter((p) => !selectedPersonas.includes(p.id))
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedPersonas.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedPersonas.map((id) => {
                    const persona = availablePersonas.find((p) => p.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                        {persona?.name || id}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedPersonas(selectedPersonas.filter((p) => p !== id))
                          }
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Competitors */}
          {availableCompetitors.length > 0 && (
            <div>
              <Label className="flex items-center gap-2">
                <Building2 className="h-3 w-3" /> Competitors to Analyze
              </Label>
              <Select
                value=""
                onValueChange={(id) => {
                  if (!selectedCompetitors.includes(id)) {
                    setSelectedCompetitors([...selectedCompetitors, id]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select competitors..." />
                </SelectTrigger>
                <SelectContent>
                  {availableCompetitors
                    .filter((c) => !selectedCompetitors.includes(c.id))
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedCompetitors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedCompetitors.map((id) => {
                    const competitor = availableCompetitors.find((c) => c.id === id);
                    return (
                      <Badge key={id} variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                        {competitor?.name || id}
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedCompetitors(selectedCompetitors.filter((c) => c !== id))
                          }
                          className="ml-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Focus Areas & Exclusions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Focus Areas & Exclusions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Focus Areas */}
          <div>
            <Label>Focus Areas</Label>
            <div className="flex gap-2">
              <Input
                value={focusAreaInput}
                onChange={(e) => setFocusAreaInput(e.target.value)}
                placeholder="Add a focus area..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddFocusArea();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddFocusArea}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {focusAreas.map((area, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {area}
                    <button type="button" onClick={() => handleRemoveFocusArea(area)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Excluded Topics */}
          <div>
            <Label className="text-red-700">Topics to Avoid</Label>
            <div className="flex gap-2">
              <Input
                value={excludedTopicInput}
                onChange={(e) => setExcludedTopicInput(e.target.value)}
                placeholder="Add a topic to exclude..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExcludedTopic();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddExcludedTopic}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {excludedTopics.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {excludedTopics.map((topic, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs bg-red-50 text-red-700">
                    {topic}
                    <button type="button" onClick={() => handleRemoveExcludedTopic(topic)} className="ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="h-4 w-4" />
            Custom Instructions
          </CardTitle>
          <CardDescription>Add any specific guidance for the AI generation</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="e.g., Emphasize our sustainability initiatives, include specific product differentiators..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? (
            <>Creating...</>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Create Briefing
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
