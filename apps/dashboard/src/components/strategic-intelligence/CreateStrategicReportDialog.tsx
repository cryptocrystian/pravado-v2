/**
 * Create Strategic Report Dialog Component (Sprint S65)
 * Modal for creating a new strategic intelligence report
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createReport, type CreateStrategicReport } from '@/lib/strategicIntelligenceApi';
import type { StrategicReportFormat, StrategicAudience } from '@pravado/types';
import { Plus, Loader2 } from 'lucide-react';

interface CreateStrategicReportDialogProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function CreateStrategicReportDialog({
  onSuccess,
  children,
}: CreateStrategicReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateStrategicReport>>({
    title: '',
    description: '',
    format: 'quarterly_strategic_review',
    audience: 'c_suite',
    periodStart: '',
    periodEnd: '',
    fiscalQuarter: '',
    fiscalYear: new Date().getFullYear(),
    tone: 'executive',
    targetLength: 'comprehensive',
    includeCharts: true,
    includeRecommendations: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.periodStart || !formData.periodEnd) return;

    setIsLoading(true);
    try {
      await createReport(formData as CreateStrategicReport);
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        format: 'quarterly_strategic_review',
        audience: 'c_suite',
        periodStart: '',
        periodEnd: '',
        fiscalQuarter: '',
        fiscalYear: new Date().getFullYear(),
        tone: 'executive',
        targetLength: 'comprehensive',
        includeCharts: true,
        includeRecommendations: true,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Strategic Intelligence Report</DialogTitle>
            <DialogDescription>
              Create a new CEO-level strategic intelligence report synthesizing insights from
              all upstream systems.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Q1 2025 Strategic Review"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this strategic report..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="format">Report Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) =>
                    setFormData({ ...formData, format: value as StrategicReportFormat })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly_strategic_review">Quarterly Strategic Review</SelectItem>
                    <SelectItem value="annual_strategic_assessment">Annual Strategic Assessment</SelectItem>
                    <SelectItem value="board_strategy_brief">Board Strategy Brief</SelectItem>
                    <SelectItem value="ceo_intelligence_brief">CEO Intelligence Brief</SelectItem>
                    <SelectItem value="investor_strategy_update">Investor Strategy Update</SelectItem>
                    <SelectItem value="crisis_strategic_response">Crisis Strategic Response</SelectItem>
                    <SelectItem value="competitive_strategy_report">Competitive Strategy Report</SelectItem>
                    <SelectItem value="custom">Custom Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={formData.audience}
                  onValueChange={(value) =>
                    setFormData({ ...formData, audience: value as StrategicAudience })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ceo">CEO</SelectItem>
                    <SelectItem value="c_suite">C-Suite Executives</SelectItem>
                    <SelectItem value="board">Board of Directors</SelectItem>
                    <SelectItem value="investors">Investors</SelectItem>
                    <SelectItem value="senior_leadership">Senior Leadership</SelectItem>
                    <SelectItem value="all_executives">All Executives</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="periodStart">Period Start *</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={formData.periodStart?.split('T')[0] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodStart: new Date(e.target.value).toISOString(),
                    })
                  }
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="periodEnd">Period End *</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={formData.periodEnd?.split('T')[0] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      periodEnd: new Date(e.target.value).toISOString(),
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
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

              <div className="grid gap-2">
                <Label htmlFor="fiscalYear">Fiscal Year</Label>
                <Input
                  id="fiscalYear"
                  type="number"
                  min={2000}
                  max={2100}
                  value={formData.fiscalYear}
                  onChange={(e) =>
                    setFormData({ ...formData, fiscalYear: parseInt(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tone">Writing Tone</Label>
                <Select
                  value={formData.tone}
                  onValueChange={(value) =>
                    setFormData({ ...formData, tone: value as 'executive' | 'formal' | 'strategic' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetLength">Target Length</Label>
                <Select
                  value={formData.targetLength}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      targetLength: value as 'brief' | 'standard' | 'comprehensive',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select length" />
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

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
