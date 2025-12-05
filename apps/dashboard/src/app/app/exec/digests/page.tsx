/**
 * Executive Digest Management Page (Sprint S62)
 * Main page for automated strategic briefs and weekly digest generator
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  ExecDigestCard,
  ExecDigestHeader,
  ExecDigestSectionList,
  ExecDigestRecipientList,
  ExecDigestDeliveryHistory,
  ExecDigestStatsCard,
  ExecDigestForm,
} from '@/components/executive-digests';
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
  listDigests,
  getDigest,
  createDigest,
  updateDigest,
  deleteDigest,
  generateDigest,
  deliverDigest,
  getDigestStats,
  addRecipient,
  removeRecipient,
  updateRecipient,
  listDeliveryLogs,
  type ExecDigestWithCounts,
  type ExecDigestDeliveryLog,
  type ExecDigestStats,
  type GetExecDigestResponse,
} from '@/lib/executiveDigestApi';
import type {
  CreateExecDigestInput,
  UpdateExecDigestInput,
  AddExecDigestRecipientInput,
} from '@pravado/validators';
import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
} from 'lucide-react';

export default function ExecutiveDigestPage() {
  // List state
  const [digests, setDigests] = useState<ExecDigestWithCounts[]>([]);
  const [stats, setStats] = useState<ExecDigestStats | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [selectedDigestId, setSelectedDigestId] = useState<string | null>(null);

  // Selected digest details
  const [digestDetails, setDigestDetails] = useState<GetExecDigestResponse | null>(null);
  const [deliveryLogs, setDeliveryLogs] = useState<ExecDigestDeliveryLog[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Action states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load digests list
  const loadDigests = useCallback(async () => {
    setListLoading(true);
    setError(null);

    try {
      const [digestsResponse, statsResponse] = await Promise.all([
        listDigests({ includeArchived: false }),
        getDigestStats(),
      ]);

      setDigests(digestsResponse.digests);
      setStats(statsResponse);

      // Auto-select first digest if none selected
      if (!selectedDigestId && digestsResponse.digests.length > 0) {
        setSelectedDigestId(digestsResponse.digests[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load digests');
    } finally {
      setListLoading(false);
    }
  }, [selectedDigestId]);

  // Load selected digest details
  const loadDigestDetails = useCallback(async (digestId: string) => {
    setDetailsLoading(true);
    setError(null);

    try {
      const [details, logs] = await Promise.all([
        getDigest(digestId),
        listDeliveryLogs(digestId, { limit: 10 }),
      ]);

      setDigestDetails(details);
      setDeliveryLogs(logs.deliveryLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load digest details');
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDigests();
  }, [loadDigests]);

  // Load details when selection changes
  useEffect(() => {
    if (selectedDigestId) {
      loadDigestDetails(selectedDigestId);
    }
  }, [selectedDigestId, loadDigestDetails]);

  // Create digest
  const handleCreateDigest = async (values: CreateExecDigestInput | UpdateExecDigestInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const newDigest = await createDigest(values as CreateExecDigestInput);
      await loadDigests();
      setSelectedDigestId(newDigest.id);
      setCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create digest');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update digest
  const handleUpdateDigest = async (values: CreateExecDigestInput | UpdateExecDigestInput) => {
    if (!selectedDigestId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await updateDigest(selectedDigestId, values as UpdateExecDigestInput);
      await loadDigests();
      await loadDigestDetails(selectedDigestId);
      setEditDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update digest');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete digest
  const handleDeleteDigest = async () => {
    if (!selectedDigestId) return;

    if (!confirm('Are you sure you want to delete this digest?')) return;

    try {
      await deleteDigest(selectedDigestId);
      setSelectedDigestId(null);
      setDigestDetails(null);
      await loadDigests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete digest');
    }
  };

  // Archive digest
  const handleArchiveDigest = async () => {
    if (!selectedDigestId) return;

    try {
      await updateDigest(selectedDigestId, { isArchived: true, isActive: false });
      setSelectedDigestId(null);
      setDigestDetails(null);
      await loadDigests();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive digest');
    }
  };

  // Toggle active
  const handleToggleActive = async () => {
    if (!selectedDigestId || !digestDetails) return;

    try {
      await updateDigest(selectedDigestId, { isActive: !digestDetails.digest.isActive });
      await loadDigests();
      await loadDigestDetails(selectedDigestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle digest status');
    }
  };

  // Generate digest
  const handleGenerate = async () => {
    if (!selectedDigestId) return;

    setIsGenerating(true);
    setError(null);

    try {
      await generateDigest(selectedDigestId, { forceRegenerate: true, generatePdf: true });
      await loadDigestDetails(selectedDigestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate digest');
    } finally {
      setIsGenerating(false);
    }
  };

  // Deliver digest
  const handleDeliver = async () => {
    if (!selectedDigestId) return;

    if (!confirm('Send this digest to all active recipients?')) return;

    setIsDelivering(true);
    setError(null);

    try {
      await deliverDigest(selectedDigestId, { regeneratePdf: true });
      await loadDigestDetails(selectedDigestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to deliver digest');
    } finally {
      setIsDelivering(false);
    }
  };

  // Add recipient
  const handleAddRecipient = async (data: AddExecDigestRecipientInput) => {
    if (!selectedDigestId) return;

    try {
      await addRecipient(selectedDigestId, data);
      await loadDigestDetails(selectedDigestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add recipient');
      throw err;
    }
  };

  // Remove recipient
  const handleRemoveRecipient = async (recipientId: string) => {
    if (!selectedDigestId) return;

    try {
      await removeRecipient(selectedDigestId, recipientId);
      await loadDigestDetails(selectedDigestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove recipient');
    }
  };

  // Toggle recipient active
  const handleToggleRecipientActive = async (recipientId: string, isActive: boolean) => {
    if (!selectedDigestId) return;

    try {
      await updateRecipient(selectedDigestId, recipientId, { isActive });
      await loadDigestDetails(selectedDigestId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update recipient');
    }
  };

  // Download PDF
  const handleDownloadPdf = () => {
    if (digestDetails?.digest.pdfStoragePath) {
      // The PDF URL would be constructed from the storage path
      // In production, this would be a signed URL from Supabase storage
      window.open(digestDetails.digest.pdfStoragePath, '_blank');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white-0">Executive Digests</h1>
          <p className="text-sm text-muted mt-1">
            Automated strategic briefs and weekly executive reports
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Digest
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert-error flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Overview */}
      {stats && <ExecDigestStatsCard stats={stats} isLoading={listLoading} />}

      {/* Main Content */}
      <div className="grid grid-cols-12 gap-6">
        {/* Digest List - Left Sidebar */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand-iris" />
                Digests ({digests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {listLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-6" />
                </div>
              ) : digests.length === 0 ? (
                <div className="text-center py-8 text-muted">
                  <FileText className="h-12 w-12 text-slate-6 mx-auto mb-4" />
                  <p>No digests created yet.</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Digest
                  </Button>
                </div>
              ) : (
                digests.map((digest) => (
                  <ExecDigestCard
                    key={digest.id}
                    digest={digest}
                    isSelected={selectedDigestId === digest.id}
                    onSelect={(d) => setSelectedDigestId(d.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Digest Details - Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {detailsLoading ? (
            <Card className="p-8">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
              </div>
            </Card>
          ) : !digestDetails ? (
            <Card className="p-8">
              <div className="text-center text-muted">
                <FileText className="h-12 w-12 text-slate-6 mx-auto mb-4" />
                <p>Select a digest to view details</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Digest Header */}
              <Card>
                <CardContent className="p-6">
                  <ExecDigestHeader
                    digest={digestDetails.digest}
                    isGenerating={isGenerating}
                    isDelivering={isDelivering}
                    onGenerate={handleGenerate}
                    onDeliver={handleDeliver}
                    onDownloadPdf={handleDownloadPdf}
                    onEdit={() => setEditDialogOpen(true)}
                    onArchive={handleArchiveDigest}
                    onDelete={handleDeleteDigest}
                    onToggleActive={handleToggleActive}
                  />
                </CardContent>
              </Card>

              {/* Tabbed Content */}
              <Tabs defaultValue="sections">
                <TabsList>
                  <TabsTrigger value="sections">
                    Sections ({digestDetails.sections.length})
                  </TabsTrigger>
                  <TabsTrigger value="recipients">
                    Recipients ({digestDetails.recipients.length})
                  </TabsTrigger>
                  <TabsTrigger value="history">
                    Delivery History ({deliveryLogs.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="sections" className="mt-4">
                  <ExecDigestSectionList sections={digestDetails.sections} />
                </TabsContent>

                <TabsContent value="recipients" className="mt-4">
                  <ExecDigestRecipientList
                    recipients={digestDetails.recipients}
                    onAdd={handleAddRecipient}
                    onRemove={handleRemoveRecipient}
                    onToggleActive={handleToggleRecipientActive}
                  />
                </TabsContent>

                <TabsContent value="history" className="mt-4">
                  <ExecDigestDeliveryHistory deliveryLogs={deliveryLogs} />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </div>

      {/* Create Digest Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Executive Digest</DialogTitle>
            <DialogDescription>
              Configure a new automated digest for executive stakeholders.
            </DialogDescription>
          </DialogHeader>
          <ExecDigestForm
            onSubmit={handleCreateDigest}
            onCancel={() => setCreateDialogOpen(false)}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Digest Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Digest Settings</DialogTitle>
            <DialogDescription>
              Update the configuration for this digest.
            </DialogDescription>
          </DialogHeader>
          {digestDetails && (
            <ExecDigestForm
              initialValues={digestDetails.digest}
              isEditing
              onSubmit={handleUpdateDigest}
              onCancel={() => setEditDialogOpen(false)}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
