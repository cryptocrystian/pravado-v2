/**
 * Executive Board Report Management Page (Sprint S63 + S91 AI Presence Enhancement)
 * Main page for board reporting and quarterly executive pack generator
 */

'use client';

import { useEffect, useState, useCallback } from 'react';

// AI Dot component for presence indication
function AIDot({ status = 'idle' }: { status?: 'idle' | 'analyzing' | 'generating' }) {
  const baseClasses = 'w-2.5 h-2.5 rounded-full';
  if (status === 'analyzing') {
    return <span className={`${baseClasses} ai-dot-analyzing`} />;
  }
  if (status === 'generating') {
    return <span className={`${baseClasses} ai-dot-generating`} />;
  }
  return <span className={`${baseClasses} ai-dot`} />;
}
import {
  BoardReportCard,
  BoardReportHeader,
  BoardReportSectionList,
  BoardReportAudienceList,
  BoardReportAuditLog,
  BoardReportStatsCard,
  BoardReportForm,
} from '@/components/executive-board-reports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  listReports,
  getReport,
  createReport,
  updateReport,
  deleteReport,
  generateReport,
  approveReport,
  publishReport,
  getReportStats,
  addAudienceMember,
  removeAudienceMember,
  updateAudienceMember,
  listAuditLogs,
  updateSection,
  type ExecBoardReportWithCounts,
  type ExecBoardReportAuditLog,
  type ExecBoardReportStats,
  type GetExecBoardReportResponse,
  type CreateExecBoardReportInput,
  type UpdateExecBoardReportInput,
  type AddExecBoardReportAudienceInput,
} from '@/lib/executiveBoardReportApi';
import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
} from 'lucide-react';

