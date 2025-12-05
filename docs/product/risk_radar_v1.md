# Executive Risk Radar & Predictive Crisis Forecasting Engine V1

**Sprint:** S60
**Status:** Complete
**Feature Flag:** `ENABLE_RISK_RADAR`

## Overview

The Executive Risk Radar is a comprehensive risk monitoring and forecasting system designed for executive decision-making. It aggregates signals from across Pravado's platform (media monitoring, competitive intelligence, governance, audience personas, etc.) to compute a unified risk index with predictive capabilities.

## Key Features

### 1. Risk Snapshots
- Point-in-time risk assessments with computed risk index (0-100)
- Component scores: sentiment, velocity, alerts, competitive, governance, persona
- Key concerns, emerging risks, and positive factors identification
- Signal matrix aggregation from integrated systems

### 2. Risk Indicators
- Aggregated indicators from multiple source systems
- Indicator types: sentiment, velocity, alerts, competitive, governance, persona, media_coverage, crisis_history, reputation
- Trend analysis with velocity tracking
- Normalized scoring with configurable weights

### 3. Predictive Forecasting
- Multiple forecast horizons: 24h, 72h, 7d, 14d, 30d
- Projection curves with confidence intervals
- Crisis probability estimation
- LLM-assisted narrative synthesis for executive summaries
- Recommended actions and watch items

### 4. Risk Drivers
- Identification of key factors driving risk scores
- Categories: sentiment_shift, velocity_spike, competitive_pressure, governance_violation, media_surge, crisis_pattern, persona_sensitivity, external_event, reputation_decline
- Urgency classification: critical, high, medium, low
- Emerging and turning point flagging

### 5. Collaborative Notes
- Executive-visible collaboration layer
- Note types: observation, action_taken, escalation, resolution, context, executive_comment
- Pinning and tagging support
- Audit trail for compliance

### 6. Executive Dashboard
- Real-time risk posture visualization
- Trend comparison with previous snapshots
- Component score breakdown
- Forecast preview with crisis probability
- Top concerns and emerging risks summary

## Architecture

### Database Schema

```sql
-- Core tables (see migration 64)
risk_radar_snapshots       -- Point-in-time risk assessments
risk_radar_indicators      -- Aggregated risk indicators
risk_radar_forecasts       -- Predictive forecasts
risk_radar_drivers         -- Key risk drivers
risk_radar_notes           -- Collaborative notes
risk_radar_audit_log       -- Comprehensive audit trail
```

### API Endpoints

```
POST   /api/v1/risk-radar/snapshots              -- Create snapshot
GET    /api/v1/risk-radar/snapshots              -- List snapshots
GET    /api/v1/risk-radar/snapshots/:id          -- Get snapshot
PUT    /api/v1/risk-radar/snapshots/:id          -- Update snapshot
DELETE /api/v1/risk-radar/snapshots/:id/archive  -- Archive snapshot

GET    /api/v1/risk-radar/snapshots/:id/indicators     -- List indicators
POST   /api/v1/risk-radar/snapshots/:id/indicators/rebuild -- Rebuild indicators

GET    /api/v1/risk-radar/snapshots/:id/forecasts      -- List forecasts
POST   /api/v1/risk-radar/snapshots/:id/forecasts      -- Generate forecast
POST   /api/v1/risk-radar/forecasts/:id/regenerate     -- Regenerate forecast

GET    /api/v1/risk-radar/snapshots/:id/drivers        -- List drivers
POST   /api/v1/risk-radar/snapshots/:id/drivers        -- Add driver

GET    /api/v1/risk-radar/snapshots/:id/notes          -- List notes
POST   /api/v1/risk-radar/snapshots/:id/notes          -- Add note
PUT    /api/v1/risk-radar/notes/:id                    -- Update note
DELETE /api/v1/risk-radar/notes/:id                    -- Delete note

GET    /api/v1/risk-radar/dashboard                    -- Dashboard aggregation
GET    /api/v1/risk-radar/audit-logs                   -- Audit logs
```

### Frontend Components

```
components/risk-radar/
├── index.ts                    -- Barrel exports
├── RiskLevelBadge.tsx          -- Risk level indicator
├── RiskRadarCard.tsx           -- Snapshot summary card
├── RiskIndicatorPanel.tsx      -- Indicators display
├── ForecastPanel.tsx           -- Forecast visualization
├── RiskDriverList.tsx          -- Driver list with impact
├── RiskNotesPanel.tsx          -- Collaborative notes
├── SnapshotDetailDrawer.tsx    -- Full detail drawer
├── ForecastGenerationForm.tsx  -- Forecast generation modal
└── ExecutiveRiskDashboard.tsx  -- Executive summary view

app/app/risk-radar/
└── page.tsx                    -- Main dashboard page
```

## Risk Index Computation

### Component Weights (Default)
| Component | Weight |
|-----------|--------|
| Sentiment | 15% |
| Velocity | 12% |
| Alerts | 15% |
| Competitive | 10% |
| Governance | 12% |
| Persona | 8% |
| Media Coverage | 10% |
| Crisis History | 10% |
| Reputation | 8% |

### Risk Level Classification
| Index Range | Level |
|-------------|-------|
| 80-100 | Critical |
| 60-79 | High |
| 40-59 | Medium |
| 0-39 | Low |

## Signal Matrix Integration

The Risk Radar aggregates signals from:
- **S40:** Media Monitoring (coverage volume, sentiment)
- **S44:** Crisis Response (active incidents, severity)
- **S47:** Competitive Intelligence (market position, threats)
- **S56:** Audience Personas (sentiment alignment)
- **S59:** Governance (policy violations, compliance)

## Forecasting Models

### Statistical Model
- Time-series projection based on historical snapshots
- Moving average with trend extrapolation
- Confidence intervals based on variance

### LLM-Enhanced Narrative
- Executive summary generation
- Key assumptions extraction
- Recommended actions formulation
- Watch items identification

## Usage

### Creating a Snapshot
```typescript
const snapshot = await riskRadarApi.createSnapshot({
  title: 'Daily Risk Assessment',
  description: 'Automated daily risk snapshot'
});
```

### Generating a Forecast
```typescript
const forecast = await riskRadarApi.generateForecast(snapshotId, {
  horizon: '7d',
  useLlm: true
});
```

### Adding a Note
```typescript
const note = await riskRadarApi.addNote(snapshotId, {
  noteType: 'observation',
  content: 'CEO flagged concerns about competitive pressure'
});
```

## Security & Access Control

- All endpoints require authentication
- Organization-level data isolation (RLS)
- Executive visibility flags for sensitive notes
- Comprehensive audit logging for compliance

## Performance Considerations

- Snapshot creation: ~150-500ms (depending on signal aggregation)
- Forecast generation: ~2-5s (with LLM), ~200ms (statistical only)
- Dashboard aggregation: ~100-300ms
- Pagination support for all list endpoints

## Related Features

- Crisis Response (S55): Incident integration
- Media Monitoring (S40): Media signal source
- Competitive Intelligence (S47): Market signal source
- Governance (S59): Policy compliance signals
- Audience Personas (S56): Persona alignment signals
