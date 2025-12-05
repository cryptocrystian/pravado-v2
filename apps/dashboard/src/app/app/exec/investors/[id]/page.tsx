/**
 * Investor Pack Detail Page (Sprint S64)
 * View and edit individual investor pack with sections and Q&A
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  InvestorPackHeader,
  InvestorPackSectionCard,
  InvestorQnACard,
  InvestorPackAuditLogComponent,
} from '@/components/investor-relations';
import {
  type InvestorPack,
  type InvestorPackSection,
  type InvestorQnA,
  type InvestorPackAuditLog,
  getPack,
  generatePack,
  updateSection,
  regenerateSection,
  updateQnA,
  deleteQnA,
  approveQnA,
  generateQnAs,
  approvePack,
  publishPack,
  listAuditLogs,
  getSectionTypeLabel,
} from '@/lib/investorRelationsApi';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
  HelpCircle,
  History,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function InvestorPackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params?.id as string;

  const [pack, setPack] = useState<InvestorPack | null>(null);
  const [sections, setSections] = useState<InvestorPackSection[]>([]);
  const [qnas, setQnas] = useState<InvestorQnA[]>([]);
  const [auditLogs, setAuditLogs] = useState<InvestorPackAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingQnAs, setIsGeneratingQnAs] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const [activeTab, setActiveTab] = useState('sections');

  const fetchPack = useCallback(async () => {
    if (!packId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [packResult, logsResult] = await Promise.all([
        getPack(packId),
        listAuditLogs({ packId, limit: 50, offset: 0 }),
      ]);

      // getPack returns InvestorPackWithSections which extends InvestorPack
      setPack(packResult);
      setSections(packResult.sections || []);
      setQnas(packResult.qnas || []);
      setAuditLogs(logsResult.logs || []);
    } catch (err) {
      console.error('Failed to fetch pack:', err);
      setError('Failed to load investor pack. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [packId]);

  useEffect(() => {
    fetchPack();
  }, [fetchPack]);

  const handleGeneratePack = async () => {
    if (!pack) return;
    setIsGenerating(true);

    try {
      const result = await generatePack(pack.id);
      setPack(result.pack);
      setSections(result.sections);
      // Refresh audit logs
      const logs = await listAuditLogs({ packId: pack.id, limit: 50, offset: 0 });
      setAuditLogs(logs.logs || []);
    } catch (err) {
      console.error('Failed to generate pack:', err);
      setError('Failed to generate pack content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateSection = async (sectionId: string, contentMd: string) => {
    const result = await updateSection(packId, sectionId, { contentMd });
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? result : s))
    );
  };

  const handleRegenerateSection = async (sectionId: string) => {
    const result = await regenerateSection(packId, sectionId);
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? result : s))
    );
  };

  const handleGenerateQnAs = async () => {
    if (!pack) return;
    setIsGeneratingQnAs(true);

    try {
      const result = await generateQnAs({ packId: pack.id, count: 5 });
      const newQnas = result.qnas || [];
      setQnas((prev) => [...prev, ...newQnas]);
      // Refresh audit logs
      const logs = await listAuditLogs({ packId: pack.id, limit: 50, offset: 0 });
      setAuditLogs(logs.logs || []);
    } catch (err) {
      console.error('Failed to generate Q&As:', err);
      setError('Failed to generate Q&As. Please try again.');
    } finally {
      setIsGeneratingQnAs(false);
    }
  };

  const handleUpdateQnA = async (qnaId: string, question: string, answerMd: string) => {
    const result = await updateQnA(qnaId, { question, answerMd });
    setQnas((prev) =>
      prev.map((q) => (q.id === qnaId ? result : q))
    );
  };

  const handleApproveQnA = async (qnaId: string) => {
    const result = await approveQnA(qnaId);
    setQnas((prev) =>
      prev.map((q) => (q.id === qnaId ? result : q))
    );
  };

  const handleDeleteQnA = async (qnaId: string) => {
    await deleteQnA(qnaId);
    setQnas((prev) => prev.filter((q) => q.id !== qnaId));
  };

  const handleApprovePack = async () => {
    if (!pack) return;
    setIsApproving(true);

    try {
      const result = await approvePack(pack.id);
      setPack(result);
      // Refresh audit logs
      const logs = await listAuditLogs({ packId: pack.id, limit: 50, offset: 0 });
      setAuditLogs(logs.logs || []);
    } catch (err) {
      console.error('Failed to approve pack:', err);
      setError('Failed to approve pack. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handlePublishPack = async () => {
    if (!pack) return;
    setIsPublishing(true);

    try {
      const result = await publishPack(pack.id);
      setPack(result.pack);
      // Refresh audit logs
      const logs = await listAuditLogs({ packId: pack.id, limit: 50, offset: 0 });
      setAuditLogs(logs.logs || []);
    } catch (err) {
      console.error('Failed to publish pack:', err);
      setError('Failed to publish pack. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading investor pack...</p>
        </div>
      </div>
    );
  }

  if (error && !pack) {
    return (
      <div className="container mx-auto py-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-red-900 mb-2">Error Loading Pack</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => router.push('/app/exec/investors')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <Button onClick={fetchPack}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!pack) return null;

  // Group sections by type
  const sectionsByType = sections.reduce((acc, section) => {
    if (!acc[section.sectionType]) {
      acc[section.sectionType] = [];
    }
    acc[section.sectionType].push(section);
    return acc;
  }, {} as Record<string, InvestorPackSection[]>);

  // Group Q&As by status
  const draftQnas = qnas.filter((q) => q.status === 'draft');
  const approvedQnas = qnas.filter((q) => q.status === 'approved');

  const canGenerate = pack.status === 'draft';
  const canApprove = pack.status === 'review';
  const canPublish = pack.status === 'approved';

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link
          href="/app/exec/investors"
          className="hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          Investor Relations
        </Link>
        <span>/</span>
        <span className="text-gray-900">{pack.title}</span>
      </div>

      {/* Error Banner */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-700">{error}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pack Header */}
      <InvestorPackHeader
        pack={pack}
        onGenerate={canGenerate ? handleGeneratePack : undefined}
        onApprove={canApprove ? handleApprovePack : undefined}
        onPublish={canPublish ? handlePublishPack : undefined}
        isGenerating={isGenerating}
        isApproving={isApproving}
        isPublishing={isPublishing}
      />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sections" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Sections
            <Badge variant="secondary">{sections.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="qna" className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Q&A
            <Badge variant="secondary">{qnas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Activity
            <Badge variant="secondary">{auditLogs.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Sections Tab */}
        <TabsContent value="sections" className="mt-6">
          {sections.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sections Yet</h3>
                <p className="text-gray-500 mb-4">
                  Generate content for this investor pack to create sections
                </p>
                {canGenerate && (
                  <Button onClick={handleGeneratePack} disabled={isGenerating}>
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Content
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {pack.sectionTypes.map((sectionType) => {
                const typeSections = sectionsByType[sectionType] || [];
                if (typeSections.length === 0) return null;

                return (
                  <div key={sectionType}>
                    <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                      {getSectionTypeLabel(sectionType)}
                      <Badge variant="secondary" className="text-xs">
                        {typeSections.length}
                      </Badge>
                    </h3>
                    <div className="space-y-4">
                      {typeSections.map((section) => (
                        <InvestorPackSectionCard
                          key={section.id}
                          section={section}
                          onUpdate={(content) => handleUpdateSection(section.id, content)}
                          onRegenerate={() => handleRegenerateSection(section.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Q&A Tab */}
        <TabsContent value="qna" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Investor Q&A ({qnas.length})
              </h3>
              <p className="text-sm text-gray-500">
                Anticipated questions and prepared answers for investor discussions
              </p>
            </div>
            <Button
              onClick={handleGenerateQnAs}
              disabled={isGeneratingQnAs}
              variant="outline"
            >
              {isGeneratingQnAs ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Q&As
                </>
              )}
            </Button>
          </div>

          {qnas.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Q&A Yet</h3>
                <p className="text-gray-500 mb-4">
                  Generate Q&A entries to prepare for investor discussions
                </p>
                <Button
                  onClick={handleGenerateQnAs}
                  disabled={isGeneratingQnAs}
                >
                  {isGeneratingQnAs ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Q&As
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Draft Q&As */}
              {draftQnas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
                      Draft
                    </Badge>
                    {draftQnas.length} questions pending review
                  </h4>
                  <div className="space-y-3">
                    {draftQnas.map((qna) => (
                      <InvestorQnACard
                        key={qna.id}
                        qna={qna}
                        onUpdate={(q, a) => handleUpdateQnA(qna.id, q, a)}
                        onApprove={() => handleApproveQnA(qna.id)}
                        onDelete={() => handleDeleteQnA(qna.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Approved Q&As */}
              {approvedQnas.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Approved
                    </Badge>
                    {approvedQnas.length} questions ready
                  </h4>
                  <div className="space-y-3">
                    {approvedQnas.map((qna) => (
                      <InvestorQnACard
                        key={qna.id}
                        qna={qna}
                        onUpdate={(q, a) => handleUpdateQnA(qna.id, q, a)}
                        onDelete={() => handleDeleteQnA(qna.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-6">
          <InvestorPackAuditLogComponent auditLogs={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