export default function ExecutiveBoardReportPage() {
  // List state
  const [reports, setReports] = useState<ExecBoardReportWithCounts[]>([]);
  const [stats, setStats] = useState<ExecBoardReportStats | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Selected report details
  const [reportDetails, setReportDetails] = useState<GetExecBoardReportResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<ExecBoardReportAuditLog[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Action states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load reports list
  const loadReports = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const [reportsResponse, statsResponse] = await Promise.all([
        listReports({ includeArchived: false }),
        getReportStats(),
      ]);

      setReports(reportsResponse.reports);
      setStats(statsResponse);

      // Auto-select first report if none selected
      if (!selectedReportId && reportsResponse.reports.length > 0) {
        setSelectedReportId(reportsResponse.reports[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setListLoading(false);
    }
  }, [selectedReportId]);

  // Load selected report details
  const loadReportDetails = useCallback(async (reportId: string) => {
    setDetailsLoading(true);
    setError(null);

    try {
      const [details, logs] = await Promise.all([
        getReport(reportId),
        listAuditLogs(reportId, { limit: 20 }),
      ]);

      setReportDetails(details);
      setAuditLogs(logs.auditLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report details');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Load details when selection changes
  useEffect(() => {
    if (selectedReportId) {
      loadReportDetails(selectedReportId);
    }
  }, [selectedReportId, loadReportDetails]);

  // Create report
  const handleCreateReport = async (values: CreateExecBoardReportInput | UpdateExecBoardReportInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const newReport = await createReport(values as CreateExecBoardReportInput);
      await loadReports();
      setSelectedReportId(newReport.id);
      setCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update report
  const handleUpdateReport = async (values: CreateExecBoardReportInput | UpdateExecBoardReportInput) => {
    if (!selectedReportId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateReport(selectedReportId, values as UpdateExecBoardReportInput);
      await loadReports();
      await loadReportDetails(selectedReportId);
      setEditDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete report
  const handleDeleteReport = async () => {
    if (!selectedReportId) return;

    if (!confirm('Are you sure you want to delete this report?')) return;

    try {
      await deleteReport(selectedReportId, true);
      setSelectedReportId(null);
      setReportDetails(null);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete report');
    }
  };

  // Archive report
  const handleArchiveReport = async () => {
    if (!selectedReportId) return;

    try {
      await updateReport(selectedReportId, { isArchived: true });
      setSelectedReportId(null);
      setReportDetails(null);
      await loadReports();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive report');
    }
  };

  // Generate report
  const handleGenerate = async () => {
    if (!selectedReportId) return;

    setIsGenerating(true);
    setError(null);

    try {
      await generateReport(selectedReportId, { forceRegenerate: true, generatePdf: true });
      await loadReportDetails(selectedReportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  // Approve report
  const handleApprove = async () => {
    if (!selectedReportId) return;

    try {
      await approveReport(selectedReportId);
      await loadReports();
      await loadReportDetails(selectedReportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve report');
    }
  };

  // Publish report
  const handlePublish = async () => {
    if (!selectedReportId) return;

    if (!confirm('Publish this report and notify all active audience members?')) return;

    setIsPublishing(true);
    setError(null);

    try {
      await publishReport(selectedReportId, { notifyAudience: true, regeneratePdf: true });
      await loadReports();
      await loadReportDetails(selectedReportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish report');
    } finally {
      setIsPublishing(false);
    }
  };

  // Add audience member
  const handleAddAudienceMember = async (data: AddExecBoardReportAudienceInput) => {
    if (!selectedReportId) return;

    try {
      await addAudienceMember(selectedReportId, data);
      await loadReportDetails(selectedReportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add audience member');
      throw err;
    }
  };

  // Remove audience member
  const handleRemoveAudienceMember = async (audienceId: string) => {
    if (!selectedReportId) return;

    try {
      await removeAudienceMember(selectedReportId, audienceId);
      await loadReportDetails(selectedReportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove audience member');
    }
  };

  // Toggle audience member active
  const handleToggleAudienceActive = async (audienceId: string, isActive: boolean) => {
    if (!selectedReportId) return;

    try {
      await updateAudienceMember(selectedReportId, audienceId, { isActive });
      await loadReportDetails(selectedReportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update audience member');
    }
  };

  // Toggle section visibility
  const handleToggleSectionVisibility = async (sectionId: string, isVisible: boolean) => {
    if (!selectedReportId) return;

    try {
      await updateSection(selectedReportId, sectionId, { isVisible });
      await loadReportDetails(selectedReportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update section');
    }
  };

  // Download PDF
  const handleDownloadPdf = () => {
    if (reportDetails?.report.pdfStoragePath) {
      window.open(reportDetails.report.pdfStoragePath, '_blank');
    }
  };

  // Download PPTX
  const handleDownloadPptx = () => {
    if (reportDetails?.report.pptxStoragePath) {
      window.open(reportDetails.report.pptxStoragePath, '_blank');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header with AI Presence */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="mt-1">
            <AIDot status={isGenerating ? 'generating' : listLoading || detailsLoading ? 'analyzing' : 'idle'} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white-0">Executive Board Reports</h1>
            <p className="text-sm text-muted mt-1">
              Quarterly executive packs and board reporting
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* AI Status Pill when active */}
          {(isGenerating || listLoading) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-cyan/10 border border-brand-cyan/20">
              <AIDot status={isGenerating ? 'generating' : 'analyzing'} />
              <span className="text-xs font-medium text-brand-cyan">
                {isGenerating ? 'Generating report...' : 'Loading...'}
              </span>
            </div>
          )}
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-error flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Overview */}
      {stats && <BoardReportStatsCard stats={stats} isLoading={listLoading} />}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Report List - Left Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-iris" />
                Reports ({reports.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {listLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-6" />
                </div>
              ) : reports.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <FileText className="h-12 w-12 text-slate-6 mx-auto mb-4" />
                  <p>No reports created yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Report
                  </Button>
                </div>
              ) : (
                reports.map((report) => (
                  <BoardReportCard
                    key={report.id}
                    report={report}
                    isSelected={selectedReportId === report.id}
                    onSelect={(r) => setSelectedReportId(r.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Report Details - Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {detailsLoading ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
              </div>
            </Card>
          ) : !reportDetails ? (
            <Card className="p-8">
              <div className="text-center text-muted">
                <FileText className="h-12 w-12 text-slate-6 mx-auto mb-4" />
                <p>Select a report to view details</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Report Header */}
              <Card>
                <CardContent className="p-6">
                  <BoardReportHeader
                    report={reportDetails.report}
                    isGenerating={isGenerating}
                    isPublishing={isPublishing}
                    onGenerate={handleGenerate}
                    onApprove={handleApprove}
                    onPublish={handlePublish}
                    onDownloadPdf={handleDownloadPdf}
                    onDownloadPptx={handleDownloadPptx}
                    onEdit={() => setEditDialogOpen(true)}
                    onArchive={handleArchiveReport}
                    onDelete={handleDeleteReport}
                  />
                </CardContent>
              </Card>

              {/* Tabbed Content */}
              <Tabs defaultValue="sections">
                <TabsList>
                  <TabsTrigger value="sections">
                    Sections ({reportDetails.sections.length})
                  </TabsTrigger>
                  <TabsTrigger value="audience">
                    Audience ({reportDetails.audience.length})
                  </TabsTrigger>
                  <TabsTrigger value="activity">
                    Activity ({auditLogs.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sections" className="mt-4">
                  <BoardReportSectionList
                    sections={reportDetails.sections}
                    onToggleVisibility={handleToggleSectionVisibility}
                  />
                </TabsContent>

                <TabsContent value="audience" className="mt-4">
                  <BoardReportAudienceList
                    audience={reportDetails.audience}
                    onAdd={handleAddAudienceMember}
                    onRemove={handleRemoveAudienceMember}
                    onToggleActive={handleToggleAudienceActive}
                  />
                </TabsContent>

                <TabsContent value="activity" className="mt-4">
                  <BoardReportAuditLog auditLogs={auditLogs} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {/* Create Report Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Board Report</DialogTitle>
            <DialogDescription>
              Configure a new executive board report or quarterly pack.
            </DialogDescription>
          </DialogHeader>
          <BoardReportForm
            onSubmit={handleCreateReport}
            onCancel={() => setCreateDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Report Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Report Settings</DialogTitle>
            <DialogDescription>
              Update the configuration for this report.
            </DialogDescription>
          </DialogHeader>
          {reportDetails && (
            <BoardReportForm
              initialValues={reportDetails.report}
              isEditing
              onSubmit={handleUpdateReport}
              onCancel={() => setEditDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
