/**
 * PersonaEditor Component (Sprint S51.2)
 * Form for editing persona details and metadata
 */

'use client';

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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type {
  AudiencePersona,
  UpdatePersonaInput,
  PersonaType,
  CompanySize,
  SeniorityLevel,
  PersonaStatus,
} from '@pravado/types';
import { AlertCircle, Check, Loader2, X } from 'lucide-react';
import { useState } from 'react';

interface PersonaEditorProps {
  persona: AudiencePersona;
  onSave: (updates: UpdatePersonaInput) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

export function PersonaEditor({
  persona,
  onSave,
  onCancel,
  isSaving = false,
}: PersonaEditorProps) {
  const [name, setName] = useState(persona.name);
  const [description, setDescription] = useState(persona.description || '');
  const [personaType, setPersonaType] = useState<PersonaType>(persona.personaType);
  const [role, setRole] = useState(persona.role || '');
  const [industry, setIndustry] = useState(persona.industry || '');
  const [companySize, setCompanySize] = useState<CompanySize | undefined>(persona.companySize);
  const [seniorityLevel, setSeniorityLevel] = useState<SeniorityLevel | undefined>(persona.seniorityLevel);
  const [location, setLocation] = useState(persona.location || '');
  const [status, setStatus] = useState<PersonaStatus>(persona.status);
  const [tags, setTags] = useState<string[]>(persona.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    const updates: UpdatePersonaInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      personaType,
      role: role.trim() || undefined,
      industry: industry.trim() || undefined,
      companySize,
      seniorityLevel,
      location: location.trim() || undefined,
      tags,
      status,
    };

    try {
      await onSave(updates);
    } catch (err: any) {
      setError(err.message || 'Failed to save persona');
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const personaTypeOptions: { value: PersonaType; label: string }[] = [
    { value: 'primary_audience', label: 'Primary Audience' },
    { value: 'secondary_audience', label: 'Secondary Audience' },
    { value: 'stakeholder', label: 'Stakeholder' },
    { value: 'influencer', label: 'Influencer' },
  ];

  const companySizeOptions: { value: CompanySize; label: string }[] = [
    { value: 'startup', label: 'Startup' },
    { value: 'smb', label: 'SMB' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  const seniorityLevelOptions: { value: SeniorityLevel; label: string }[] = [
    { value: 'individual_contributor', label: 'Individual Contributor' },
    { value: 'manager', label: 'Manager' },
    { value: 'director', label: 'Director' },
    { value: 'executive', label: 'Executive' },
    { value: 'c_level', label: 'C-Level' },
  ];

  const statusOptions: { value: PersonaStatus; label: string }[] = [
    { value: 'active', label: 'Active' },
    { value: 'archived', label: 'Archived' },
    { value: 'merged', label: 'Merged' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Persona name"
          disabled={isSaving}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this persona"
          rows={3}
          disabled={isSaving}
        />
      </div>

      {/* Persona Type & Status */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="personaType">Persona Type</Label>
          <Select
            value={personaType}
            onValueChange={(v) => setPersonaType(v as PersonaType)}
            disabled={isSaving}
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

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v as PersonaStatus)}
            disabled={isSaving}
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Role & Industry */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Input
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="e.g., CTO, Marketing Director"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g., Healthcare, SaaS"
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Company Size & Seniority Level */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companySize">Company Size</Label>
          <Select
            value={companySize || ''}
            onValueChange={(v) => setCompanySize(v as CompanySize || undefined)}
            disabled={isSaving}
          >
            <SelectTrigger id="companySize">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {companySizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seniorityLevel">Seniority Level</Label>
          <Select
            value={seniorityLevel || ''}
            onValueChange={(v) => setSeniorityLevel(v as SeniorityLevel || undefined)}
            disabled={isSaving}
          >
            <SelectTrigger id="seniorityLevel">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              {seniorityLevelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., San Francisco, CA"
          disabled={isSaving}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label htmlFor="tagInput">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tagInput"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add tag and press Enter"
            disabled={isSaving}
          />
          <Button type="button" onClick={addTag} disabled={isSaving} variant="outline">
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  disabled={isSaving}
                  className="hover:text-red-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
