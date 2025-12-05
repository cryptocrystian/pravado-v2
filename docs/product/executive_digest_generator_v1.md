# Executive Digest Generator V1

## Sprint S62 - Automated Strategic Briefs & Exec Weekly Digest

### Overview

The Executive Digest Generator is an automated system for creating and delivering strategic briefs to executive stakeholders. It aggregates data from multiple upstream systems (Executive Command Center, Risk Radar, Crisis Engine, Brand Reputation, Media Performance, Competitive Intelligence, Governance) to produce comprehensive weekly/monthly digests.

### Core Features

1. **Digest Configuration**
   - Configurable delivery schedule (weekly/monthly)
   - Customizable time window (7d/30d)
   - Selectable content sections
   - Multiple recipient management

2. **Data Aggregation**
   - Cross-system KPI collection
   - Insight aggregation from all sources
   - Risk and reputation scoring
   - Crisis status monitoring

3. **LLM-Powered Content**
   - Executive summary generation
   - Risk summary synthesis
   - Reputation analysis narrative
   - Action recommendations

4. **PDF Generation**
   - Branded PDF output
   - Supabase storage integration
   - Public URL generation

5. **Email Delivery**
   - Multi-recipient support
   - PDF attachment option
   - Inline summary support
   - Delivery logging

6. **Scheduler Integration**
   - Automated weekly/monthly delivery
   - Next delivery calculation
   - Delivery history tracking

### Database Schema

```sql
-- Migration 66: exec_digest_schema

-- Tables:
-- 1. exec_digests - Main digest configuration
-- 2. exec_digest_sections - LLM-generated content sections
-- 3. exec_digest_recipients - Email recipients
-- 4. exec_digest_delivery_log - Delivery history
-- 5. exec_digest_audit_log - Action audit trail

-- Enums:
-- exec_digest_delivery_period_enum: 'weekly', 'monthly'
-- exec_digest_time_window_enum: '7d', '30d'
-- exec_digest_section_type_enum: Various section types
-- exec_digest_delivery_status_enum: Status tracking
-- exec_digest_action_type_enum: Audit actions
```

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/v1/exec-digests | List digests |
| POST | /api/v1/exec-digests | Create digest |
| GET | /api/v1/exec-digests/stats | Get statistics |
| GET | /api/v1/exec-digests/:id | Get digest details |
| PATCH | /api/v1/exec-digests/:id | Update digest |
| DELETE | /api/v1/exec-digests/:id | Delete/archive digest |
| POST | /api/v1/exec-digests/:id/generate | Generate content |
| POST | /api/v1/exec-digests/:id/deliver | Send to recipients |
| GET | /api/v1/exec-digests/:id/sections | List sections |
| POST | /api/v1/exec-digests/:id/sections/order | Reorder sections |
| GET | /api/v1/exec-digests/:id/recipients | List recipients |
| POST | /api/v1/exec-digests/:id/recipients | Add recipient |
| PATCH | /api/v1/exec-digests/:id/recipients/:recipientId | Update recipient |
| DELETE | /api/v1/exec-digests/:id/recipients/:recipientId | Remove recipient |
| GET | /api/v1/exec-digests/:id/deliveries | List delivery logs |

### Section Types

| Type | Description |
|------|-------------|
| executive_summary | High-level overview of period |
| key_kpis | Performance metrics snapshot |
| key_insights | Important findings and trends |
| risk_summary | Risk analysis and alerts |
| reputation_summary | Brand reputation status |
| competitive_summary | Competitive intelligence |
| media_performance | Media coverage metrics |
| crisis_status | Active crisis incidents |
| governance_highlights | Compliance and governance |
| action_recommendations | AI-generated action items |

### Frontend Components

| Component | Purpose |
|-----------|---------|
| ExecDigestCard | Summary card for list view |
| ExecDigestHeader | Detail view header with actions |
| ExecDigestSectionList | Collapsible section display |
| ExecDigestRecipientList | Recipient management |
| ExecDigestDeliveryHistory | Delivery log display |
| ExecDigestStatsCard | Statistics overview |
| ExecDigestForm | Create/edit form |

### Feature Flag

```typescript
ENABLE_EXEC_DIGESTS: true // S62: Automated strategic briefs & exec weekly digest generator
```

### Upstream Dependencies

- S61: Executive Command Center (dashboards, KPIs, insights)
- S60: Risk Radar (risk forecasts)
- S55: Crisis Engine (active incidents)
- S56-57: Brand Reputation (scores, alerts)
- S52: Media Performance (metrics)
- S53: Competitive Intelligence (reports)
- S59: Governance (compliance scores)
- S42: Scheduler (automated delivery)

### Usage Example

```typescript
// Create a weekly digest
const digest = await createDigest(orgId, userId, {
  title: 'Weekly Executive Digest',
  deliveryPeriod: 'weekly',
  timeWindow: '7d',
  scheduleDayOfWeek: 1, // Monday
  scheduleHour: 8, // 8 AM
  scheduleTimezone: 'America/New_York',
  includeRecommendations: true,
  includeKpis: true,
  includeInsights: true,
});

// Add recipient
await addRecipient(orgId, digest.id, userId, {
  email: 'ceo@company.com',
  name: 'John CEO',
  role: 'CEO',
  includePdf: true,
});

// Generate content
await generateDigest(orgId, digest.id, userId, {
  forceRegenerate: true,
  generatePdf: true,
});

// Deliver to recipients
await deliverDigest(orgId, digest.id, userId, {
  regeneratePdf: false,
});
```

### Security Considerations

- RLS policies enforce org-level data isolation
- Recipients are validated before delivery
- PDF URLs can be signed for security
- Audit logging tracks all actions

### Future Enhancements (Post-V1)

- Custom section templates
- Multiple digest templates per org
- A/B testing for content
- Engagement tracking
- Mobile-optimized PDF format
- Integration with calendar systems
