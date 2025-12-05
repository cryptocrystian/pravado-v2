/**
 * Executive Digest Form Component (Sprint S62)
 * Create/edit form for digest configuration
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  EXEC_DIGEST_DELIVERY_PERIOD_LABELS,
  EXEC_DIGEST_TIME_WINDOW_LABELS,
  type ExecDigestDeliveryPeriod,
  type ExecDigestTimeWindow,
} from '@pravado/types';
import type { CreateExecDigestInput, UpdateExecDigestInput } from '@pravado/validators';
import { cn } from '@/lib/utils';
import {
  FileText,
  Calendar,
  Settings,
  BarChart2,
  Lightbulb,
  AlertTriangle,
  Star,
  Users,
  TrendingUp,
  AlertOctagon,
  Shield,
  CheckSquare,
} from 'lucide-react';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i >= 12 ? 'PM' : 'AM'}`,
}));

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
];

interface ExecDigestFormProps {
  initialValues?: CreateExecDigestInput | UpdateExecDigestInput;
  isEditing?: boolean;
  isSubmitting?: boolean;
  onSubmit: (values: CreateExecDigestInput | UpdateExecDigestInput) => Promise<void>;
  onCancel?: () => void;
  className?: string;
}

export function ExecDigestForm({
  initialValues,
  isEditing,
  isSubmitting,
  onSubmit,
  onCancel,
  className,
}: ExecDigestFormProps) {
  const [values, setValues] = useState<CreateExecDigestInput>({
    title: initialValues?.title || 'Executive Weekly Digest',
    description: initialValues?.description || '',
    deliveryPeriod: initialValues?.deliveryPeriod || 'weekly',
    timeWindow: initialValues?.timeWindow || '7d',
    scheduleDayOfWeek: initialValues?.scheduleDayOfWeek ?? 1,
    scheduleHour: initialValues?.scheduleHour ?? 8,
    scheduleTimezone: initialValues?.scheduleTimezone || 'UTC',
    includeRecommendations: initialValues?.includeRecommendations ?? true,
    includeKpis: initialValues?.includeKpis ?? true,
    includeInsights: initialValues?.includeInsights ?? true,
    includeRiskSummary: initialValues?.includeRiskSummary ?? true,
    includeReputationSummary: initialValues?.includeReputationSummary ?? true,
    includeCompetitiveSummary: initialValues?.includeCompetitiveSummary ?? true,
    includeMediaPerformance: initialValues?.includeMediaPerformance ?? true,
    includeCrisisStatus: initialValues?.includeCrisisStatus ?? true,
    includeGovernance: initialValues?.includeGovernance ?? true,
    isActive: initialValues?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  const updateValue = <K extends keyof CreateExecDigestInput>(
    key: K,
    value: CreateExecDigestInput[K]
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-600" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Digest Title</Label>
            <Input
              id="title"
              value={values.title}
              onChange={(e) => updateValue('title', e.target.value)}
              placeholder="Executive Weekly Digest"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={values.description || ''}
              onChange={(e) => updateValue('description', e.target.value)}
              placeholder="Brief description of this digest..."
              rows={2}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active</Label>
              <p className="text-xs text-gray-500">
                Enable scheduled delivery
              </p>
            </div>
            <Switch
              checked={values.isActive}
              onCheckedChange={(checked) => updateValue('isActive', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" />
            Delivery Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Delivery Period</Label>
              <Select
                value={values.deliveryPeriod}
                onValueChange={(v) => updateValue('deliveryPeriod', v as ExecDigestDeliveryPeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXEC_DIGEST_DELIVERY_PERIOD_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Time Window</Label>
              <Select
                value={values.timeWindow}
                onValueChange={(v) => updateValue('timeWindow', v as ExecDigestTimeWindow)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXEC_DIGEST_TIME_WINDOW_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={String(values.scheduleDayOfWeek)}
                onValueChange={(v) => updateValue('scheduleDayOfWeek', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time</Label>
              <Select
                value={String(values.scheduleHour)}
                onValueChange={(v) => updateValue('scheduleHour', parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour.value} value={String(hour.value)}>
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={values.scheduleTimezone}
                onValueChange={(v) => updateValue('scheduleTimezone', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-indigo-600" />
            Content Sections
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500 mb-4">
            Select which sections to include in the digest
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SectionToggle
              icon={<BarChart2 className="h-4 w-4" />}
              label="Key KPIs"
              description="Performance metrics snapshot"
              checked={values.includeKpis}
              onChange={(checked) => updateValue('includeKpis', checked)}
            />
            <SectionToggle
              icon={<Lightbulb className="h-4 w-4" />}
              label="Key Insights"
              description="Important findings and trends"
              checked={values.includeInsights}
              onChange={(checked) => updateValue('includeInsights', checked)}
            />
            <SectionToggle
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Risk Summary"
              description="Risk analysis and alerts"
              checked={values.includeRiskSummary}
              onChange={(checked) => updateValue('includeRiskSummary', checked)}
            />
            <SectionToggle
              icon={<Star className="h-4 w-4" />}
              label="Reputation Summary"
              description="Brand reputation status"
              checked={values.includeReputationSummary}
              onChange={(checked) => updateValue('includeReputationSummary', checked)}
            />
            <SectionToggle
              icon={<Users className="h-4 w-4" />}
              label="Competitive Summary"
              description="Competitive intelligence"
              checked={values.includeCompetitiveSummary}
              onChange={(checked) => updateValue('includeCompetitiveSummary', checked)}
            />
            <SectionToggle
              icon={<TrendingUp className="h-4 w-4" />}
              label="Media Performance"
              description="Media coverage metrics"
              checked={values.includeMediaPerformance}
              onChange={(checked) => updateValue('includeMediaPerformance', checked)}
            />
            <SectionToggle
              icon={<AlertOctagon className="h-4 w-4" />}
              label="Crisis Status"
              description="Active crisis incidents"
              checked={values.includeCrisisStatus}
              onChange={(checked) => updateValue('includeCrisisStatus', checked)}
            />
            <SectionToggle
              icon={<Shield className="h-4 w-4" />}
              label="Governance"
              description="Compliance highlights"
              checked={values.includeGovernance}
              onChange={(checked) => updateValue('includeGovernance', checked)}
            />
            <SectionToggle
              icon={<CheckSquare className="h-4 w-4" />}
              label="Recommendations"
              description="AI-generated action items"
              checked={values.includeRecommendations}
              onChange={(checked) => updateValue('includeRecommendations', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Digest'}
        </Button>
      </div>
    </form>
  );
}

interface SectionToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked?: boolean;
  onChange: (checked: boolean) => void;
}

function SectionToggle({
  icon,
  label,
  description,
  checked,
  onChange,
}: SectionToggleProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-100 text-gray-600">{icon}</div>
        <div>
          <div className="font-medium text-sm text-gray-900">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
