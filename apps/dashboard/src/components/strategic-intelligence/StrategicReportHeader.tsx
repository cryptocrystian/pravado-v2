/**
 * Strategic Report Header Component (Sprint S65)
 * Header section for strategic intelligence report detail page
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type StrategicIntelligenceReport,
  getFormatLabel,
  getStatusLabel,
  getAudienceLabel,
  formatPeriodRange,
  formatFiscalQuarter,
  formatScore,
  getScoreColor,
  canGenerate,
  canApprove,
  canPublish,
  canArchive,
} from '@/lib/strategicIntelligenceApi';
import {
  ArrowLeft,
  Play,
  Check,
  Send,
  Archive,
  RefreshCw,
  Download,
  Loader2,
  FileText,
  Users,
  Calendar,
  Target,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  Heart,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

interface StrategicReportHeaderProps {
  report: StrategicIntelligenceReport;
  onGenerate?: () => void;
  onApprove?: () => void;
  onPublish?: () => void;
  onArchive?: () => void;
  onRefreshInsights?: () => void;
  onExport?: () => void;
  isGenerating?: boolean;
  isApproving?: boolean;
  isPublishing?: boolean;
}

export function StrategicReportHeader({
  report,
  onGenerate,
  onApprove,
  onPublish,
  onArchive,
  onRefreshInsights,
  onExport,
  isGenerating = false,
  isApproving = false,
  isPublishing = false,
}: StrategicReportHeaderProps) {
  const getStatusBadgeVariant = (): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (report.status) {
      case 'published':
        return 'default';
      case 'approved':
        return 'default';
      case 'generating':
        return 'secondary';
      case 'archived':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link and title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/exec/strategy">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{report.title}</h1>
              <Badge variant={getStatusBadgeVariant()}>
                {getStatusLabel(report.status)}
              </Badge>
            </div>
            {report.description && (
              <p className="text-muted-foreground mt-1">{report.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshInsights && (
            <Button variant="outline" onClick={onRefreshInsights}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Insights
            </Button>
          )}
          {onExport && (
            <Button variant="outline" onClick={onExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
          {canGenerate(report.status) && onGenerate && (
            <Button onClick={onGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          )}
          {canApprove(report.status) && onApprove && (
            <Button onClick={onApprove} disabled={isApproving}>
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </>
              )}
            </Button>
          )}
          {canPublish(report.status) && onPublish && (
            <Button onClick={onPublish} disabled={isPublishing}>
              {isPublishing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
          )}
          {canArchive(report.status) && onArchive && (
            <Button variant="outline" onClick={onArchive}>
              <Archive className="h-4 w-4 mr-2" />
              Archive
            </Button>
          )}
        </div>
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>{getFormatLabel(report.format)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{getAudienceLabel(report.audience)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>{formatPeriodRange(report.periodStart, report.periodEnd)}</span>
        </div>
        {report.fiscalQuarter && report.fiscalYear && (
          <Badge variant="outline">
            {formatFiscalQuarter(report.fiscalYear, parseInt(report.fiscalQuarter.replace(/\D/g, ''), 10) || 1)}
          </Badge>
        )}
      </div>

      {/* Strategic scores */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <ScoreCard
          icon={Target}
          label="Overall Score"
          score={report.overallStrategicScore}
        />
        <ScoreCard
          icon={AlertTriangle}
          label="Risk Posture"
          score={report.riskPostureScore}
        />
        <ScoreCard
          icon={Lightbulb}
          label="Opportunity"
          score={report.opportunityScore}
        />
        <ScoreCard
          icon={TrendingUp}
          label="Messaging"
          score={report.messagingAlignmentScore}
        />
        <ScoreCard
          icon={Shield}
          label="Competitive"
          score={report.competitivePositionScore}
        />
        <ScoreCard
          icon={Heart}
          label="Brand Health"
          score={report.brandHealthScore}
        />
      </div>
    </div>
  );
}

interface ScoreCardProps {
  icon: typeof Target;
  label: string;
  score: number | null;
}

function ScoreCard({ icon: Icon, label, score }: ScoreCardProps) {
  const scoreColor = getScoreColor(score);
  const colorClass = score !== null ? `text-${scoreColor}-600` : 'text-muted-foreground';

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={`text-2xl font-bold ${colorClass}`}>
        {formatScore(score)}
      </div>
    </div>
  );
}
