# Governance, Compliance & Audit Intelligence Engine V1

**Sprint:** S59
**Status:** Implemented
**Feature Flag:** `ENABLE_GOVERNANCE`

## Overview

The Governance, Compliance & Audit Intelligence Engine provides a centralized "governance brain" that monitors, evaluates, and enforces organizational policies across all PRAVADO systems. It centralizes policy management, compliance rule evaluation, risk scoring, and generates AI-powered insights for executive decision-making.

## Business Value

- **Centralized Policy Management**: Single source of truth for all governance policies
- **Automated Compliance Monitoring**: Real-time rule evaluation across all PRAVADO systems
- **Risk Intelligence**: Entity-level risk scoring with trend analysis
- **Executive Visibility**: Dashboard with KPIs, heatmaps, and AI-generated insights
- **Audit Trail**: Complete finding lifecycle with version history

## Key Features

### 1. Policy Management

Policies define governance categories and their associated rules:

- **Categories**: Content, Crisis, Reputation, Journalist, Legal, Data Privacy, Media Relations, Executive Comms, Competitive Intel, Brand Safety
- **Scopes**: Global, Brand, Campaign, Journalist, Region, Channel, Team
- **Severity Levels**: Low, Medium, High, Critical
- **Versioning**: Full version history with change tracking

### 2. Rule Engine

Rules define conditions and actions for compliance evaluation:

- **Rule Types**:
  - `threshold`: Numeric threshold checks (e.g., sentiment < -0.5)
  - `pattern`: Regex pattern matching
  - `blacklist`/`whitelist`: Value list checks
  - `time_window`: Time-based constraints
  - `compound`: Complex multi-condition rules
  - `frequency`: Event frequency limits
  - `sentiment`: Sentiment range checks
  - `relationship`: Entity relationship rules
  - `approval_required`: Workflow approval rules

- **Target Systems**: Media Monitoring, Crisis, Reputation, Outreach, Briefings, Journalists, Press Releases, Pitches, Media Lists, Personas, Competitive Intel

- **Evaluation Modes**:
  - `on_event`: Evaluate when events occur
  - `scheduled`: Cron-based evaluation
  - `manual`: Manual trigger only

### 3. Finding Lifecycle

Findings represent compliance violations or alerts:

- **Statuses**: Open → Acknowledged → In Progress → Resolved/Dismissed/Escalated
- **Actions**:
  - Acknowledge: Mark as seen
  - Resolve: Mark as fixed with resolution notes
  - Dismiss: Mark as false positive with reason
  - Escalate: Assign to another user for review

### 4. Risk Scoring

Entity-level risk assessment with multiple dimensions:

- **Entity Types**: Brand, Campaign, Journalist, Story, Channel, Outlet, Spokesperson, Competitor, Region
- **Risk Dimensions**: Content, Reputation, Crisis, Legal, Relationship, Competitive
- **Trend Analysis**: Improving, Stable, Worsening
- **Contributing Factors**: Tracked and displayed

### 5. AI Governance Insights

AI-generated analysis and recommendations:

- **Generation Methods**: Rule-based, LLM-assisted, Hybrid
- **Outputs**:
  - Executive Summary
  - Detailed Analysis
  - Recommendations with priority
  - Action Items
  - Top Risk Entities
  - Risk Distribution

## Technical Architecture

### Database Schema

```
governance_policies
├── id, org_id, key, name, description
├── category, scope, severity
├── rule_config (JSONB)
├── is_active, is_archived
├── owner_user_id, department
├── regulatory_reference
├── effective_date, review_date
└── created_by, updated_by, timestamps

governance_rules
├── id, org_id, policy_id
├── name, description
├── rule_type, target_system
├── condition (JSONB), action (JSONB)
├── priority, is_active
├── evaluation_mode, schedule_cron
├── cooldown_minutes, max_findings_per_day
├── tags, metadata
└── created_by, updated_by, timestamps

governance_findings
├── id, org_id, policy_id, rule_id
├── source_system, source_reference_id
├── severity, status
├── summary, details, impact_score
├── affected_entities (JSONB)
├── recommended_actions (JSONB)
├── mitigation_notes, assigned_to
├── resolved_by, resolution_notes
├── detected_at, acknowledged_at
├── resolved_at, dismissed_at
├── metadata, event_snapshot
└── timestamps

governance_risk_scores
├── id, org_id
├── entity_type, entity_id, entity_name
├── overall_score, risk_level
├── content_risk, reputation_risk, crisis_risk
├── legal_risk, relationship_risk, competitive_risk
├── previous_score, score_trend
├── breakdown (JSONB)
├── contributing_factors (JSONB)
├── active_findings_count
├── linked_finding_ids
├── computed_at, computation_method
├── confidence_score, valid_until, is_stale
└── timestamps

governance_audit_insights
├── id, org_id
├── time_window_start, time_window_end
├── insight_type, scope
├── title, summary, executive_summary
├── detailed_analysis
├── recommendations (JSONB)
├── action_items (JSONB)
├── top_risks (JSONB)
├── risk_distribution (JSONB)
├── metrics_snapshot (JSONB)
├── linked_findings, findings_count
├── generated_by, llm_model
├── tokens_used, distributed_at
└── created_by, timestamps

governance_policy_versions
├── id, org_id, policy_id
├── version_number
├── policy_snapshot (JSONB)
├── change_summary
├── changed_fields
└── created_by, created_at
```

