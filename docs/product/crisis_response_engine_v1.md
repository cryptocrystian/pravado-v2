# Crisis Response & Escalation Engine V1

## Overview

The Crisis Response & Escalation Engine provides AI-powered crisis detection, incident management, and coordinated response capabilities. It monitors source systems (S40-S52) for potential threats, automatically generates signals, creates incidents, and provides actionable recommendations with executive briefings.

## Core Features

### 1. Crisis Detection Engine
- **Automated Signal Detection**: Monitors media mentions, crawled articles, and alerts from S40/S41/S43 source systems
- **Multi-Source Aggregation**: Combines signals from media monitoring, social listening, and competitive intelligence
- **Threshold-Based Triggers**: Configurable severity thresholds for sentiment, velocity, and propagation metrics
- **Real-Time Processing**: Processes events within configurable time windows (default: 60 minutes)

### 2. Incident Management
- **Incident Lifecycle**: Active → Contained → Resolved → Closed status workflow
- **Severity Classification**: Five levels (low, medium, high, critical, severe) with visual indicators
- **Trajectory Tracking**: Monitors crisis direction (improving, stable, worsening, critical, resolved)
- **Propagation Analysis**: Tracks spread level (contained, spreading, viral, mainstream, saturated)
- **Incident Codes**: Auto-generated unique identifiers (e.g., CRI-20240115-001)

### 3. Escalation Framework
- **Multi-Level Escalation**: Configurable escalation levels (L1-L5) with progressive severity
- **Rule-Based Automation**: Threshold, pattern, and time-based escalation rules
- **Notification Channels**: Slack, email, webhook integrations for escalation alerts
- **Cooldown Periods**: Prevents escalation spam with configurable cooldown windows

### 4. AI-Powered Action Recommendations
- **Context-Aware Generation**: Analyzes incident context to suggest appropriate actions
- **Action Types**: 15 action categories including statement release, media outreach, stakeholder briefing
- **Priority Scoring**: Weighted priority based on urgency and impact
- **Workflow Management**: Recommended → Approved → In Progress → Completed status flow

### 5. Crisis Briefing Generation
- **Executive Summaries**: Concise overviews for leadership teams
- **Full Briefs**: Comprehensive situation reports with all details
- **Section Types**: 12 specialized sections (situation overview, timeline, media landscape, etc.)
- **Key Takeaways**: Prioritized bullet points for quick understanding
- **Risk Assessment**: Multi-dimensional risk scoring (reputation, financial, legal, operational)

### 6. Dashboard & Analytics
- **Real-Time Stats**: Active incidents, signals, pending actions, escalation counts
- **Severity Distribution**: Visual breakdown by severity level
- **Trajectory Distribution**: Tracking of crisis direction trends
- **Recent Activity**: Timeline of latest crisis-related events
- **Sentiment Trends**: Historical sentiment tracking over time

## Technical Architecture

### Database Schema (Migration 60)
```sql
-- Core Tables
crisis_events          -- Raw events from source systems
crisis_signals         -- Aggregated detection signals
crisis_incidents       -- Main incident records
crisis_actions         -- Response action items
crisis_briefs          -- Generated briefing documents
crisis_brief_sections  -- Individual brief sections
crisis_escalation_rules -- Automation rule definitions
crisis_audit_log       -- Comprehensive activity tracking
```

### API Endpoints
```
POST   /api/v1/crisis/incidents              -- Create incident
GET    /api/v1/crisis/incidents              -- List incidents (with filters)
GET    /api/v1/crisis/incidents/:id          -- Get incident details
PATCH  /api/v1/crisis/incidents/:id          -- Update incident
POST   /api/v1/crisis/incidents/:id/close    -- Close incident
POST   /api/v1/crisis/incidents/:id/escalate -- Escalate incident

GET    /api/v1/crisis/signals                -- List signals
POST   /api/v1/crisis/signals/:id/acknowledge -- Acknowledge signal

POST   /api/v1/crisis/detection/run          -- Trigger detection scan

POST   /api/v1/crisis/actions                -- Create action
GET    /api/v1/crisis/actions                -- List actions
PATCH  /api/v1/crisis/actions/:id            -- Update action

POST   /api/v1/crisis/incidents/:id/briefs   -- Generate brief
GET    /api/v1/crisis/briefs                 -- List briefs
POST   /api/v1/crisis/briefs/:id/sections/:id/regenerate -- Regenerate section

POST   /api/v1/crisis/rules                  -- Create escalation rule
GET    /api/v1/crisis/rules                  -- List rules
PATCH  /api/v1/crisis/rules/:id              -- Update rule
DELETE /api/v1/crisis/rules/:id              -- Delete rule

GET    /api/v1/crisis/dashboard              -- Get dashboard stats
```

