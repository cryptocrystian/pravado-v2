/**
 * Executive Narrative Panel Component (Sprint S61)
 * Displays the latest LLM-generated narrative with risks, opportunities, storyline
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type ExecDashboardNarrative,
  formatRelativeTime,
} from '@/lib/executiveCommandCenterApi';
import { cn } from '@/lib/utils';
import {
  FileText,
  RefreshCw,
  Loader2,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ExecNarrativePanelProps {
  narrative: ExecDashboardNarrative | null;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  className?: string;
}

interface NarrativeSection {
  title: string;
  icon: React.ReactNode;
  content: string | null;
  colorClass: string;
}

export function ExecNarrativePanel({
  narrative,
  loading,
  onRefresh,
  refreshing,
  className,
}: ExecNarrativePanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['risks', 'opportunities', 'storyline'])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            This Week's Narrative
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-2 text-gray-500">Loading narrative...</span>
        </CardContent>
      </Card>
    );
  }

  if (!narrative) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              This Week's Narrative
            </CardTitle>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                Generate
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No narrative available yet.</p>
          <p className="text-sm mt-1">
            Refresh the dashboard to generate an AI-powered narrative summary.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sections: NarrativeSection[] = [
    {
      title: 'Key Risks',
      icon: <AlertTriangle className="h-4 w-4" />,
      content: narrative.risksSection,
      colorClass: 'text-red-600 bg-red-50 border-red-100',
    },
    {
      title: 'Key Opportunities',
      icon: <TrendingUp className="h-4 w-4" />,
      content: narrative.opportunitiesSection,
      colorClass: 'text-green-600 bg-green-50 border-green-100',
    },
    {
      title: 'Storyline',
      icon: <BookOpen className="h-4 w-4" />,
      content: narrative.storylineSection,
      colorClass: 'text-blue-600 bg-blue-50 border-blue-100',
    },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            This Week's Narrative
            {narrative.isCurrent && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Current
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center text-xs text-gray-500">
              <Clock className="h-3 w-3 mr-1" />
              {formatRelativeTime(narrative.createdAt)}
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                Regenerate
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Summary */}
        {narrative.narrativeText && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100">
            <p className="text-gray-800 leading-relaxed">
              {narrative.narrativeText}
            </p>
          </div>
        )}

        {/* Collapsible Sections */}
        {sections.map((section) => {
          const sectionKey = section.title.toLowerCase().replace(' ', '_');
          const isExpanded = expandedSections.has(sectionKey.split('_')[1] || sectionKey);

          if (!section.content) return null;

          return (
            <div
              key={section.title}
              className={cn('rounded-lg border overflow-hidden', section.colorClass)}
            >
              <button
                className="w-full flex items-center justify-between p-3 hover:bg-opacity-50 transition-colors"
                onClick={() => toggleSection(sectionKey.split('_')[1] || sectionKey)}
              >
                <div className="flex items-center gap-2 font-medium">
                  {section.icon}
                  {section.title}
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {section.content}
                  </p>
                </div>
              )}
            </div>
          );
        })}

      </CardContent>
    </Card>
  );
}
