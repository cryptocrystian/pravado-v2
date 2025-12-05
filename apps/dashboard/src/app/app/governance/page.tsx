/**
 * Governance Dashboard Page (Sprint S59)
 * Executive governance, compliance & audit intelligence dashboard
 */

'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PolicyList,
  FindingsList,
  RiskScoreCard,
  ComplianceMetricsPanel,
  InsightsSummary,
  RiskHeatmap,
  RuleEditor,
  SeverityBadge,
} from '@/components/governance';
import {
  listPolicies,
  deletePolicy,
  listRules,
  createRule,
  updateRule,
  listFindings,
  acknowledgeFinding,
  resolveFinding,
  dismissFinding,
  escalateFinding,
  listRiskScores,
  getDashboardSummary,
  getComplianceMetrics,
  getRiskHeatmap,
  listInsights,
  generateInsight,
  type GovernancePolicy,
  type GovernancePoliciesQuery,
  type GovernanceRule,
  type GovernanceFinding,
  type GovernanceFindingsQuery,
  type GovernanceRiskScore,
  type GovernanceRiskScoresQuery,
  type GovernanceDashboardSummary,
  type GovernanceComplianceMetrics,
  type GovernanceRiskHeatmapResponse,
  type GovernanceAuditInsight,
  type CreateGovernanceRuleInput,
  type UpdateGovernanceRuleInput,
  formatRelativeTime,
  getCategoryLabel,
} from '@/lib/governanceApi';
import {
  Shield,
  FileText,
  AlertTriangle,
  Activity,
  Lightbulb,
  Settings,
  RefreshCw,
  Plus,
  ChevronRight,
  XCircle,
} from 'lucide-react';

type TabValue = 'overview' | 'policies' | 'findings' | 'risks' | 'insights';