### API Endpoints

```
GET    /api/v1/governance/policies
POST   /api/v1/governance/policies
GET    /api/v1/governance/policies/:id
PATCH  /api/v1/governance/policies/:id
DELETE /api/v1/governance/policies/:id
GET    /api/v1/governance/policies/:id/versions

GET    /api/v1/governance/rules
POST   /api/v1/governance/rules
GET    /api/v1/governance/rules/:id
PATCH  /api/v1/governance/rules/:id
DELETE /api/v1/governance/rules/:id

GET    /api/v1/governance/findings
POST   /api/v1/governance/findings
GET    /api/v1/governance/findings/:id
PATCH  /api/v1/governance/findings/:id
POST   /api/v1/governance/findings/:id/acknowledge
POST   /api/v1/governance/findings/:id/resolve
POST   /api/v1/governance/findings/:id/dismiss
POST   /api/v1/governance/findings/:id/escalate

GET    /api/v1/governance/risk-scores
PUT    /api/v1/governance/risk-scores
POST   /api/v1/governance/risk-scores/recalculate

GET    /api/v1/governance/insights
GET    /api/v1/governance/insights/:id
POST   /api/v1/governance/insights/generate

GET    /api/v1/governance/dashboard
GET    /api/v1/governance/compliance-metrics
GET    /api/v1/governance/risk-heatmap
POST   /api/v1/governance/evaluate
```

### Frontend Components

```
components/governance/
├── SeverityBadge.tsx       # Severity level indicator
├── StatusBadge.tsx         # Finding status indicator
├── CategoryBadge.tsx       # Policy category indicator
├── PolicyList.tsx          # Policy table with CRUD
├── FindingsList.tsx        # Findings table with filters
├── RiskScoreCard.tsx       # Entity risk visualization
├── ComplianceMetricsPanel.tsx # KPI cards
├── InsightsSummary.tsx     # AI insights display
├── RiskHeatmap.tsx         # Entity×dimension matrix
├── RuleEditor.tsx          # Rule creation/editing
└── index.ts                # Barrel export
```

## Usage Examples

### Creating a Policy

```typescript
const policy = await governanceApi.createPolicy({
  key: 'crisis-escalation',
  name: 'Crisis Escalation Policy',
  description: 'Rules for escalating crisis situations',
  category: 'crisis',
  scope: 'global',
  severity: 'high',
});
```

### Creating a Rule

```typescript
const rule = await governanceApi.createRule({
  policyId: policy.id,
  name: 'Negative Sentiment Alert',
  ruleType: 'threshold',
  targetSystem: 'media_monitoring',
  condition: {
    field: 'sentiment_score',
    operator: 'lt',
    value: -0.5,
  },
  action: {
    createFinding: true,
    sendNotification: true,
  },
  priority: 80,
  evaluationMode: 'on_event',
});
```

### Evaluating Rules

```typescript
const results = await governanceApi.evaluateRules({
  sourceSystem: 'media_monitoring',
  eventType: 'mention.created',
  eventId: 'mention-123',
  eventData: {
    sentiment_score: -0.8,
    outlet: 'Test Outlet',
    reach: 50000,
  },
  timestamp: new Date().toISOString(),
});
```

### Generating AI Insights

```typescript
const insight = await governanceApi.generateInsight({
  timeWindowStart: thirtyDaysAgo.toISOString(),
  timeWindowEnd: now.toISOString(),
  scope: 'global',
  useLlm: true,
});
```

## Dashboard Features

### Overview Tab

- Key metrics cards (policies, findings, risks, rules)
- Compliance metrics panel with trend indicators
- Risk heatmap (entity × dimension)
- Top risk entities list
- Latest AI insight preview

### Policies Tab

- Policy list with search and filters
- Policy detail view with associated rules
- Rule editor for creating/editing rules
- Version history

### Findings Tab

- Findings list with status filters
- Quick actions (acknowledge, resolve, dismiss, escalate)
- Pagination and sorting

### Risk Scores Tab

- Full risk heatmap
- Risk score cards for all entities
- Trend indicators

### Insights Tab

- AI-generated insights with recommendations
- Insight generation trigger
- Historical insights

## Security

- All endpoints require authentication (`requireUser`)
- Organization-level data isolation via RLS
- Policy ownership tracking
- Audit trail for all changes

## Performance Considerations

- Paginated endpoints (default limit: 20)
- Indexed queries on common filters
- Cooldown periods to prevent rule flooding
- Max findings per day limits
- Stale score detection

## Future Enhancements (V2+)

1. **Workflow Automation**: Approval workflows for high-severity findings
2. **External Integrations**: Slack/Teams notifications, Jira/ServiceNow tickets
3. **Custom Dashboards**: User-configurable dashboard layouts
4. **Advanced Analytics**: ML-based anomaly detection
5. **Regulatory Templates**: Pre-built policy templates for common regulations
6. **Multi-language Support**: Internationalized policy descriptions
7. **Scheduled Reports**: Automated compliance report generation

## Related Documentation

- [Audit Logging V1](./audit_logging_v1.md) - S35
- [Audit Replay Engine V1](./audit_replay_engine_v1.md) - S37
- [Brand Reputation Intelligence V1](./brand_reputation_v1.md) - S56
- [Crisis Response Engine V1](./crisis_response_v1.md) - S55
