/**
 * Board Report Form Component (Sprint S63)
 * Create/edit form for board reports
 */

'use client';

import { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  type ExecBoardReport,
  type CreateExecBoardReportInput,
  type UpdateExecBoardReportInput,
  type ExecBoardReportSectionType,
} from '@/lib/executiveBoardReportApi';
import {
  EXEC_BOARD_REPORT_FORMAT_LABELS,
  EXEC_BOARD_REPORT_SECTION_TYPE_LABELS,
  EXEC_BOARD_REPORT_SECTION_DEFAULT_ORDER,
} from '@pravado/types';
import { Loader2 } from 'lucide-react';

interface BoardReportFormProps {
  initialValues?: ExecBoardReport;
  isEditing?: boolean;
  onSubmit: (values: CreateExecBoardReportInput | UpdateExecBoardReportInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BoardReportForm({
  initialValues,
  isEditing,
  onSubmit,
  onCancel,
  isSubmitting,
}: BoardReportFormProps) {
  const [formData, setFormData] = useState<CreateExecBoardReportInput>({
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    format: initialValues?.format || 'quarterly',
    periodStart: initialValues?.periodStart
      ? new Date(initialValues.periodStart).toISOString().split('T')[0]
      : getDefaultPeriodStart(),
    periodEnd: initialValues?.periodEnd
      ? new Date(initialValues.periodEnd).toISOString().split('T')[0]
      : getDefaultPeriodEnd(),
    fiscalQuarter: initialValues?.fiscalQuarter || getCurrentFiscalQuarter(),
    fiscalYear: initialValues?.fiscalYear || new Date().getFullYear(),
    sectionTypes: initialValues?.sectionTypes || EXEC_BOARD_REPORT_SECTION_DEFAULT_ORDER,
    llmModel: initialValues?.llmModel || 'gpt-4o',
    tone: initialValues?.tone || 'professional',
    targetLength: initialValues?.targetLength || 'comprehensive',
  });

  function getDefaultPeriodStart(): string {
    const now = new Date();
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    return quarterStart.toISOString().split('T')[0];
  }

  function getDefaultPeriodEnd(): string {
    const now = new Date();
    const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
    return quarterEnd.toISOString().split('T')[0];
  }

  function getCurrentFiscalQuarter(): string {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    return `Q${quarter}`;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const toggleSection = (sectionType: ExecBoardReportSectionType) => {
    const currentSections = formData.sectionTypes || [];
    const isIncluded = currentSections.includes(sectionType);

    if (isIncluded) {
      setFormData({
        ...formData,
        sectionTypes: currentSections.filter((s) => s !== sectionType),
      });
    } else {
      setFormData({
        ...formData,
        sectionTypes: [...currentSections, sectionType],
      });
    }
  };

  const allSectionTypes = Object.keys(
    EXEC_BOARD_REPORT_SECTION_TYPE_LABELS
  ) as ExecBoardReportSectionType[];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Report Title *</Label>
          <Input
            id="title"
            placeholder="Q1 2025 Board Report"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of this report's focus..."
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="format">Report Format *</Label>
            <Select
              value={formData.format}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  format: value as CreateExecBoardReportInput['format'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXEC_BOARD_REPORT_FORMAT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fiscalYear">Fiscal Year</Label>
            <Input
              id="fiscalYear"
              type="number"
              min={2000}
              max={2100}
              value={formData.fiscalYear || ''}
              onChange={(e) =>
                setFormData({ ...formData, fiscalYear: parseInt(e.target.value) || null })
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="periodStart">Period Start *</Label>
            <Input
              id="periodStart"
              type="date"
              value={formData.periodStart}
              onChange={(e) => setFormData({ ...formData, periodStart: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="periodEnd">Period End *</Label>
            <Input
              id="periodEnd"
              type="date"
              value={formData.periodEnd}
              onChange={(e) => setFormData({ ...formData, periodEnd: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="fiscalQuarter">Fiscal Quarter</Label>
          <Select
            value={formData.fiscalQuarter || ''}
            onValueChange={(value) => setFormData({ ...formData, fiscalQuarter: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select quarter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Generation Settings */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="font-medium text-gray-900">Generation Settings</h3>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="llmModel">AI Model</Label>
            <Select
              value={formData.llmModel || 'gpt-4o'}
              onValueChange={(value) => setFormData({ ...formData, llmModel: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tone">Tone</Label>
            <Select
              value={formData.tone || 'professional'}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  tone: value as CreateExecBoardReportInput['tone'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="executive">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="targetLength">Length</Label>
            <Select
              value={formData.targetLength || 'comprehensive'}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  targetLength: value as CreateExecBoardReportInput['targetLength'],
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="brief">Brief</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="comprehensive">Comprehensive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Section Selection */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Report Sections</h3>
          <div className="text-sm text-gray-500">
            {formData.sectionTypes?.length || 0} selected
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {allSectionTypes.map((sectionType) => {
            const isChecked = formData.sectionTypes?.includes(sectionType) || false;

            return (
              <div
                key={sectionType}
                className="flex items-center gap-2 p-2 rounded hover:bg-gray-50"
              >
                <Checkbox
                  id={sectionType}
                  checked={isChecked}
                  onCheckedChange={() => toggleSection(sectionType)}
                />
                <label
                  htmlFor={sectionType}
                  className="text-sm cursor-pointer flex-1"
                >
                  {EXEC_BOARD_REPORT_SECTION_TYPE_LABELS[sectionType]}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !formData.title}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : isEditing ? (
            'Update Report'
          ) : (
            'Create Report'
          )}
        </Button>
      </div>
    </form>
  );
}