### Feature Flag
```typescript
ENABLE_CRISIS_ENGINE: true // S55: AI-powered crisis detection & escalation engine
```

## Integration Points

### Source System Integration (S40-S52)
- **S40 Media Monitoring**: media_mentions table → crisis_events
- **S41 Media Crawling**: crawled_articles table → crisis_events
- **S43 Media Alerts**: media_alerts table → crisis_events
- **S49 Journalist Timeline**: Relationship context for journalist-related crises
- **S52 Media Performance**: Performance metrics for impact assessment
- **S53 Competitive Intelligence**: Competitor crisis monitoring

### LLM Integration
- **Recommendation Generation**: GPT-4 powered action suggestions
- **Brief Content**: AI-generated section content with custom instructions
- **Summary Generation**: Automated incident summaries and key takeaways
- **Risk Assessment**: Multi-factor risk analysis with LLM reasoning

## UI Components

### Frontend Components (10)
1. **CrisisIncidentCard**: Displays incident summary with severity, trajectory, stats
2. **CrisisSignalList**: Filterable signal list with acknowledge actions
3. **CrisisActionList**: Action workflow management with status updates
4. **CrisisIncidentDetailDrawer**: Slide-out drawer with tabbed interface
5. **CrisisBriefPanel**: Brief viewing with section expansion and regeneration
6. **CrisisFiltersBar**: Horizontal filter controls for incidents
7. **CrisisDashboardStats**: Real-time statistics and distribution charts
8. **CrisisSeverityBadge**: Colored badge with icon based on severity, trajectory, and propagation level
9. **CrisisDetectionPanel**: Panel for triggering detection scans with advanced options
10. **CrisisEscalationRuleEditor**: CRUD interface for managing escalation rules

### Dashboard Page
- **Three-Panel Layout**:
  - Left Panel: Incidents list with filters and severity badges
  - Center Panel: Signals/Actions/Brief tabs for incident details
  - Right Panel: Tabbed interface (Signals, Detection, Rules) + Selected incident summary + Quick actions
- **Detection Panel**: Trigger scans with configurable time windows and source filters
- **Escalation Rules Management**: Create, update, delete automation rules
- **Real-Time Updates**: Auto-refresh capabilities for active monitoring
- **Responsive Design**: Mobile-friendly grid layout

## Security & Compliance

### Row-Level Security (RLS)
- Organization-scoped data access
- User role-based permissions for escalation actions
- Audit logging for all crisis-related operations

### Data Privacy
- PII handling in incident descriptions
- Journalist identity protection
- Confidential stakeholder information management

## Performance Considerations

- **Detection Batching**: Events processed in configurable time windows
- **Signal Aggregation**: Deduplication and consolidation of related events
- **Brief Caching**: Current brief caching to reduce regeneration costs
- **Pagination**: All list endpoints support offset/limit pagination

## Future Enhancements (V2 Considerations)

1. **Real-Time WebSocket Updates**: Live incident status changes
2. **Crisis Playbooks**: Pre-defined response templates
3. **External Integrations**: JIRA, ServiceNow ticket creation
4. **Mobile Push Notifications**: Critical escalation alerts
5. **Analytics Dashboard**: Historical crisis analysis and trends
6. **War Room Mode**: Dedicated full-screen crisis management view
7. **Voice Briefings**: Text-to-speech executive summaries
8. **Automated Response**: Pre-approved action execution

## Sprint S55 Deliverables

- [x] Database migration (60_crisis_response_schema.sql)
- [x] Type definitions (packages/types/src/crisis.ts)
- [x] Validators (packages/validators/src/crisis.ts)
- [x] Service layer (apps/api/src/services/crisisService.ts)
- [x] API routes (apps/api/src/routes/crisis/index.ts)
- [x] Feature flag (ENABLE_CRISIS_ENGINE)
- [x] Frontend API client (apps/dashboard/src/lib/crisisApi.ts)
- [x] UI components (7 components)
- [x] Dashboard page (apps/dashboard/src/app/app/crisis/page.tsx)
- [x] Backend tests (apps/api/tests/crisisService.test.ts)
- [x] E2E tests (apps/dashboard/tests/crisis.spec.ts)
- [x] Documentation (this file)
