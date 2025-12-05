/**
 * PersonaGeneratorForm Component (Sprint S51.2)
 * Form for generating personas using LLM from source text
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import type { GenerationContext, PersonaSourceType, PersonaType } from '@pravado/types';
import { cn } from '@/lib/utils';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';

interface PersonaGeneratorFormProps {
  onGenerate: (context: GenerationContext) => Promise<void>;
  isGenerating?: boolean;
}

export function PersonaGeneratorForm({
  onGenerate,
  isGenerating = false,
}: PersonaGeneratorFormProps) {
  const [sourceType, setSourceType] = useState<PersonaSourceType>('manual');
  const [sourceText, setSourceText] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [personaType, setPersonaType] = useState<PersonaType>('primary_audience');
  const [suggestedName, setSuggestedName] = useState('');
  const [extractTraits, setExtractTraits] = useState(true);
  const [extractInsights, setExtractInsights] = useState(true);
  const [llmModel, setLlmModel] = useState<string>('gpt-4');
  const [temperature, setTemperature] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!sourceText.trim()) {
      setError('Source text is required');
      return;
    }

    if (sourceText.length < 10) {
      setError('Source text must be at least 10 characters');
      return;
    }

    if (sourceText.length > 100000) {
      setError('Source text must be less than 100,000 characters');
      return;
    }

    const context: GenerationContext = {
      sourceType,
      sourceText: sourceText.trim(),
      additionalContext: additionalContext.trim() || undefined,
      personaType,
      suggestedName: suggestedName.trim() || undefined,
      extractTraits,
      extractInsights,
      llmModel,
      temperature,
    };

    try {
      await onGenerate(context);
    } catch (err: any) {
      setError(err.message || 'Failed to generate persona');
    }
  };

  const handleReset = () => {
    setSourceText('');
    setAdditionalContext('');
    setSuggestedName('');
    setError(null);
  };

  const sourceTypeOptions: { value: PersonaSourceType; label: string }[] = [
    { value: 'manual', label: 'Manual Input' },
    { value: 'press_release', label: 'Press Release' },
    { value: 'pitch', label: 'PR Pitch' },
    { value: 'media_mention', label: 'Media Coverage' },
    { value: 'journalist_interaction', label: 'Journalist Profile' },
    { value: 'content', label: 'Content Piece' },
  ];

  const personaTypeOptions: { value: PersonaType; label: string }[] = [
    { value: 'primary_audience', label: 'Primary Audience' },
    { value: 'secondary_audience', label: 'Secondary Audience' },
    { value: 'stakeholder', label: 'Stakeholder' },
    { value: 'influencer', label: 'Influencer' },
  ];

  const llmModelOptions = [
    { value: 'gpt-4', label: 'GPT-4 (Best Quality)' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Faster)' },
    { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet-20240229', label: 'Claude 3 Sonnet' },
  ];

  const charCount = sourceText.length;
  const charLimit = 100000;
  const charPercentage = (charCount / charLimit) * 100;

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-lg">Generate Persona with AI</h3>
          </div>
          <p className="text-sm text-gray-600">
            Provide source text and let AI extract persona attributes, traits, and insights
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Source Type */}
          <div className="space-y-2">
            <Label htmlFor="sourceType">Source Type</Label>
            <Select
              value={sourceType}
              onValueChange={(v) => setSourceType(v as PersonaSourceType)}
              disabled={isGenerating}
            >
              <SelectTrigger id="sourceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sourceTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Source Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="sourceText">
                Source Text <span className="text-red-500">*</span>
              </Label>
              <span
                className={cn(
                  'text-xs',
                  charPercentage > 90 ? 'text-red-600' : charPercentage > 70 ? 'text-yellow-600' : 'text-gray-500'
                )}
              >
                {charCount.toLocaleString()} / {charLimit.toLocaleString()}
              </span>
            </div>
            <Textarea
              id="sourceText"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="Paste the source text here (e.g., press release, article, profile)..."
              rows={12}
              className="font-mono text-sm"
              disabled={isGenerating}
              required
            />
          </div>

          {/* Suggested Name */}
          <div className="space-y-2">
            <Label htmlFor="suggestedName">Suggested Persona Name (Optional)</Label>
            <Input
              id="suggestedName"
              value={suggestedName}
              onChange={(e) => setSuggestedName(e.target.value)}
              placeholder="e.g., Enterprise CTO, Healthcare Marketer"
              disabled={isGenerating}
            />
          </div>

          {/* Additional Context */}
          <div className="space-y-2">
            <Label htmlFor="additionalContext">Additional Context (Optional)</Label>
            <Textarea
              id="additionalContext"
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              placeholder="Any additional context to help with persona generation..."
              rows={3}
              disabled={isGenerating}
            />
          </div>

          {/* Persona Type */}
          <div className="space-y-2">
            <Label htmlFor="personaType">Persona Type</Label>
            <Select
              value={personaType}
              onValueChange={(v) => setPersonaType(v as PersonaType)}
              disabled={isGenerating}
            >
              <SelectTrigger id="personaType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {personaTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Extract Toggles */}
          <div className="space-y-3 p-4 bg-gray-50 rounded border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="extractTraits">Extract Traits</Label>
                <p className="text-xs text-gray-500">
                  Identify skills, demographics, psychographics, behaviors
                </p>
              </div>
              <Switch
                id="extractTraits"
                checked={extractTraits}
                onCheckedChange={setExtractTraits}
                disabled={isGenerating}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="extractInsights">Extract Insights</Label>
                <p className="text-xs text-gray-500">
                  Find content preferences, pain points, opportunities
                </p>
              </div>
              <Switch
                id="extractInsights"
                checked={extractInsights}
                onCheckedChange={setExtractInsights}
                disabled={isGenerating}
              />
            </div>
          </div>

          {/* Advanced Settings */}
          <details className="space-y-3">
            <summary className="text-sm font-medium cursor-pointer text-gray-700 hover:text-gray-900">
              Advanced Settings
            </summary>
            <div className="space-y-4 pt-3">
              {/* LLM Model */}
              <div className="space-y-2">
                <Label htmlFor="llmModel">LLM Model</Label>
                <Select
                  value={llmModel}
                  onValueChange={setLlmModel}
                  disabled={isGenerating}
                >
                  <SelectTrigger id="llmModel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {llmModelOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="temperature">Temperature</Label>
                  <span className="text-sm text-gray-600">{temperature}</span>
                </div>
                <input
                  type="range"
                  id="temperature"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  disabled={isGenerating}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Precise (0)</span>
                  <span>Balanced (1)</span>
                  <span>Creative (2)</span>
                </div>
              </div>
            </div>
          </details>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={isGenerating || !sourceText.trim()}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Persona
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isGenerating}
            >
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
