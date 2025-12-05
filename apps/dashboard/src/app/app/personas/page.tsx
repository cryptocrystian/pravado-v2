/**
 * Personas Dashboard Page (Sprint S51.2)
 * Three-panel layout for persona management
 */

'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PersonaCard } from '@/components/personas/PersonaCard';
import { PersonaTraitChips } from '@/components/personas/PersonaTraitChips';
import { InsightPanel } from '@/components/personas/InsightPanel';
import { PersonaHistoryTimeline } from '@/components/personas/PersonaHistoryTimeline';
import { PersonaComparisonDrawer } from '@/components/personas/PersonaComparisonDrawer';
import { PersonaGeneratorForm } from '@/components/personas/PersonaGeneratorForm';
import { PersonaEditor } from '@/components/personas/PersonaEditor';
import type {
  AudiencePersona,
  AudiencePersonaTrait,
  AudiencePersonaInsight,
  AudiencePersonaHistory,
  PersonaComparisonResult,
  GenerationContext,
  UpdatePersonaInput,
  PersonasQuery,
} from '@pravado/types';
import * as personaApi from '@/lib/personaApi';
import {
  AlertCircle,
  GitCompare,
  Loader2,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useState, useEffect } from 'react';

export default function PersonasPage() {
  // State
  const [personas, setPersonas] = useState<AudiencePersona[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<AudiencePersona | null>(null);
  const [traits, setTraits] = useState<AudiencePersonaTrait[]>([]);
  const [insights, setInsights] = useState<AudiencePersonaInsight[]>([]);
  const [history, setHistory] = useState<AudiencePersonaHistory[]>([]);
  const [comparison, setComparison] = useState<PersonaComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI State
  const [showGenerator, setShowGenerator] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [personaTypeFilter, _setPersonaTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [sortBy, setSortBy] = useState<'overallScore' | 'relevanceScore' | 'updatedAt'>('overallScore');

  // Load personas
  useEffect(() => {
    loadPersonas();
  }, [searchQuery, personaTypeFilter, statusFilter, sortBy]);

  // Load selected persona details
  useEffect(() => {
    if (selectedPersonaId) {
      loadPersonaDetails(selectedPersonaId);
    }
  }, [selectedPersonaId]);

  const loadPersonas = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const query: PersonasQuery = {
        searchQuery: searchQuery || undefined,
        personaType: personaTypeFilter !== 'all' ? [personaTypeFilter as any] : undefined,
        status: statusFilter !== 'all' ? [statusFilter as any] : undefined,
        sortBy: sortBy as any,
        sortOrder: 'desc',
      };

      const result = await personaApi.listPersonas(query);
      setPersonas(result.personas);

      // Auto-select first persona if none selected
      if (!selectedPersonaId && result.personas.length > 0) {
        setSelectedPersonaId(result.personas[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load personas');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPersonaDetails = async (personaId: string) => {
    try {
      const [detail, insightsData, historyData] = await Promise.all([
        personaApi.getPersona(personaId),
        personaApi.getPersonaInsights(personaId, {}),
        personaApi.getPersonaHistory(personaId, {}),
      ]);

      setSelectedPersona(detail.persona);
      setTraits(detail.traits);
      setInsights(insightsData.insights);
      setHistory(historyData.history);
    } catch (err: any) {
      setError(err.message || 'Failed to load persona details');
    }
  };

  const handleGenerate = async (context: GenerationContext) => {
    setIsGenerating(true);
    try {
      const result = await personaApi.generatePersona(context);
      setShowGenerator(false);
      await loadPersonas();
      setSelectedPersonaId(result.persona.id);
    } catch (err: any) {
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdate = async (updates: UpdatePersonaInput) => {
    if (!selectedPersonaId) return;

    setIsSaving(true);
    try {
      await personaApi.updatePersona(selectedPersonaId, updates);
      setShowEditor(false);
      await loadPersonas();
      await loadPersonaDetails(selectedPersonaId);
    } catch (err: any) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCompare = async (personaId2: string) => {
    if (!selectedPersonaId) return;

    try {
      const result = await personaApi.comparePersonas(selectedPersonaId, personaId2);
      setComparison(result.comparison);
      setShowComparison(true);
    } catch (err: any) {
      setError(err.message || 'Failed to compare personas');
    }
  };

  const handleMerge = async (sourceId: string, targetId: string) => {
    try {
      await personaApi.mergePersonas({
        sourcePersonaId: sourceId,
        targetPersonaId: targetId,
        mergeTraits: true,
        mergeInsights: true,
        archiveSource: true,
      });
      setShowComparison(false);
      await loadPersonas();
      setSelectedPersonaId(targetId);
    } catch (err: any) {
      throw err;
    }
  };

  // Calculate counts for selected persona
  const traitCount = traits.length;
  const insightCount = insights.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Audience Personas</h1>
            <p className="text-gray-600 mt-1">
              Build and manage audience intelligence with AI-powered insights
            </p>
          </div>
          <Button onClick={() => setShowGenerator(true)}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Persona
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded mb-6">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Three-Panel Layout */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT PANEL: Persona List */}
          <div className="col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h2 className="font-semibold">Personas</h2>
                  <Badge variant="secondary" className="ml-auto">
                    {personas.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search personas..."
                    className="pl-8"
                  />
                </div>

                {/* Filters */}
                <div className="space-y-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overallScore">Sort by Score</SelectItem>
                      <SelectItem value="relevanceScore">Sort by Relevance</SelectItem>
                      <SelectItem value="updatedAt">Sort by Updated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Persona Cards */}
                <div className="space-y-2 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                  ) : personas.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">No personas found</p>
                    </div>
                  ) : (
                    personas.map((persona) => (
                      <PersonaCard
                        key={persona.id}
                        persona={persona}
                        onClick={() => setSelectedPersonaId(persona.id)}
                        isSelected={selectedPersonaId === persona.id}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CENTER PANEL: Persona Details */}
          <div className="col-span-6 space-y-4">
            {selectedPersona ? (
              <>
                {/* Persona Header */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold">
                          {personaApi.formatPersonaName(selectedPersona)}
                        </h2>
                        {selectedPersona.description && (
                          <p className="text-gray-600 mt-1">{selectedPersona.description}</p>
                        )}
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setShowEditor(true)}>
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="traits">
                  <TabsList className="w-full">
                    <TabsTrigger value="traits" className="flex-1">
                      Traits ({traitCount})
                    </TabsTrigger>
                    <TabsTrigger value="insights" className="flex-1">
                      Insights ({insightCount})
                    </TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">
                      History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="traits" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        <PersonaTraitChips traits={traits} />
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="insights" className="mt-4">
                    <InsightPanel insights={insights} />
                  </TabsContent>

                  <TabsContent value="history" className="mt-4">
                    <Card>
                      <CardContent className="p-4">
                        <PersonaHistoryTimeline history={history} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a persona to view details</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT PANEL: Quick Actions & Stats */}
          <div className="col-span-3 space-y-4">
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
                  New Persona
                </Button>
                {selectedPersona && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => setShowEditor(true)}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Edit Persona
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        const otherPersona = personas.find((p) => p.id !== selectedPersonaId);
                        if (otherPersona) handleCompare(otherPersona.id);
                      }}
                      disabled={personas.length < 2}
                    >
                      <GitCompare className="h-4 w-4 mr-2" />
                      Compare
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader className="pb-3">
                <h3 className="font-semibold text-sm">Statistics</h3>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Personas</span>
                  <span className="font-semibold">{personas.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="font-semibold text-green-600">
                    {personas.filter((p) => p.status === 'active').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Validated</span>
                  <span className="font-semibold text-blue-600">
                    {personas.filter((p) => p.isValidated).length}
                  </span>
                </div>
                {selectedPersona && (
                  <>
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Traits</span>
                        <span className="font-semibold">{traitCount}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm text-gray-600">Insights</span>
                        <span className="font-semibold">{insightCount}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Generator Modal */}
        {showGenerator && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="text-xl font-semibold">Generate New Persona</h2>
                <Button variant="ghost" size="sm" onClick={() => setShowGenerator(false)}>
                  Close
                </Button>
              </div>
              <div className="p-4">
                <PersonaGeneratorForm onGenerate={handleGenerate} isGenerating={isGenerating} />
              </div>
            </div>
          </div>
        )}

        {/* Editor Modal */}
        {showEditor && selectedPersona && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">Edit Persona</h2>
              </div>
              <div className="p-4">
                <PersonaEditor
                  persona={selectedPersona}
                  onSave={handleUpdate}
                  onCancel={() => setShowEditor(false)}
                  isSaving={isSaving}
                />
              </div>
            </div>
          </div>
        )}

        {/* Comparison Drawer */}
        <PersonaComparisonDrawer
          comparison={comparison}
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          onMerge={handleMerge}
        />
      </div>
    </div>
  );
}
