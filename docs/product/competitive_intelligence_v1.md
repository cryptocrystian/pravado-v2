# Competitive Intelligence Engine V1

**Sprint:** S53
**Status:** Complete
**Version:** 1.0.0

## Overview

The Competitive Intelligence Engine enables PR and communications teams to track, analyze, and benchmark competitor media coverage against their own brand presence. It provides real-time competitor monitoring, comparative analytics, overlap analysis, and AI-generated strategic insights.

## Key Features

### 1. Competitor Management
- **Multi-tier competitor tracking** - Categorize competitors into 4 tiers:
  - Tier 1: Direct competitors (same market, similar scale)
  - Tier 2: Secondary competitors (adjacent market)
  - Tier 3: Emerging competitors (smaller but growing)
  - Tier 4: Distant competitors (different market, tangential)
- **Keyword-based monitoring** - Track competitors via configurable keywords
- **Domain and social handle tracking** - Associate multiple domains and social accounts
- **Active/inactive status management** - Pause tracking without losing historical data

### 2. Mention Tracking
- **Automated mention collection** - Capture competitor mentions from news, blogs, social media
- **Sentiment analysis** - Score each mention on a -1 to +1 sentiment scale
- **Topic extraction** - Automatically identify topics and themes
- **Outlet tier classification** - Categorize mentions by media outlet importance
- **Reach estimation** - Estimate audience reach for each mention

### 3. Metrics Snapshots
- **Periodic rollups** - Daily, weekly, and monthly snapshot aggregation
- **Volume metrics** - Mention count, article count, journalist count, outlet count
- **Sentiment metrics** - Average sentiment, distribution, stability score
- **Visibility metrics** - EVI score, estimated reach, share of voice
- **Comparative differentials** - Track gaps vs your brand over time

### 4. Comparative Analytics
- **Head-to-head comparison** - Compare your brand metrics against each competitor
- **Advantage scoring** - Calculate overall advantage score (-100 to +100)
- **Strength/weakness identification** - Automatically identify advantage and threat areas
- **Metric differentials** - Volume, sentiment, EVI, visibility, journalists, outlets

### 5. Overlap Analysis
- **Journalist overlap** - Identify journalists covering both you and competitors
- **Outlet overlap** - Find common media outlets in coverage
- **Topic overlap** - Discover shared themes and narratives
- **Exclusivity scoring** - Measure differentiation in media relationships
- **Strategic recommendations** - Get actionable advice on overlap opportunities

### 6. AI-Generated Insights
- **Automatic insight generation** - LLM-powered strategic analysis
- **Categorized insights**:
  - **Advantage** - Areas where you're winning
  - **Threat** - Areas where competitors are gaining
  - **Opportunity** - Gaps to exploit
  - **Trend** - Emerging patterns
  - **Anomaly** - Unusual activity alerts
  - **Recommendation** - Strategic suggestions
- **Impact and confidence scoring** - Prioritize insights by relevance
- **User feedback loop** - Mark insights as read, dismiss, or provide feedback

## Architecture

### Backend Components
- `competitorIntelligenceService.ts` - Core business logic
- `competitorIntelligence/index.ts` - API routes (Fastify)
- Database tables:
  - `ci_competitors` - Competitor profiles
  - `ci_competitor_mentions` - Individual mentions
  - `ci_competitor_metrics_snapshots` - Time-series metrics
  - `ci_competitor_insights` - AI-generated insights
  - `ci_competitor_overlap` - Overlap analysis records

### Frontend Components
- `CompetitorCard` - Competitor profile card with metrics
- `CompetitorScoreBadge` - Tier/EVI/sentiment badges
- `CompetitorInsightPanel` - Insight display with actions
- `CompetitorTrendChart` - Trend visualization
- `CompetitorComparisonDrawer` - Side-by-side comparison
- `CompetitorForm` - Add/edit competitor form
- Dashboard page with 4 tabs: Overview, Competitors, Insights, Trends

### Types and Validators
- `@pravado/types/competitiveIntelligence` - TypeScript interfaces
- `@pravado/validators/competitiveIntelligence` - Zod schemas with CI prefix

## API Endpoints

### Competitor Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/competitors` | Create new competitor |
| GET | `/competitors` | List competitors with filters |
| GET | `/competitors/:id` | Get competitor by ID |
| PATCH | `/competitors/:id` | Update competitor |
| DELETE | `/competitors/:id` | Delete competitor |

### Mention Tracking
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/mentions` | Create mention record |
| GET | `/mentions` | List mentions with filters |

### Metrics & Snapshots
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/competitors/:id/snapshots` | Create metrics snapshot |
| GET | `/snapshots` | List snapshots with filters |
| GET | `/competitors/:id/metrics` | Get competitor metrics summary |

### Comparative Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/competitors/:id/compare` | Get comparative analytics |
| POST | `/competitors/:id/overlap` | Analyze overlap |
| GET | `/overlap` | List overlap records |

### Insights
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/insights` | Create insight |
| GET | `/insights` | List insights with filters |
| PATCH | `/insights/:id` | Update insight status |
| POST | `/insights/generate` | Generate AI insight |

### Evaluation
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/competitors/:id/evaluate` | Full competitor evaluation |

## Data Flow

```
Media Monitoring → Mention Detection → Competitor Match
                                          ↓
                                   Mention Storage
                                          ↓
                                   Snapshot Rollup
                                          ↓
                              ┌──────────┴──────────┐
                              ↓                     ↓
                    Comparative Analytics    Overlap Analysis
                              ↓                     ↓
                              └──────────┬──────────┘
                                         ↓
                                  Insight Generation
                                         ↓
                                   Dashboard Display
```

## Integration Points

- **Media Monitoring Service** - Source of raw mention data
- **Journalist Graph** - Journalist identity resolution for overlap
- **Press Release Generator** - Competitor insights inform messaging
- **PR Pitch Engine** - Target journalists based on competitor gaps

## Performance Considerations

- Snapshot aggregation runs on scheduled intervals (not real-time)
- Large overlap analyses cached for 1 hour
- Insight generation rate-limited to prevent LLM cost overruns
- Pagination enforced on all list endpoints (max 100 per page)

## Security

- All endpoints require organization authentication
- Competitor data scoped by `org_id`
- No cross-tenant data access
- Sensitive API keys stored in environment variables

## Future Enhancements (V2)

- Real-time mention streaming
- Competitor social media monitoring
- Automated keyword suggestions
- Predictive competitor activity forecasting
- Export to PowerPoint/PDF reports
- Slack/Teams integration for insight alerts
