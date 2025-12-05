/**
 * Strategic Intelligence Report Detail Page (Sprint S65)
 * View and manage individual strategic intelligence reports
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  StrategicReportHeader,
  StrategicSectionEditor,
  StrategicInsightsPanel,
  StrategicSourcesList,
  StrategicAuditLogTimeline,
} from '@/components/strategic-intelligence';
import {
  getReport,
  generateReport,
  approveReport,
  publishReport,
  archiveReport,
  refreshInsights,
  updateSection,
  regenerateSection,
  listReportAuditLogs,
  type StrategicReportWithSections,
  type StrategicAuditLogEntry,
  type AggregatedStrategicInsights,
} from '@/lib/strategicIntelligenceApi';
import {
  FileText,
  Database,
  History,
  Loader2,
  Lightbulb,
} from 'lucide-react';

export default function StrategicReportDetailPage() {
  const params = useParams();
  useRouter(); // Keep router reference for future navigation
  const reportId = params?.id as string;

  const [reportData, setReportData] = useState<StrategicReportWithSections | null>(null);
  const [auditLogs, setAuditLogs] = useState<StrategicAuditLogEntry[]>([]);
  const [insights, setInsights] = useState<AggregatedStrategicInsights>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [updatingSectionId, setUpdatingSectionId] = useState<string | null>(null);
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);

  const fetchReport = useCallback(async () => {
    try {
      const data = await getReport(reportId);
      setReportData(data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
    }
  }, [reportId]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const result = await listReportAuditLogs(reportId, { limit: 50 });
      setAuditLogs(result.logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  }, [reportId]);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchReport(), fetchAuditLogs()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchReport, fetchAuditLogs]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const result = await generateReport(reportId, { refreshInsights: true });
      setReportData({
        report: result.report,
        sections: result.sections,
        sources: result.sources,
      });
      setInsights(result.insights);
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const updatedReport = await approveReport(reportId);
      setReportData((prev) => prev ? { ...prev, report: updatedReport } : null);
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to approve report:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const result = await publishReport(reportId, { generatePdf: true });
      setReportData((prev) => prev ? { ...prev, report: result.report } : null);
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to publish report:', error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Are you sure you want to archive this report?')) return;

    try {
      const updatedReport = await archiveReport(reportId);
      setReportData((prev) => prev ? { ...prev, report: updatedReport } : null);
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to archive report:', error);
    }
  };

  const handleRefreshInsights = async () => {
    try {
      const result = await refreshInsights(reportId, { forceRefresh: true });
      setReportData((prev) => prev ? { ...prev, report: result.report } : null);
      setInsights(result.insights);
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to refresh insights:', error);
    }
  };

  const handleExport = async () => {
    // TODO: Implement export dialog
    console.log('Export clicked');
  };

  const handleUpdateSection = async (sectionId: string, content: string) => {
    setUpdatingSectionId(sectionId);
    try {
      const updatedSection = await updateSection(reportId, sectionId, { contentMd: content });
      setReportData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === sectionId ? updatedSection : s
          ),
        };
      });
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to update section:', error);
    } finally {
      setUpdatingSectionId(null);
    }
  };

  const handleRegenerateSection = async (sectionId: string) => {
    setRegeneratingSectionId(sectionId);
    try {
      const updatedSection = await regenerateSection(reportId, sectionId);
      setReportData((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sections: prev.sections.map((s) =>
            s.id === sectionId ? updatedSection : s
          ),
        };
      });
      fetchAuditLogs();
    } catch (error) {
      console.error('Failed to regenerate section:', error);
    } finally {
      setRegeneratingSectionId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">Report Not Found</h3>
            <p className="text-muted-foreground">
              The requested strategic intelligence report could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { report, sections, sources = [] } = reportData;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Report Header */}
      <StrategicReportHeader
        report={report}
        onGenerate={handleGenerate}
        onApprove={handleApprove}
        onPublish={handlePublish}
        onArchive={handleArchive}
        onRefreshInsights={handleRefreshInsights}
        onExport={handleExport}
        isGenerating={isGenerating}
        isApproving={isApproving}
        isPublishing={isPublishing}
      />

      {/* Content Tabs */}
      <Tabs defaultValue="sections" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sections ({sections.length})
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Sources ({sources.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-6">
          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Sections Generated</h3>
                <p className="text-muted-foreground mb-4">
                  Click the Generate button to create content for this report.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <StrategicSectionEditor
                  key={section.id}
                  section={section}
                  onUpdate={handleUpdateSection}
                  onRegenerate={handleRegenerateSection}
                  isUpdating={updatingSectionId === section.id}
                  isRegenerating={regeneratingSectionId === section.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="insights" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Aggregated Insights</h3>
              <StrategicInsightsPanel insights={insights} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Key Summary</h3>
              {report.summaryJson && (
                <div className="space-y-4">
                  {report.summaryJson.keyInsights && report.summaryJson.keyInsights.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Key Insights</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {report.summaryJson.keyInsights.map((insight, i) => (
                            <li key={i}>{insight}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {report.summaryJson.topRisks && report.summaryJson.topRisks.length > 0 && (
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Top Risks</h4>
                        <ul className="space-y-2 text-sm">
                          {report.summaryJson.topRisks.map((risk, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span
                                className={`px-2 py-0.5 rounded text-xs ${
                                  risk.severity === 'critical'
                                    ? 'bg-red-100 text-red-700'
                                    : risk.severity === 'high'
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {risk.severity}
                              </span>
                              <span>{risk.risk}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {report.summaryJson.topOpportunities &&
                    report.summaryJson.topOpportunities.length > 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <h4 className="font-medium mb-2">Top Opportunities</h4>
                          <ul className="space-y-2 text-sm">
                            {report.summaryJson.topOpportunities.map((opp, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded text-xs ${
                                    opp.impact === 'high'
                                      ? 'bg-green-100 text-green-700'
                                      : opp.impact === 'medium'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {opp.impact}
                                </span>
                                <span>{opp.opportunity}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sources" className="mt-6">
          <StrategicSourcesList sources={sources} />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <StrategicAuditLogTimeline logs={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
