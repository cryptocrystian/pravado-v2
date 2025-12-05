/**
 * Forecast Generation Form Component (Sprint S60)
 * Form/modal to trigger forecast generation for a snapshot
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
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import type { RiskRadarForecastHorizon } from '@/lib/riskRadarApi';
import { getHorizonLabel } from '@/lib/riskRadarApi';
import { Loader2, Sparkles, Clock, Brain, Zap } from 'lucide-react';

interface ForecastGenerationFormProps {
  snapshotId: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (horizon: RiskRadarForecastHorizon, useLlm: boolean) => Promise<void>;
  defaultHorizon?: RiskRadarForecastHorizon;
}

const horizonOptions: { value: RiskRadarForecastHorizon; description: string; icon: React.ReactNode }[] = [
  {
    value: '24h',
    description: 'Short-term outlook for immediate decision making',
    icon: <Zap className="h-4 w-4" />,
  },
  {
    value: '72h',
    description: 'Three-day forecast for tactical planning',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: '7d',
    description: 'Weekly outlook for operational planning',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: '14d',
    description: 'Two-week forecast for strategic preparation',
    icon: <Clock className="h-4 w-4" />,
  },
  {
    value: '30d',
    description: 'Monthly outlook for long-term planning',
    icon: <Clock className="h-4 w-4" />,
  },
];

export function ForecastGenerationForm({
  snapshotId: _snapshotId,
  open,
  onClose,
  onSubmit,
  defaultHorizon = '7d',
}: ForecastGenerationFormProps) {
  const [horizon, setHorizon] = useState<RiskRadarForecastHorizon>(defaultHorizon);
  const [useLlm, setUseLlm] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(horizon, useLlm);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen: boolean) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Generate Forecast
          </DialogTitle>
          <DialogDescription>
            Create a predictive risk forecast for this snapshot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Horizon Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Forecast Horizon</Label>
            <RadioGroup
              value={horizon}
              onValueChange={(value: string) => setHorizon(value as RiskRadarForecastHorizon)}
              className="space-y-2"
            >
              {horizonOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    horizon === option.value
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setHorizon(option.value)}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                  <div className="flex-1">
                    <Label
                      htmlFor={option.value}
                      className="flex items-center gap-2 font-medium cursor-pointer"
                    >
                      {option.icon}
                      {getHorizonLabel(option.value)}
                    </Label>
                    <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* LLM Enhancement Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Brain className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <Label htmlFor="useLlm" className="font-medium">
                  AI-Enhanced Narrative
                </Label>
                <p className="text-xs text-gray-500">
                  Use AI to generate executive summary and recommendations
                </p>
              </div>
            </div>
            <Switch
              id="useLlm"
              checked={useLlm}
              onCheckedChange={setUseLlm}
            />
          </div>

          {useLlm && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
              <Sparkles className="h-4 w-4 text-blue-500" />
              AI will analyze indicators and drivers to generate actionable insights
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Forecast
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
