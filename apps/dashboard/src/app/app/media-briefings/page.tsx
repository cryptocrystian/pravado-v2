/**
 * Media Briefings Dashboard Page (Sprint S54)
 *
 * Three-panel layout for media briefing management with
 * list, detail editor, and insights panel
 */

'use client';

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
  MessageSquare,
  Layers,
  CheckCircle,
  Archive,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BriefingCard,
  BriefingEditor,
  BriefingGenerationForm,
  BriefingDetailDrawer,
  InsightPanel,
} from '@/components/media-briefings';
import type {
  MediaBriefing,
  BriefingInsight,
  BriefingStatus,
  BriefFormatType,
  TalkingPointCategory,
  CreateBriefingRequest,
} from '@pravado/types';
import * as briefingApi from '@/lib/mediaBriefingApi';

export default function MediaBriefingsPage() {
  // Data State
  const [briefings, setBriefings] = useState<MediaBriefing[]>([]);
  const [selectedBriefingId, setSelectedBriefingId] = useState<string | null>(null);
  const [selectedBriefing, setSelectedBriefing] = useState<MediaBriefing | null>(null);
  const [insights, setInsights] = useState<BriefingInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showGenerator, setShowGenerator] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [regeneratingSectionId, setRegeneratingSectionId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<BriefingStatus | 'all'>('all');
  const [formatFilter, setFormatFilter] = useState<BriefFormatType | 'all'>('all');
  const [sortBy, _setSortBy] = useState<'updatedAt' | 'createdAt' | 'confidenceScore'>('updatedAt');

  // Pagination
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Load briefings
  useEffect(() => {
    loadBriefings();
  }, [searchQuery, statusFilter, formatFilter, sortBy, offset]);

  // Load selected briefing details
  useEffect(() => {
    if (selectedBriefingId) {
      loadBriefingDetails(selectedBriefingId);
    } else {
      setSelectedBriefing(null);
      setInsights([]);
    }
  }, [selectedBriefingId]);

  const loadBriefings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const filters = {
        searchQuery: searchQuery || undefined,
        status: statusFilter !== 'all' ? [statusFilter] : undefined,
        format: formatFilter !== 'all' ? [formatFilter] : undefined,
      };

      const result = await briefingApi.getBriefings(filters, limit, offset);
      setBriefings(result.briefings);
      setTotal(result.total);

      // Auto-select first briefing if none selected
      if (!selectedBriefingId && result.briefings.length > 0) {
        setSelectedBriefingId(result.briefings[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load briefings');
    } finally {
      setIsLoading(false);
    }
  };

  const loadBriefingDetails = async (briefingId: string) => {
    try {
      const briefing = await briefingApi.getBriefing(briefingId);
      setSelectedBriefing(briefing);

      // Insights would come from the briefing's generated insights
      // For now, we'll extract them from sections if available
      const extractedInsights: BriefingInsight[] = [];
      briefing.sections?.forEach((section) => {
        if (section.insights) {
          extractedInsights.push(...section.insights);
        }
      });
      setInsights(extractedInsights);
    } catch (err: any) {
      setError(err.message || 'Failed to load briefing details');
    }
  };

  const handleCreateBriefing = async (data: CreateBriefingRequest) => {
    setIsGenerating(true);
    try {
      const briefing = await briefingApi.createBriefing(data);
      setShowGenerator(false);
      await loadBriefings();
      setSelectedBriefingId(briefing.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create briefing');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateBriefing = async (data: Partial<MediaBriefing>) => {
    if (!selectedBriefingId) return;
    setIsSaving(true);
    try {
      await briefingApi.updateBriefing(selectedBriefingId, data);
      await loadBriefings();
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to update briefing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBriefing = async () => {
    if (!selectedBriefingId) return;
    setIsDeleting(true);
    try {
      await briefingApi.deleteBriefing(selectedBriefingId);
      setSelectedBriefingId(null);
      setShowDrawer(false);
      await loadBriefings();
    } catch (err: any) {
      setError(err.message || 'Failed to delete briefing');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGenerateBriefing = async () => {
    if (!selectedBriefingId) return;
    setIsGenerating(true);
    try {
      await briefingApi.generateBriefing(selectedBriefingId);
      await loadBriefings();
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to generate briefing');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSection = async (sectionId: string, customInstructions?: string) => {
    if (!selectedBriefingId) return;
    setRegeneratingSectionId(sectionId);
    try {
      await briefingApi.regenerateSection(selectedBriefingId, sectionId, { customInstructions });
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate section');
    } finally {
      setRegeneratingSectionId(null);
    }
  };

  const handleUpdateSection = async (sectionId: string, content: string) => {
    if (!selectedBriefingId) return;
    setIsSaving(true);
    try {
      await briefingApi.updateSection(selectedBriefingId, sectionId, { content });
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to update section');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveTalkingPoint = async (id: string) => {
    try {
      await briefingApi.approveTalkingPoint(id);
      if (selectedBriefingId) {
        await loadBriefingDetails(selectedBriefingId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve talking point');
    }
  };

  const handleDeleteTalkingPoint = async (id: string) => {
    try {
      await briefingApi.deleteTalkingPoint(id);
      if (selectedBriefingId) {
        await loadBriefingDetails(selectedBriefingId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete talking point');
    }
  };

  const handleGenerateTalkingPoints = async (category?: TalkingPointCategory) => {
    if (!selectedBriefingId) return;
    setIsGenerating(true);
    try {
      await briefingApi.generateTalkingPoints(selectedBriefingId, { category });
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to generate talking points');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviewBriefing = async () => {
    if (!selectedBriefingId) return;
    setIsSaving(true);
    try {
      await briefingApi.reviewBriefing(selectedBriefingId);
      await loadBriefings();
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to mark briefing as reviewed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApproveBriefing = async () => {
    if (!selectedBriefingId) return;
    setIsSaving(true);
    try {
      await briefingApi.approveBriefing(selectedBriefingId);
      await loadBriefings();
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to approve briefing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchiveBriefing = async () => {
    if (!selectedBriefingId) return;
    setIsSaving(true);
    try {
      await briefingApi.archiveBriefing(selectedBriefingId);
      await loadBriefings();
      await loadBriefingDetails(selectedBriefingId);
    } catch (err: any) {
      setError(err.message || 'Failed to archive briefing');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate stats
  const stats = {
    total: briefings.length,
    draft: briefings.filter((b) => b.status === 'draft').length,
    generated: briefings.filter((b) => b.status === 'generated').length,
    approved: briefings.filter((b) => b.status === 'approved').length,
    totalSections: selectedBriefing?.sections?.length || 0,
    totalTalkingPoints: selectedBriefing?.talkingPoints?.length || 0,
    approvedTalkingPoints: selectedBriefing?.talkingPoints?.filter((t) => t.isApproved).length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Media Briefings</h1>
            <p className="text-gray-600 mt-1">
              AI-powered executive briefings and talking points for media interactions
            </p>
          </div>
          <Button onClick={() => setShowGenerator(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            New Briefing
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded mb-6">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2"
              onClick={() => setError(null)}
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Three-Panel Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL: Briefing List */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold">Briefings</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {total}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setOffset(0);
                    }}
                    placeholder="Search briefings..."
                    className="pl-8"
                  />
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => {
                      setStatusFilter(v as any);
                      setOffset(0);
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <Filter className="h-3 w-3 mr-1" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="generating">Generating</SelectItem>
                      <SelectItem value="generated">Generated</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={formatFilter}
                    onValueChange={(v) => {
                      setFormatFilter(v as any);
                      setOffset(0);
                    }}
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Formats</SelectItem>
                      <SelectItem value="full_brief">Full Brief</SelectItem>
                      <SelectItem value="executive_summary">Executive Summary</SelectItem>
                      <SelectItem value="talking_points_only">Talking Points</SelectItem>
                      <SelectItem value="media_prep">Media Prep</SelectItem>
                      <SelectItem value="crisis_brief">Crisis Brief</SelectItem>
                      <SelectItem value="interview_prep">Interview Prep</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Briefing Cards */}
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : briefings.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No briefings found</p>
                      <Button
                        variant="link"
                        onClick={() => setShowGenerator(true)}
                        className="mt-2"
                      >
                        Create your first briefing
                      </Button>
                    </div>
                  ) : (
                    briefings.map((briefing) => (
                      <BriefingCard
                        key={briefing.id}
                        briefing={briefing}
                        onSelect={(b) => setSelectedBriefingId(b.id)}
                        isSelected={selectedBriefingId === briefing.id}
                        onGenerate={(b) => {
                          setSelectedBriefingId(b.id);
                          handleGenerateBriefing();
                        }}
                        className="cursor-pointer"
                      />
                    ))
                  )}
                </div>

                {/* Pagination */}
                {total > limit && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset === 0}
                      onClick={() => setOffset(Math.max(0, offset - limit))}
                    >
                      Previous
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {offset + 1}-{Math.min(offset + limit, total)} of {total}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={offset + limit >= total}
                      onClick={() => setOffset(offset + limit)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* CENTER PANEL: Briefing Editor */}
          <div className="col-span-6 space-y-4">
            {selectedBriefing ? (
              <BriefingEditor
                briefing={selectedBriefing}
                onUpdateBriefing={handleUpdateBriefing}
                onRegenerateSection={handleRegenerateSection}
                onUpdateSection={handleUpdateSection}
                onApproveTalkingPoint={handleApproveTalkingPoint}
                onDeleteTalkingPoint={handleDeleteTalkingPoint}
                onGenerateTalkingPoints={handleGenerateTalkingPoints}
                onReviewBriefing={handleReviewBriefing}
                onApproveBriefing={handleApproveBriefing}
                onArchiveBriefing={handleArchiveBriefing}
                onGenerateBriefing={handleGenerateBriefing}
                regeneratingSectionId={regeneratingSectionId}
                isGenerating={isGenerating}
                isSaving={isSaving}
              />
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a briefing to view details</p>
                  <Button
                    variant="link"
                    onClick={() => setShowGenerator(true)}
                    className="mt-2"
                  >
                    Or create a new briefing
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT PANEL: Stats & Insights */}
          <div className="col-span-3 space-y-4">
            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm">Overview</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                    <div className="text-xs text-muted-foreground">Approved</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="text-2xl font-bold text-yellow-600">{stats.draft}</div>
                    <div className="text-xs text-muted-foreground">Draft</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">{stats.generated}</div>
                    <div className="text-xs text-muted-foreground">Generated</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Selected Briefing Stats */}
            {selectedBriefing && (
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-sm">Current Briefing</h3>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <Layers className="h-3 w-3" /> Sections
                    </span>
                    <span className="font-semibold">{stats.totalSections}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> Talking Points
                    </span>
                    <span className="font-semibold">{stats.totalTalkingPoints}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Approved Points
                    </span>
                    <span className="font-semibold text-green-600">
                      {stats.approvedTalkingPoints}
                    </span>
                  </div>
                  {selectedBriefing.confidenceScore && (
                    <div className="flex items-center justify-between pt-2 border-t">
                      <span className="text-sm text-gray-600">Confidence</span>
                      <span className="font-semibold">
                        {selectedBriefing.confidenceScore.toFixed(0)}%
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm">Quick Actions</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowGenerator(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Briefing
                </Button>
                {selectedBriefing && (
                  <>
                    {selectedBriefing.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleGenerateBriefing}
                        disabled={isGenerating}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Content
                      </Button>
                    )}
                    {selectedBriefing.status !== 'archived' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={handleArchiveBriefing}
                        disabled={isSaving}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Briefing
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Insights Panel */}
            {selectedBriefing && insights.length > 0 && (
              <InsightPanel insights={insights} maxHeight="300px" />
            )}
          </div>
        </div>

        {/* Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
                <h2 className="text-xl font-semibold">Create New Briefing</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowGenerator(false)}>
                  Close
                </Button>
              </div>
              <div className="p-4">
                <BriefingGenerationForm
                  onSubmit={handleCreateBriefing}
                  onCancel={() => setShowGenerator(false)}
                  isSubmitting={isGenerating}
                />
              </div>
            </div>
          </div>
        )}

        {/* Detail Drawer */}
        <BriefingDetailDrawer
          briefing={selectedBriefing}
          insights={insights}
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          onUpdateBriefing={handleUpdateBriefing}
          onRegenerateSection={handleRegenerateSection}
          onUpdateSection={handleUpdateSection}
          onApproveTalkingPoint={handleApproveTalkingPoint}
          onDeleteTalkingPoint={handleDeleteTalkingPoint}
          onGenerateTalkingPoints={handleGenerateTalkingPoints}
          onReviewBriefing={handleReviewBriefing}
          onApproveBriefing={handleApproveBriefing}
          onArchiveBriefing={handleArchiveBriefing}
          onGenerateBriefing={handleGenerateBriefing}
          onDeleteBriefing={handleDeleteBriefing}
          regeneratingSectionId={regeneratingSectionId}
          isGenerating={isGenerating}
          isSaving={isSaving}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