export default function GovernancePage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');

  // Dashboard data
  const [dashboardSummary, setDashboardSummary] = useState<GovernanceDashboardSummary | null>(null);
  const [complianceMetrics, setComplianceMetrics] = useState<GovernanceComplianceMetrics | null>(null);
  const [riskHeatmap, setRiskHeatmap] = useState<GovernanceRiskHeatmapResponse | null>(null);

  // Policies
  const [policies, setPolicies] = useState<GovernancePolicy[]>([]);
  const [policiesTotal, setPoliciesTotal] = useState(0);
  const [policiesHasMore, setPoliciesHasMore] = useState(false);
  const [policiesQuery, setPoliciesQuery] = useState<GovernancePoliciesQuery>({ limit: 20, offset: 0 });

  // Rules
  const [rules, setRules] = useState<GovernanceRule[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<GovernancePolicy | null>(null);
  const [showRuleEditor, setShowRuleEditor] = useState(false);
  const [editingRule, setEditingRule] = useState<GovernanceRule | null>(null);

  // Findings
  const [findings, setFindings] = useState<GovernanceFinding[]>([]);
  const [findingsTotal, setFindingsTotal] = useState(0);
  const [findingsHasMore, setFindingsHasMore] = useState(false);
  const [findingsQuery, setFindingsQuery] = useState<GovernanceFindingsQuery>({ limit: 20, offset: 0 });

  // Risk Scores
  const [riskScores, setRiskScores] = useState<GovernanceRiskScore[]>([]);
  const [_riskScoresTotal, setRiskScoresTotal] = useState(0);
  const [_riskScoresHasMore, setRiskScoresHasMore] = useState(false);
  const [riskScoresQuery, _setRiskScoresQuery] = useState<GovernanceRiskScoresQuery>({ limit: 20, offset: 0, sortBy: 'overall_score', sortOrder: 'desc' });

  // Insights
  const [insights, setInsights] = useState<GovernanceAuditInsight[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [summary, metrics, heatmap, insightsData] = await Promise.all([
        getDashboardSummary(),
        getComplianceMetrics(30),
        getRiskHeatmap(),
        listInsights({ limit: 5, sortOrder: 'desc' }),
      ]);

      setDashboardSummary(summary);
      setComplianceMetrics(metrics);
      setRiskHeatmap(heatmap);
      setInsights(insightsData.insights);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load policies
  const loadPolicies = useCallback(async () => {
    try {
      const result = await listPolicies(policiesQuery);
      setPolicies(result.policies);
      setPoliciesTotal(result.total);
      setPoliciesHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load policies:', err);
    }
  }, [policiesQuery]);

  // Load findings
  const loadFindings = useCallback(async () => {
    try {
      const result = await listFindings(findingsQuery);
      setFindings(result.findings);
      setFindingsTotal(result.total);
      setFindingsHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load findings:', err);
    }
  }, [findingsQuery]);

  // Load risk scores
  const loadRiskScores = useCallback(async () => {
    try {
      const result = await listRiskScores(riskScoresQuery);
      setRiskScores(result.riskScores);
      setRiskScoresTotal(result.total);
      setRiskScoresHasMore(result.hasMore);
    } catch (err) {
      console.error('Failed to load risk scores:', err);
    }
  }, [riskScoresQuery]);

  // Load policy rules
  const loadPolicyRules = useCallback(async (policyId: string) => {
    try {
      const result = await listRules({ policyId });
      setRules(result.rules);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Load tab-specific data
  useEffect(() => {
    if (activeTab === 'policies') {
      loadPolicies();
    } else if (activeTab === 'findings') {
      loadFindings();
    } else if (activeTab === 'risks') {
      loadRiskScores();
    }
  }, [activeTab, loadPolicies, loadFindings, loadRiskScores]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Policy handlers
  const handlePolicyClick = async (policy: GovernancePolicy) => {
    setSelectedPolicy(policy);
    await loadPolicyRules(policy.id);
  };

  const handleCreatePolicy = () => {
    // TODO: Implement policy creation modal
    console.log('Create policy clicked');
  };

  const handleDeletePolicy = async (policy: GovernancePolicy) => {
    if (confirm(`Are you sure you want to delete "${policy.name}"?`)) {
      try {
        await deletePolicy(policy.id);
        await loadPolicies();
      } catch (err) {
        console.error('Failed to delete policy:', err);
      }
    }
  };

  // Rule handlers
  const handleCreateRule = () => {
    if (selectedPolicy) {
      setEditingRule(null);
      setShowRuleEditor(true);
    }
  };

  const handleEditRule = (rule: GovernanceRule) => {
    setEditingRule(rule);
    setShowRuleEditor(true);
  };

  const handleSaveRule = async (input: CreateGovernanceRuleInput | UpdateGovernanceRuleInput) => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, input as UpdateGovernanceRuleInput);
      } else {
        await createRule(input as CreateGovernanceRuleInput);
      }
      setShowRuleEditor(false);
      setEditingRule(null);
      if (selectedPolicy) {
        await loadPolicyRules(selectedPolicy.id);
      }
    } catch (err) {
      console.error('Failed to save rule:', err);
      throw err;
    }
  };

  // Finding handlers
  const handleAcknowledgeFinding = async (finding: GovernanceFinding) => {
    try {
      await acknowledgeFinding(finding.id);
      await loadFindings();
      await loadDashboardData();
    } catch (err) {
      console.error('Failed to acknowledge finding:', err);
    }
  };

  const handleResolveFinding = async (finding: GovernanceFinding) => {
    const notes = prompt('Enter resolution notes:');
    if (notes) {
      try {
        await resolveFinding(finding.id, notes);
        await loadFindings();
        await loadDashboardData();
      } catch (err) {
        console.error('Failed to resolve finding:', err);
      }
    }
  };

  const handleDismissFinding = async (finding: GovernanceFinding) => {
    const reason = prompt('Enter dismissal reason:');
    if (reason) {
      try {
        await dismissFinding(finding.id, reason);
        await loadFindings();
        await loadDashboardData();
      } catch (err) {
        console.error('Failed to dismiss finding:', err);
      }
    }
  };

  const handleEscalateFinding = async (finding: GovernanceFinding) => {
    const escalateTo = prompt('Enter user ID or email to escalate to:');
    if (escalateTo) {
      try {
        await escalateFinding(finding.id, escalateTo);
        await loadFindings();
        await loadDashboardData();
      } catch (err) {
        console.error('Failed to escalate finding:', err);
      }
    }
  };

  // Insight handlers
  const handleGenerateInsight = async () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    try {
      await generateInsight({
        timeWindowStart: thirtyDaysAgo.toISOString(),
        timeWindowEnd: now.toISOString(),
        useLlm: true,
      });
      const result = await listInsights({ limit: 5, sortOrder: 'desc' });
      setInsights(result.insights);
    } catch (err) {
      console.error('Failed to generate insight:', err);
    }
  };

  // Loading state
  if (loading && !dashboardSummary) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
          <p className="mt-4 text-gray-600">Loading governance dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !dashboardSummary) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Button onClick={loadDashboardData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            Governance & Compliance
          </h1>
          <p className="text-gray-600">
            Monitor compliance, manage policies, and track organizational risk
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Last updated: {dashboardSummary ? formatRelativeTime(dashboardSummary.lastUpdated) : 'N/A'}
          </span>
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="policies" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policies
          </TabsTrigger>
          <TabsTrigger value="findings" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Findings
            {dashboardSummary && dashboardSummary.openFindings > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                {dashboardSummary.openFindings}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="risks" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Risk Scores
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Policies</p>
                    <p className="text-2xl font-bold">{dashboardSummary?.activePolicies || 0}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  of {dashboardSummary?.totalPolicies || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Open Findings</p>
                    <p className="text-2xl font-bold text-red-600">
                      {dashboardSummary?.openFindings || 0}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  of {dashboardSummary?.totalFindings || 0} total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">High-Risk Entities</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {dashboardSummary?.highRiskEntities || 0}
                    </p>
                  </div>
                  <Shield className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Avg score: {dashboardSummary?.avgRiskScore?.toFixed(0) || 'N/A'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Active Rules</p>
                    <p className="text-2xl font-bold">{dashboardSummary?.activeRules || 0}</p>
                  </div>
                  <Settings className="h-8 w-8 text-gray-500 opacity-50" />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  of {dashboardSummary?.totalRules || 0} total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Metrics */}
          {complianceMetrics && (
            <ComplianceMetricsPanel metrics={complianceMetrics} />
          )}

          {/* Two Column Layout: Risk Heatmap + Top Risks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {riskHeatmap && <RiskHeatmap data={riskHeatmap} />}
            </div>
            <div>
              {dashboardSummary?.topRisks && dashboardSummary.topRisks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Top Risk Entities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dashboardSummary.topRisks.slice(0, 5).map((risk) => (
                      <div
                        key={`${risk.entityType}-${risk.entityId}`}
                        className="flex items-center justify-between p-2 rounded bg-gray-50"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {risk.entityName || risk.entityId}
                          </div>
                          <div className="text-xs text-gray-500">{risk.primaryConcern}</div>
                        </div>
                        <div className="text-right">
                          <div
                            className="font-bold"
                            style={{
                              color:
                                risk.riskScore >= 70
                                  ? '#dc2626'
                                  : risk.riskScore >= 40
                                  ? '#f59e0b'
                                  : '#16a34a',
                            }}
                          >
                            {risk.riskScore.toFixed(0)}
                          </div>
                          <SeverityBadge severity={risk.riskLevel} className="text-xs" />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Recent Insights Preview */}
          {insights.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Latest Insight
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('insights')}
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{insights[0].title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{insights[0].summary}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(insights[0].createdAt)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Policies Tab */}
        <TabsContent value="policies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PolicyList
                policies={policies}
                total={policiesTotal}
                hasMore={policiesHasMore}
                query={policiesQuery}
                onQueryChange={setPoliciesQuery}
                onPolicyClick={handlePolicyClick}
                onCreateClick={handleCreatePolicy}
                onDeleteClick={handleDeletePolicy}
              />
            </div>
            <div>
              {selectedPolicy ? (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{selectedPolicy.name}</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPolicy(null)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{selectedPolicy.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Category:</span>
                      <span className="text-sm">{getCategoryLabel(selectedPolicy.category)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">Severity:</span>
                      <SeverityBadge severity={selectedPolicy.severity} />
                    </div>

                    {/* Rules */}
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Rules ({rules.length})</h4>
                        <Button size="sm" onClick={handleCreateRule}>
                          <Plus className="h-4 w-4 mr-1" />
                          Add Rule
                        </Button>
                      </div>
                      {rules.length === 0 ? (
                        <p className="text-sm text-gray-500">No rules configured</p>
                      ) : (
                        <div className="space-y-2">
                          {rules.map((rule) => (
                            <div
                              key={rule.id}
                              className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                              onClick={() => handleEditRule(rule)}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{rule.name}</span>
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    rule.isActive
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {rule.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Select a policy to view details</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Rule Editor Modal */}
          {showRuleEditor && selectedPolicy && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <RuleEditor
                  rule={editingRule || undefined}
                  policyId={selectedPolicy.id}
                  onSave={handleSaveRule}
                  onCancel={() => {
                    setShowRuleEditor(false);
                    setEditingRule(null);
                  }}
                />
              </div>
            </div>
          )}
        </TabsContent>

        {/* Findings Tab */}
        <TabsContent value="findings">
          <FindingsList
            findings={findings}
            total={findingsTotal}
            hasMore={findingsHasMore}
            query={findingsQuery}
            onQueryChange={setFindingsQuery}
            onAcknowledgeClick={handleAcknowledgeFinding}
            onResolveClick={handleResolveFinding}
            onDismissClick={handleDismissFinding}
            onEscalateClick={handleEscalateFinding}
          />
        </TabsContent>

        {/* Risk Scores Tab */}
        <TabsContent value="risks" className="space-y-6">
          {riskHeatmap && <RiskHeatmap data={riskHeatmap} />}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {riskScores.map((riskScore) => (
              <RiskScoreCard key={riskScore.id} riskScore={riskScore} />
            ))}
          </div>

          {riskScores.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No risk scores calculated yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Risk scores will be computed as findings are created
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights">
          <InsightsSummary
            insights={insights}
            onGenerateClick={handleGenerateInsight}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
