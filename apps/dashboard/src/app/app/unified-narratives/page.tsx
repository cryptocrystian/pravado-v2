/**
 * Unified Narratives Dashboard Page (Sprint S70)
 *
 * Cross-domain Synthesis Engine - generates multi-layer narrative documents
 * from all intelligence systems.
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  BookOpen,
  Loader2,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  NarrativeCard,
  NarrativeFiltersBar,
  NarrativeGeneratorForm,
  NarrativeDetailDrawer,
} from '@/components/unified-narratives';
import type { NarrativeFilters, NarrativeFormData } from '@/components/unified-narratives';
import * as narrativeApi from '@/lib/unifiedNarrativeApi';
import type {
  UnifiedNarrative,
  UnifiedNarrativeSection,
  NarrativeInsight,
  NarrativeStats,
} from '@/lib/unifiedNarrativeApi';

export default function UnifiedNarrativesPage() {
  // Main data state
  const [narratives, setNarratives] = useState<UnifiedNarrative[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<UnifiedNarrative | null>(null);
  const [selectedSections, setSelectedSections] = useState<UnifiedNarrativeSection[]>([]);
  const [selectedInsights, setSelectedInsights] = useState<NarrativeInsight[]>([]);
  const [stats, setStats] = useState<NarrativeStats | null>(null);
  const [total, setTotal] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UI states
  const [error, setError] = useState<string | null>(null);
  const [showGenerator, setShowGenerator] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters (NarrativeFiltersBar includes search)
  const [filters, setFilters] = useState<NarrativeFilters>({
    search: '',
    status: undefined,
    narrativeType: undefined,
    sortBy: 'updated_at',
    sortOrder: 'desc',
  });

  // Load narratives on filter change
  useEffect(() => {
    loadNarratives();
  }, [filters]);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadNarratives = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await narrativeApi.listNarratives({
        search: filters.search || undefined,
        status: filters.status,
        narrativeType: filters.narrativeType,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        limit: 50,
      });

      setNarratives(result.narratives);
      setTotal(result.total);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load narratives';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await narrativeApi.getNarrativeStats();
      setStats(result);
    } catch (err: unknown) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadNarrativeDetails = async (narrativeId: string) => {
    try {
      setIsLoadingDetails(true);

      const [details, insightsResult] = await Promise.all([
        narrativeApi.getNarrative(narrativeId),
        narrativeApi.getInsights(narrativeId, { limit: 50 }),
      ]);

      setSelectedNarrative(details.narrative);
      setSelectedSections(details.sections);
      setSelectedInsights(insightsResult.insights);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load narrative details';
      setError(message);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleSelectNarrative = async (narrative: UnifiedNarrative) => {
    setDrawerOpen(true);
    await loadNarrativeDetails(narrative.id);
  };

  const handleCreateNarrative = async (formData: NarrativeFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const narrative = await narrativeApi.createNarrative({
        title: formData.title,
        subtitle: formData.subtitle,
        narrativeType: formData.narrativeType,
        format: formData.format,
        periodStart: formData.periodStart,
        periodEnd: formData.periodEnd,
        sourceSystems: formData.sourceSystems,
        tags: formData.tags,
        targetAudience: formData.targetAudience,
      });

      // Generate immediately if requested
      if (formData.generateImmediately) {
        await narrativeApi.generateNarrative(narrative.id, {});
      }

      setShowGenerator(false);
      await loadNarratives();
      await loadStats();

      // Open the new narrative
      await handleSelectNarrative(narrative);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create narrative';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (comments?: string) => {
    if (!selectedNarrative) return;
    try {
      const updated = await narrativeApi.approveNarrative(selectedNarrative.id, {
        approvalNote: comments,
      });
      setSelectedNarrative(updated);
      await loadNarratives();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve narrative';
      setError(message);
    }
  };

  const handlePublish = async () => {
    if (!selectedNarrative) return;
    try {
      const updated = await narrativeApi.publishNarrative(selectedNarrative.id, {});
      setSelectedNarrative(updated);
      await loadNarratives();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to publish narrative';
      setError(message);
    }
  };

  const handleArchive = async (reason?: string) => {
    if (!selectedNarrative) return;
    try {
      const updated = await narrativeApi.archiveNarrative(selectedNarrative.id, reason);
      setSelectedNarrative(updated);
      await loadNarratives();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to archive narrative';
      setError(message);
    }
  };

  const handleRegenerate = async () => {
    if (!selectedNarrative) return;
    try {
      await narrativeApi.generateNarrative(selectedNarrative.id, {});
      await loadNarrativeDetails(selectedNarrative.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate narrative';
      setError(message);
    }
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'pptx' | 'html' | 'md' | 'json') => {
    if (!selectedNarrative) return;
    try {
      const result = await narrativeApi.exportNarrative(selectedNarrative.id, { format });
      // Open the export URL in a new tab
      window.open(result.url, '_blank');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to export narrative';
      setError(message);
    }
  };

  const handleUpdateSection = async (sectionId: string, content: string) => {
    if (!selectedNarrative) return;
    try {
      await narrativeApi.updateSection(selectedNarrative.id, sectionId, { contentMd: content });
      await loadNarrativeDetails(selectedNarrative.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update section';
      setError(message);
    }
  };

  const handleRegenerateSection = async (sectionId: string) => {
    if (!selectedNarrative) return;
    try {
      await narrativeApi.regenerateSection(selectedNarrative.id, sectionId, {});
      await loadNarrativeDetails(selectedNarrative.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate section';
      setError(message);
    }
  };

  const handleComputeDelta = async () => {
    if (!selectedNarrative?.previousNarrativeId) return;
    try {
      await narrativeApi.computeDelta(selectedNarrative.id, {
        previousNarrativeId: selectedNarrative.previousNarrativeId,
      });
      await loadNarrativeDetails(selectedNarrative.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to compute delta';
      setError(message);
    }
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedNarrative(null);
    setSelectedSections([]);
    setSelectedInsights([]);
  };

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-white-0">
              <div className="w-12 h-12 rounded-xl bg-brand-iris/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-brand-iris" />
              </div>
              Unified Narratives
            </h1>
            <p className="text-muted mt-2">
              Cross-domain synthesis engine for multi-layer narrative documents
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={loadNarratives}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowGenerator(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Narrative
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert-error flex items-start gap-2 mb-6">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Stats Row */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Card className="panel-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-2xl font-bold text-white-0">{stats.totalNarratives}</p>
                <p className="text-xs text-muted">Total Narratives</p>
              </CardContent>
            </Card>
            <Card className="panel-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-2xl font-bold text-brand-amber">{stats.byStatus?.draft || 0}</p>
                <p className="text-xs text-muted">Drafts</p>
              </CardContent>
            </Card>
            <Card className="panel-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-2xl font-bold text-brand-cyan">{stats.byStatus?.review || 0}</p>
                <p className="text-xs text-muted">In Review</p>
              </CardContent>
            </Card>
            <Card className="panel-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-2xl font-bold text-semantic-success">{stats.byStatus?.approved || 0}</p>
                <p className="text-xs text-muted">Approved</p>
              </CardContent>
            </Card>
            <Card className="panel-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-2xl font-bold text-brand-magenta">{stats.byStatus?.published || 0}</p>
                <p className="text-xs text-muted">Published</p>
              </CardContent>
            </Card>
            <Card className="panel-card">
              <CardContent className="pt-4 pb-3 px-4">
                <p className="text-2xl font-bold text-slate-6">{stats.byStatus?.archived || 0}</p>
                <p className="text-xs text-muted">Archived</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6">
          <NarrativeFiltersBar
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Narratives Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-brand-cyan" />
          </div>
        ) : narratives.length === 0 ? (
          <Card className="panel-card">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-iris/10 flex items-center justify-center">
                <BookOpen className="h-8 w-8 text-brand-iris" />
              </div>
              <h3 className="text-lg font-semibold text-white-0 mb-2">
                No Narratives Found
              </h3>
              <p className="text-muted mb-4">
                {filters.search || filters.status || filters.narrativeType
                  ? 'No narratives match your current filters.'
                  : 'Get started by creating your first unified narrative.'}
              </p>
              <Button onClick={() => setShowGenerator(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Narrative
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted">
                Showing {narratives.length} of {total} narratives
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {narratives.map((narrative) => (
                <NarrativeCard
                  key={narrative.id}
                  narrative={narrative}
                  onSelect={handleSelectNarrative}
                />
              ))}
            </div>
          </>
        )}

        {/* Generator Form Modal */}
        {showGenerator && (
          <div className="fixed inset-0 bg-slate-0/80 flex items-center justify-center z-50 p-4">
            <div className="panel-card max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b border-border-subtle flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white-0">Create Unified Narrative</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGenerator(false)}
                >
                  Close
                </Button>
              </div>
              <div className="p-4">
                <NarrativeGeneratorForm
                  onSubmit={handleCreateNarrative}
                  isSubmitting={isSubmitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Detail Drawer */}
        <NarrativeDetailDrawer
          narrative={selectedNarrative}
          sections={selectedSections}
          insights={selectedInsights}
          isOpen={drawerOpen}
          onClose={handleCloseDrawer}
          onApprove={handleApprove}
          onPublish={handlePublish}
          onArchive={handleArchive}
          onRegenerate={handleRegenerate}
          onExport={handleExport}
          onUpdateSection={handleUpdateSection}
          onRegenerateSection={handleRegenerateSection}
          onComputeDelta={handleComputeDelta}
          isLoading={isLoadingDetails}
        />
      </div>
    </div>
  );
}
