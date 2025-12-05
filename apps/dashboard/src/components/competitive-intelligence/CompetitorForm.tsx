'use client';

import { useState, useEffect } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type {
  Competitor,
  CreateCompetitorRequest,
  UpdateCompetitorRequest,
  CompetitorTier,
} from '@pravado/types';
import { createCompetitor, updateCompetitor } from '@/lib/competitorIntelligenceApi';
import { Plus, X, Loader2 } from 'lucide-react';

interface CompetitorFormProps {
  competitor?: Competitor | null;
  onSuccess?: (competitor: Competitor) => void;
  onCancel?: () => void;
  className?: string;
}

export function CompetitorForm({
  competitor,
  onSuccess,
  onCancel,
  className,
}: CompetitorFormProps) {
  const isEditing = !!competitor;

  const [name, setName] = useState(competitor?.name || '');
  const [domain, setDomain] = useState(competitor?.domain || '');
  const [tier, setTier] = useState<CompetitorTier>(competitor?.tier || ('tier_2' as CompetitorTier));
  const [industry, setIndustry] = useState(competitor?.industry || '');
  const [description, setDescription] = useState(competitor?.description || '');
  const [keywords, setKeywords] = useState<string[]>(competitor?.keywords || []);
  const [domains, setDomains] = useState<string[]>(competitor?.domains || []);
  const [isActive, setIsActive] = useState(competitor?.isActive ?? true);

  const [newKeyword, setNewKeyword] = useState('');
  const [newDomain, setNewDomain] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (competitor) {
      setName(competitor.name || '');
      setDomain(competitor.domain || '');
      setTier(competitor.tier);
      setIndustry(competitor.industry || '');
      setDescription(competitor.description || '');
      setKeywords(competitor.keywords || []);
      setDomains(competitor.domains || []);
      setIsActive(competitor.isActive);
    }
  }, [competitor]);

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setKeywords(keywords.filter((k) => k !== keyword));
  };

  const handleAddDomain = () => {
    if (newDomain.trim() && !domains.includes(newDomain.trim())) {
      setDomains([...domains, newDomain.trim()]);
      setNewDomain('');
    }
  };

  const handleRemoveDomain = (domainToRemove: string) => {
    setDomains(domains.filter((d) => d !== domainToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    if (keywords.length === 0) {
      setError('At least one keyword is required');
      return;
    }

    setIsLoading(true);

    try {
      let result: Competitor;

      if (isEditing && competitor) {
        const updateData: UpdateCompetitorRequest = {
          name: name.trim(),
          domain: domain.trim() || undefined,
          tier,
          industry: industry.trim() || undefined,
          description: description.trim() || undefined,
          keywords,
          domains: domains.length > 0 ? domains : undefined,
          isActive,
        };
        result = await updateCompetitor(competitor.id, updateData);
      } else {
        const createData: CreateCompetitorRequest = {
          name: name.trim(),
          domain: domain.trim() || undefined,
          tier,
          industry: industry.trim() || undefined,
          description: description.trim() || undefined,
          keywords,
          domains: domains.length > 0 ? domains : undefined,
        };
        result = await createCompetitor(createData);
      }

      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const tierOptions: { value: CompetitorTier; label: string; description: string }[] = [
    { value: 'tier_1' as CompetitorTier, label: 'Tier 1 - Direct', description: 'Same market, similar scale' },
    { value: 'tier_2' as CompetitorTier, label: 'Tier 2 - Secondary', description: 'Adjacent market' },
    { value: 'tier_3' as CompetitorTier, label: 'Tier 3 - Emerging', description: 'Smaller but growing' },
    { value: 'tier_4' as CompetitorTier, label: 'Tier 4 - Distant', description: 'Different market' },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Competitor' : 'Add New Competitor'}</CardTitle>
        <CardDescription>
          {isEditing
            ? 'Update competitor details and tracking configuration'
            : 'Add a new competitor to track their media presence and compare metrics'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}

          {/* Basic Info */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Competitor Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Acme Corp"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Primary Domain</Label>
              <Input
                id="domain"
                type="url"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tier">Competitor Tier *</Label>
              <Select value={tier} onValueChange={(value) => setTier(value as CompetitorTier)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  {tierOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g., SaaS, E-commerce"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the competitor..."
              rows={3}
            />
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <Label>Tracking Keywords *</Label>
            <p className="text-xs text-muted-foreground">
              Keywords used to identify competitor mentions in media coverage
            </p>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="Add keyword..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddKeyword}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary" className="gap-1">
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Additional Domains */}
          <div className="space-y-2">
            <Label>Additional Domains</Label>
            <p className="text-xs text-muted-foreground">
              Other domains associated with this competitor
            </p>
            <div className="flex gap-2">
              <Input
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="https://subdomain.example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddDomain}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {domains.map((d) => (
                <Badge key={d} variant="outline" className="gap-1">
                  {d}
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(d)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Status (only for editing) */}
          {isEditing && (
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Tracking</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable competitor tracking
                </p>
              </div>
              <Switch id="isActive" checked={isActive} onCheckedChange={setIsActive} />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Competitor' : 'Add Competitor'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
