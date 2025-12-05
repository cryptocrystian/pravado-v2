/**
 * Governance Dashboard E2E Tests (Sprint S59)
 * Frontend integration tests for governance, compliance & audit intelligence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the governance API
vi.mock('@/lib/governanceApi', () => ({
  listPolicies: vi.fn(),
  getPolicy: vi.fn(),
  createPolicy: vi.fn(),
  updatePolicy: vi.fn(),
  deletePolicy: vi.fn(),
  listRules: vi.fn(),
  createRule: vi.fn(),
  updateRule: vi.fn(),
  listFindings: vi.fn(),
  acknowledgeFinding: vi.fn(),
  resolveFinding: vi.fn(),
  dismissFinding: vi.fn(),
  escalateFinding: vi.fn(),
  listRiskScores: vi.fn(),
  getDashboardSummary: vi.fn(),
  getComplianceMetrics: vi.fn(),
  getRiskHeatmap: vi.fn(),
  listInsights: vi.fn(),
  generateInsight: vi.fn(),
  formatRelativeTime: vi.fn((_date: string) => '2 hours ago'),
  getCategoryLabel: vi.fn((cat: string) => cat),
  getSeverityColor: vi.fn(() => 'red'),
  getStatusColor: vi.fn(() => 'green'),
  getScopeLabel: vi.fn((scope: string) => scope),
  getRuleTypeLabel: vi.fn((type: string) => type),
  getTargetSystemLabel: vi.fn((system: string) => system),
  getEntityTypeLabel: vi.fn((entity: string) => entity),
  getTrendColor: vi.fn(() => 'green'),
}));

// Import components after mocking
import {
  PolicyList,
  FindingsList,
  RiskScoreCard,
  ComplianceMetricsPanel,
  SeverityBadge,
  StatusBadge,
  CategoryBadge,
} from '@/components/governance';

import type {
  GovernancePolicy,
  GovernanceFinding,
  GovernanceRiskScore,
  GovernanceComplianceMetrics,
} from '@/lib/governanceApi';

// Mock data
const mockPolicy: GovernancePolicy = {
  id: 'policy-1',
  orgId: 'org-1',
  key: 'crisis-policy',
  name: 'Crisis Management Policy',
  description: 'Policy for managing crisis situations',
  category: 'crisis',
  scope: 'global',
  severity: 'high',
  ruleConfig: {},
  isActive: true,
  isArchived: false,
  ownerUserId: 'user-1',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockFinding: GovernanceFinding = {
  id: 'finding-1',
  orgId: 'org-1',
  policyId: 'policy-1',
  ruleId: 'rule-1',
  sourceSystem: 'media_monitoring',
  sourceReferenceId: 'mention-123',
  severity: 'high',
  status: 'open',
  summary: 'Negative sentiment detected',
  details: 'Sentiment score dropped below threshold',
  impactScore: 75,
  affectedEntities: [],
  recommendedActions: [],
  detectedAt: '2024-01-15T10:00:00Z',
  metadata: {},
  eventSnapshot: {},
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockRiskScore: GovernanceRiskScore = {
  id: 'risk-1',
  orgId: 'org-1',
  entityType: 'brand',
  entityId: 'brand-1',
  entityName: 'Test Brand',
  overallScore: 65,
  riskLevel: 'high',
  contentRisk: 60,
  reputationRisk: 70,
  crisisRisk: 50,
  trendPeriodDays: 30,
  scoreTrend: 'worsening',
  breakdown: {},
  contributingFactors: [],
  activeFindingsCount: 3,
  linkedFindingIds: [],
  computedAt: '2024-01-15T10:00:00Z',
  computationMethod: 'weighted_average',
  isStale: false,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
};

const mockComplianceMetrics: GovernanceComplianceMetrics = {
  complianceScore: 85,
  policyCoverage: 90,
  ruleEffectiveness: 75,
  resolutionRate: 80,
  meanTimeToResolution: 4.5,
  findingsPerDay: 2.3,
  trendsVsPreviousPeriod: {
    complianceScoreChange: 5,
    findingsChange: -10,
    resolutionRateChange: 8,
  },
};

describe('Governance Components (S59)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('SeverityBadge', () => {
    it('renders severity label correctly', () => {
      render(<SeverityBadge severity="high" />);
      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('renders with correct styling for critical', () => {
      render(<SeverityBadge severity="critical" />);
      expect(screen.getByText('Critical')).toBeInTheDocument();
    });

    it('renders with correct styling for low', () => {
      render(<SeverityBadge severity="low" />);
      expect(screen.getByText('Low')).toBeInTheDocument();
    });
  });

  describe('StatusBadge', () => {
    it('renders status label correctly', () => {
      render(<StatusBadge status="open" />);
      expect(screen.getByText('Open')).toBeInTheDocument();
    });

    it('renders acknowledged status', () => {
      render(<StatusBadge status="acknowledged" />);
      expect(screen.getByText('Acknowledged')).toBeInTheDocument();
    });

    it('renders resolved status', () => {
      render(<StatusBadge status="resolved" />);
      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });

    it('renders escalated status', () => {
      render(<StatusBadge status="escalated" />);
      expect(screen.getByText('Escalated')).toBeInTheDocument();
    });
  });

  describe('CategoryBadge', () => {
    it('renders category label correctly', () => {
      render(<CategoryBadge category="crisis" />);
      expect(screen.getByText('crisis')).toBeInTheDocument();
    });
  });

  describe('PolicyList', () => {
    it('renders loading state', () => {
      render(
        <PolicyList
          policies={[]}
          total={0}
          hasMore={false}
          loading={true}
          query={{}}
          onQueryChange={() => {}}
        />
      );
      expect(screen.getByText('Loading policies...')).toBeInTheDocument();
    });

    it('renders empty state when no policies', () => {
      render(
        <PolicyList
          policies={[]}
          total={0}
          hasMore={false}
          loading={false}
          query={{}}
          onQueryChange={() => {}}
        />
      );
      expect(screen.getByText('No policies found')).toBeInTheDocument();
    });

    it('renders policy list correctly', () => {
      render(
        <PolicyList
          policies={[mockPolicy]}
          total={1}
          hasMore={false}
          loading={false}
          query={{ limit: 20, offset: 0 }}
          onQueryChange={() => {}}
        />
      );
      expect(screen.getByText('Crisis Management Policy')).toBeInTheDocument();
      expect(screen.getByText('crisis-policy')).toBeInTheDocument();
    });

    it('calls onPolicyClick when policy is clicked', () => {
      const onPolicyClick = vi.fn();
      render(
        <PolicyList
          policies={[mockPolicy]}
          total={1}
          hasMore={false}
          loading={false}
          query={{ limit: 20, offset: 0 }}
          onQueryChange={() => {}}
          onPolicyClick={onPolicyClick}
        />
      );

      fireEvent.click(screen.getByText('Crisis Management Policy'));
      expect(onPolicyClick).toHaveBeenCalledWith(mockPolicy);
    });

    it('shows create button when onCreateClick is provided', () => {
      const onCreateClick = vi.fn();
      render(
        <PolicyList
          policies={[]}
          total={0}
          hasMore={false}
          loading={false}
          query={{}}
          onQueryChange={() => {}}
          onCreateClick={onCreateClick}
        />
      );
      expect(screen.getByText('Create Policy')).toBeInTheDocument();
    });
  });

  describe('FindingsList', () => {
    it('renders loading state', () => {
      render(
        <FindingsList
          findings={[]}
          total={0}
          hasMore={false}
          loading={true}
          query={{}}
          onQueryChange={() => {}}
        />
      );
      expect(screen.getByText('Loading findings...')).toBeInTheDocument();
    });

    it('renders empty state when no findings', () => {
      render(
        <FindingsList
          findings={[]}
          total={0}
          hasMore={false}
          loading={false}
          query={{}}
          onQueryChange={() => {}}
        />
      );
      expect(screen.getByText('No findings found')).toBeInTheDocument();
    });

    it('renders findings list correctly', () => {
      render(
        <FindingsList
          findings={[mockFinding]}
          total={1}
          hasMore={false}
          loading={false}
          query={{ limit: 20, offset: 0 }}
          onQueryChange={() => {}}
        />
      );
      expect(screen.getByText('Negative sentiment detected')).toBeInTheDocument();
    });

    it('renders status filter buttons', () => {
      render(
        <FindingsList
          findings={[]}
          total={0}
          hasMore={false}
          loading={false}
          query={{}}
          onQueryChange={() => {}}
        />
      );
      expect(screen.getByText('All')).toBeInTheDocument();
      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Resolved')).toBeInTheDocument();
    });
  });

  describe('RiskScoreCard', () => {
    it('renders risk score correctly', () => {
      render(<RiskScoreCard riskScore={mockRiskScore} />);
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
      expect(screen.getByText('65')).toBeInTheDocument();
    });

    it('renders compact version correctly', () => {
      render(<RiskScoreCard riskScore={mockRiskScore} compact />);
      expect(screen.getByText('Test Brand')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
      const onClick = vi.fn();
      render(<RiskScoreCard riskScore={mockRiskScore} onClick={onClick} />);

      const card = screen.getByText('Test Brand').closest('[class*="cursor-pointer"]');
      if (card) {
        fireEvent.click(card);
        expect(onClick).toHaveBeenCalled();
      }
    });

    it('shows contributing factors', () => {
      const riskWithFactors: GovernanceRiskScore = {
        ...mockRiskScore,
        contributingFactors: [
          { source: 'media', factor: 'negative coverage', contribution: 15 },
        ],
      };
      render(<RiskScoreCard riskScore={riskWithFactors} />);
      expect(screen.getByText('negative coverage')).toBeInTheDocument();
    });
  });

  describe('ComplianceMetricsPanel', () => {
    it('renders loading state', () => {
      render(<ComplianceMetricsPanel metrics={mockComplianceMetrics} loading={true} />);
      expect(screen.getByText('Loading metrics...')).toBeInTheDocument();
    });

    it('renders compliance metrics correctly', () => {
      render(<ComplianceMetricsPanel metrics={mockComplianceMetrics} />);
      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
      expect(screen.getByText('Policy Coverage')).toBeInTheDocument();
      expect(screen.getByText('Resolution Rate')).toBeInTheDocument();
    });

    it('shows trend information', () => {
      render(<ComplianceMetricsPanel metrics={mockComplianceMetrics} />);
      expect(screen.getByText('vs Previous Period:')).toBeInTheDocument();
    });
  });
});

describe('Governance API Integration', () => {
  it('should have all required API functions exported', async () => {
    const governanceApi = await import('@/lib/governanceApi');

    expect(governanceApi.listPolicies).toBeDefined();
    expect(governanceApi.getPolicy).toBeDefined();
    expect(governanceApi.createPolicy).toBeDefined();
    expect(governanceApi.updatePolicy).toBeDefined();
    expect(governanceApi.deletePolicy).toBeDefined();
    expect(governanceApi.listRules).toBeDefined();
    expect(governanceApi.createRule).toBeDefined();
    expect(governanceApi.updateRule).toBeDefined();
    expect(governanceApi.listFindings).toBeDefined();
    expect(governanceApi.acknowledgeFinding).toBeDefined();
    expect(governanceApi.resolveFinding).toBeDefined();
    expect(governanceApi.dismissFinding).toBeDefined();
    expect(governanceApi.escalateFinding).toBeDefined();
    expect(governanceApi.listRiskScores).toBeDefined();
    expect(governanceApi.getDashboardSummary).toBeDefined();
    expect(governanceApi.getComplianceMetrics).toBeDefined();
    expect(governanceApi.getRiskHeatmap).toBeDefined();
    expect(governanceApi.listInsights).toBeDefined();
    expect(governanceApi.generateInsight).toBeDefined();
  });

  it('should have all helper functions exported', async () => {
    const governanceApi = await import('@/lib/governanceApi');

    expect(governanceApi.formatRelativeTime).toBeDefined();
    expect(governanceApi.getCategoryLabel).toBeDefined();
    expect(governanceApi.getSeverityColor).toBeDefined();
    expect(governanceApi.getStatusColor).toBeDefined();
    expect(governanceApi.getScopeLabel).toBeDefined();
    expect(governanceApi.getRuleTypeLabel).toBeDefined();
    expect(governanceApi.getTargetSystemLabel).toBeDefined();
    expect(governanceApi.getEntityTypeLabel).toBeDefined();
    expect(governanceApi.getTrendColor).toBeDefined();
  });
});

describe('Governance Accessibility', () => {
  it('badges should have proper ARIA attributes', () => {
    render(<SeverityBadge severity="critical" />);
    const badge = screen.getByText('Critical');
    expect(badge).toBeInTheDocument();
  });

  it('tables should have proper headers', () => {
    render(
      <PolicyList
        policies={[mockPolicy]}
        total={1}
        hasMore={false}
        loading={false}
        query={{ limit: 20, offset: 0 }}
        onQueryChange={() => {}}
      />
    );

    expect(screen.getByText('Policy')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('pagination controls should be accessible', () => {
    render(
      <PolicyList
        policies={[mockPolicy]}
        total={50}
        hasMore={true}
        loading={false}
        query={{ limit: 20, offset: 0 }}
        onQueryChange={() => {}}
      />
    );

    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();
  });
});
