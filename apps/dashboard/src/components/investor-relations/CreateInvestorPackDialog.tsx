/**
 * Create Investor Pack Dialog Component (Sprint S64)
 * Modal for creating a new investor pack
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
import { createPack, type CreateInvestorPack } from '@/lib/investorRelationsApi';
import { Plus, Loader2 } from 'lucide-react';
import type { InvestorPackFormat, InvestorPrimaryAudience } from '@pravado/types';

interface CreateInvestorPackDialogProps {
  onSuccess?: () => void;
  children?: React.ReactNode;
}

export function CreateInvestorPackDialog({
  onSuccess,
  children,
}: CreateInvestorPackDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateInvestorPack>>({
    title: '',
    description: '',
    format: 'quarterly_earnings',
    primaryAudience: 'investors',
    periodStart: '',
    periodEnd: '',
    fiscalQuarter: '',
    fiscalYear: new Date().getFullYear(),
    tone: 'professional',
    targetLength: 'comprehensive',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.periodStart || !formData.periodEnd) return;

    setIsLoading(true);
    try {
      await createPack(formData as CreateInvestorPack);
      setOpen(false);
      setFormData({
        title: '',
        description: '',
        format: 'quarterly_earnings',
        primaryAudience: 'investors',
        periodStart: '',
        periodEnd: '',
        fiscalQuarter: '',
        fiscalYear: new Date().getFullYear(),
        tone: 'professional',
        targetLength: 'comprehensive',
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create pack:', error);
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
            New Pack
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Investor Pack</DialogTitle>
            <DialogDescription>
              Create a new investor relations pack for quarterly earnings, annual review, or other
              investor communications.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Q1 2025 Investor Pack"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this pack..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="format">Format</Label>
                <Select
                  value={formData.format}
                  onValueChange={(value) =>
                    setFormData({ ...formData, format: value as InvestorPackFormat })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quarterly_earnings">Quarterly Earnings</SelectItem>
                    <SelectItem value="annual_review">Annual Review</SelectItem>
                    <SelectItem value="investor_day">Investor Day</SelectItem>
                    <SelectItem value="board_update">Board Update</SelectItem>
                    <SelectItem value="fundraising_round">Fundraising Round</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="audience">Primary Audience</Label>
                <Select
                  value={formData.primaryAudience}
                  onValueChange={(value) =>
                    setFormData({ ...formData, primaryAudience: value as InvestorPrimaryAudience })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investors">Institutional Investors</SelectItem>
                    <SelectItem value="board">Board of Directors</SelectItem>
                    <SelectItem value="analysts">Financial Analysts</SelectItem>
                    <SelectItem value="internal_execs">Internal Executives</SelectItem>
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
                  onValueChange={(value) => setFormData({ ...formData, tone: value as 'professional' | 'formal' | 'executive' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="targetLength">Target Length</Label>
                <Select
                  value={formData.targetLength}
                  onValueChange={(value) => setFormData({ ...formData, targetLength: value as 'brief' | 'standard' | 'comprehensive' })}
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
                  Create Pack
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
