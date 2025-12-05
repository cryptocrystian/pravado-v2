/**
 * NarrativeGeneratorForm Component (Sprint S70)
 *
 * Form for creating and generating unified narratives
 */

'use client';

import React, { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import type { NarrativeType, NarrativeSourceSystem, NarrativeFormatType } from '@pravado/types';
import {
  NARRATIVE_TYPE_LABELS,
  NARRATIVE_SOURCE_SYSTEM_LABELS,
  NARRATIVE_FORMAT_LABELS,
} from '@pravado/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface NarrativeGeneratorFormProps {
  onSubmit: (data: NarrativeFormData) => Promise<void>;
  isSubmitting?: boolean;
  className?: string;
}

export interface NarrativeFormData {
  title: string;
  subtitle?: string;
  narrativeType: NarrativeType;
  format: NarrativeFormatType;
  periodStart: string;
  periodEnd: string;
  sourceSystems: NarrativeSourceSystem[];
  tags?: string[];
  targetAudience?: string;
  generateImmediately: boolean;
}

const ALL_SYSTEMS: NarrativeSourceSystem[] = [
  'media_briefing',
  'crisis_engine',
  'brand_reputation',
  'brand_alerts',
  'governance',
  'risk_radar',
  'exec_command_center',
  'exec_digest',
  'board_reports',
  'investor_relations',
  'strategic_intelligence',
  'unified_graph',
  'scenario_playbooks',
  'media_monitoring',
  'media_performance',
  'journalist_graph',
  'audience_personas',
  'competitive_intel',
  'content_quality',
  'pr_outreach',
];

export default function NarrativeGeneratorForm({
  onSubmit,
  isSubmitting = false,
  className = '',
}: NarrativeGeneratorFormProps) {
  const [formData, setFormData] = useState<NarrativeFormData>({
    title: '',
    subtitle: '',
    narrativeType: 'executive',
    format: 'executive_brief',
    periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    periodEnd: new Date().toISOString().split('T')[0],
    sourceSystems: ['media_monitoring', 'brand_reputation', 'competitive_intel'],
    tags: [],
    targetAudience: '',
    generateImmediately: true,
  });

  const [tagInput, setTagInput] = useState('');

  const handleSystemToggle = (system: NarrativeSourceSystem) => {
    setFormData((prev) => ({
      ...prev,
      sourceSystems: prev.sourceSystems.includes(system)
        ? prev.sourceSystems.filter((s) => s !== system)
        : [...prev.sourceSystems, system],
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((t) => t !== tag),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          Create Unified Narrative
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Q4 2024 Executive Summary"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                }
                placeholder="Strategic Communications Review"
              />
            </div>
          </div>

          {/* Type, Format & Period */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Narrative Type *</Label>
              <Select
                value={formData.narrativeType}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    narrativeType: value as NarrativeType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NARRATIVE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Format</Label>
              <Select
                value={formData.format}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    format: value as NarrativeFormatType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(NARRATIVE_FORMAT_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodStart">Period Start *</Label>
              <Input
                id="periodStart"
                type="date"
                value={formData.periodStart}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    periodStart: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodEnd">Period End *</Label>
              <Input
                id="periodEnd"
                type="date"
                value={formData.periodEnd}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, periodEnd: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Input
              id="targetAudience"
              value={formData.targetAudience || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, targetAudience: e.target.value }))
              }
              placeholder="e.g., Board of Directors, Investors, Executive Team"
            />
          </div>

          {/* Source Systems */}
          <div className="space-y-2">
            <Label>Source Systems</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select which intelligence systems to pull data from
            </p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border rounded-md">
              {ALL_SYSTEMS.map((system) => (
                <Badge
                  key={system}
                  variant={
                    formData.sourceSystems.includes(system) ? 'default' : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => handleSystemToggle(system)}
                >
                  {NARRATIVE_SOURCE_SYSTEM_LABELS[system]}
                </Badge>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Add a tag"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddTag}>
                Add
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag} x
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Generate Immediately Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="generateImmediately"
              checked={formData.generateImmediately}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  generateImmediately: e.target.checked,
                }))
              }
              className="rounded"
            />
            <Label htmlFor="generateImmediately" className="text-sm">
              Generate narrative content immediately after creation
            </Label>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create Narrative
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
