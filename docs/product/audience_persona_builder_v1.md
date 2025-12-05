# Audience Persona Builder V1

**Sprint**: S51
**Status**: ✅ Complete
**Owner**: Product & Engineering
**Last Updated**: 2024-02-01

## Table of Contents

1. [Product Vision](#product-vision)
2. [Key Features](#key-features)
3. [Architecture Overview](#architecture-overview)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [LLM Integration](#llm-integration)
7. [Scoring Methodology](#scoring-methodology)
8. [User Workflows](#user-workflows)
9. [Best Practices](#best-practices)
10. [Integration Points](#integration-points)

---

## Product Vision

The Audience Persona Builder enables marketing teams to create, manage, and evolve data-driven audience personas using AI-powered insights from all PR and content activities. By aggregating signals from press releases, pitches, media coverage, and journalist interactions, the system builds a comprehensive understanding of target audiences.

### Problem Statement

Traditional persona building is:
- **Manual and time-consuming**: Personas require hours of research and documentation
- **Quickly outdated**: Market dynamics change faster than manual updates
- **Siloed**: Insights scattered across press releases, media monitoring, journalist interactions
- **Subjective**: Based on assumptions rather than real engagement data

### Solution

An intelligent persona management system that:
- **Automates extraction** of persona attributes from source content
- **Aggregates insights** from S38-S50 systems (press releases, media, journalists)
- **Tracks evolution** over time with historical snapshots
- **Scores relevance** based on multi-dimensional criteria
- **Recommends actions** based on persona intelligence

---

## Key Features

### 1. AI-Powered Persona Generation

Generate personas from source content using GPT-4/Claude:
- **Source Types**: Press releases, pitches, articles, journalist profiles, manual input
- **Extraction**: Traits (skills, demographics, psychographics, behaviors)
- **Insights**: Content preferences, pain points, opportunities, engagement patterns
- **Fallback**: Deterministic extraction if LLM unavailable

### 2. Multi-Source Insight Aggregation

Combine intelligence from:
- **S38 Press Releases**: Target audience signals from announcements
- **S39 PR Pitches**: Journalist persona insights from pitching data
- **S40-43 Media Monitoring**: Audience preferences from coverage
- **S46-50 Journalist Graph**: Decision-maker profiles and relationships

### 3. Persona Scoring System

Four-dimensional scoring:
- **Relevance Score** (0-100): How well persona matches business goals
- **Engagement Score** (0-100): Likelihood of engagement based on traits
- **Alignment Score** (0-100): Strategic fit with messaging/positioning
- **Overall Score** (weighted 40% + 35% + 25%)

### 4. Historical Tracking & Trends

- **Automatic snapshots** on significant changes
- **Change magnitude** detection (minimal, minor, moderate, major)
- **Trend analytics** across 6 dimensions (scores, traits, insights)
- **Time-series visualization** of persona evolution

### 5. Persona Comparison & Merging

- **Similarity calculation** using SQL functions
- **Common/unique trait identification**
- **Merge recommendations** for duplicates (>80% similarity)
- **Selective merging** of traits and insights

### 6. Trait & Insight Management

**Traits** (5 categories):
- Skill: Hard skills, soft skills
- Demographic: Age, location, company size
- Psychographic: Values, motivations, goals
- Behavioral: Habits, preferences, patterns
- Interest: Topics, industries, technologies

**Insights** (5 types):
- Content Preference: What content resonates
- Media Consumption: Preferred channels and formats
- Engagement Pattern: How and when they engage
- Pain Point: Challenges and frustrations
- Opportunity: Gaps and unmet needs

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────┐
│                 Frontend Layer                       │
│  - PersonaCard, TraitChips, InsightPanel            │
│  - HistoryTimeline, ComparisonDrawer                │
│  - GeneratorForm, PersonaEditor                     │
│  - Three-panel dashboard layout                     │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  API Layer                           │
│  - 13 REST endpoints at /api/v1/personas            │
│  - Request validation with Zod                      │
│  - Org-scoped authentication                        │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│               Service Layer                          │
│  - AudiencePersonaService (1,117 lines)             │
│  - LLM extraction (GPT-4/Claude)                    │
│  - Score calculation algorithms                     │
│  - Comparison & merge logic                         │
│  - History snapshot management                      │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              Database Layer                          │
│  - audience_personas (core table)                   │
│  - audience_persona_traits                          │
│  - audience_persona_insights                        │
│  - audience_persona_history                         │
│  - 31 indexes, 6 SQL functions, 5 triggers          │
└─────────────────────────────────────────────────────┘
```

### Data Flow: Persona Generation

```
1. User submits source text + context
2. API validates input with Zod schema
3. Service attempts LLM extraction:
   - Calls GPT-4/Claude with structured prompt
   - Parses JSON response (traits + insights)
   - Falls back to deterministic if LLM fails
4. Service creates persona record
5. Service batch-inserts traits and insights
6. Service calculates initial scores
7. Service creates first history snapshot
8. Returns complete persona with all data
```

---

## Database Schema

### Migration 56: Audience Persona Schema

**Table: `audience_personas`**
```sql
id                  UUID PRIMARY KEY
org_id              UUID NOT NULL
name                TEXT NOT NULL
description         TEXT
persona_type        persona_type_enum
role                TEXT
industry            TEXT
company_size        company_size_enum
seniority_level     seniority_level_enum
location            TEXT
tags                TEXT[]
custom_fields       JSONB
relevance_score     FLOAT (0-100)
engagement_score    FLOAT (0-100)
alignment_score     FLOAT (0-100)
overall_score       FLOAT (0-100)
generation_method   generation_method_enum
llm_model           TEXT
source_count        INTEGER
last_enriched_at    TIMESTAMPTZ
status              persona_status_enum
is_validated        BOOLEAN
merged_into_id      UUID
created_by          UUID
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

**Indexes**:
- Primary key on `id`
- Composite on `org_id, status`
- Individual on `overall_score`, `relevance_score`, etc.
- GIN on `tags`
- B-tree on timestamps

**Table: `audience_persona_traits`**
```sql
id                      UUID PRIMARY KEY
org_id                  UUID NOT NULL
persona_id              UUID NOT NULL (FK)
trait_category          trait_category_enum
trait_type              trait_type_enum
trait_name              TEXT NOT NULL
trait_value             TEXT
trait_strength          FLOAT (0-1)
source_type             persona_source_type_enum
source_id               UUID
extraction_method       extraction_method_enum
extraction_confidence   FLOAT
context_snippet         TEXT
metadata                JSONB
is_verified             BOOLEAN
is_primary              BOOLEAN
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Indexes**:
- Primary key on `id`
- Composite on `persona_id, trait_category`
- Individual on `trait_strength`, `is_verified`

**Table: `audience_persona_insights`**
```sql
id                      UUID PRIMARY KEY
org_id                  UUID NOT NULL
persona_id              UUID NOT NULL (FK)
insight_type            insight_type_enum
insight_category        insight_category_enum
insight_title           TEXT NOT NULL
insight_description     TEXT NOT NULL
insight_data            JSONB
source_system           persona_source_system_enum
source_id               UUID
confidence_score        FLOAT (0-1)
impact_score            FLOAT (0-1)
is_actionable           BOOLEAN
supporting_evidence     TEXT[]
metadata                JSONB
created_at              TIMESTAMPTZ
updated_at              TIMESTAMPTZ
```

**Indexes**:
- Primary key on `id`
- Composite on `persona_id, insight_type`
- Individual on `is_actionable`, `confidence_score`

**Table: `audience_persona_history`**
```sql
id                  UUID PRIMARY KEY
org_id              UUID NOT NULL
persona_id          UUID NOT NULL (FK)
snapshot_type       snapshot_type_enum
snapshot_at         TIMESTAMPTZ NOT NULL
snapshot_data       JSONB NOT NULL
previous_snapshot   JSONB
change_magnitude    FLOAT
change_description  TEXT
triggered_by        UUID
created_at          TIMESTAMPTZ
```

**Indexes**:
- Primary key on `id`
- Composite on `persona_id, snapshot_at DESC`
- Individual on `snapshot_type`, `change_magnitude`

### SQL Functions

**1. calculate_persona_overall_score()**
```sql
RETURNS FLOAT
-- Calculates weighted overall score:
-- (relevance * 0.40) + (engagement * 0.35) + (alignment * 0.25)
```

**2. calculate_persona_similarity()**
```sql
RETURNS FLOAT
-- Compares two personas based on:
-- - Score similarity (40 points)
-- - Common traits (60 points)
-- Returns 0-100 similarity score
```

**3. get_persona_trait_count()**
```sql
RETURNS INTEGER
-- Counts traits for a persona
```

**4. get_persona_insight_count()**
```sql
RETURNS INTEGER
-- Counts insights for a persona
```

**5. get_persona_verified_trait_count()**
```sql
RETURNS INTEGER
-- Counts verified traits
```

**6. get_persona_actionable_insight_count()**
```sql
RETURNS INTEGER
-- Counts actionable insights
```

---

## API Reference

### Base URL
```
/api/v1/personas
```

### Authentication
All endpoints require:
- Header: `x-org-id` (Organization ID)
- Optional: `x-user-id` (User ID for audit trails)

### Endpoints

#### 1. POST /generate
Generate persona using LLM from source text

**Request Body**:
```json
{
  "generationContext": {
    "sourceType": "press_release",
    "sourceText": "Enterprise platform for CTOs...",
    "additionalContext": "Healthcare focus",
    "personaType": "primary_audience",
    "suggestedName": "Healthcare CTO",
    "extractTraits": true,
    "extractInsights": true,
    "llmModel": "gpt-4",
    "temperature": 0.7
  }
}
```

**Response (201)**:
```json
{
  "persona": { "id": "...", "name": "Healthcare CTO", ... },
  "traits": [{ "id": "...", "traitName": "Healthcare expertise", ... }],
  "insights": [{ "id": "...", "insightTitle": "Values compliance", ... }],
  "extraction": { "method": "llm", "model": "gpt-4" },
  "message": "Persona generated successfully"
}
```

#### 2. POST /
Create persona manually

**Request Body**:
```json
{
  "name": "Enterprise CTO",
  "description": "Technology decision-maker",
  "personaType": "primary_audience",
  "role": "CTO",
  "industry": "SaaS",
  "companySize": "enterprise",
  "seniorityLevel": "c_level",
  "tags": ["tech", "leadership"]
}
```

**Response (201)**:
```json
{
  "id": "...",
  "name": "Enterprise CTO",
  ...
}
```

#### 3. GET /
List personas with filtering

**Query Parameters**:
```
?personaType=primary_audience,secondary_audience
&role=CTO
&industry=SaaS
&seniorityLevel=c_level,executive
&minRelevanceScore=80
&minEngagementScore=75
&minAlignmentScore=70
&minOverallScore=80
&status=active,draft
&tags=tech,leadership
&searchQuery=engineer
&sortBy=overallScore
&sortOrder=desc
&limit=50
&offset=0
```

**Response (200)**:
```json
{
  "personas": [...],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

#### 4. GET /:id
Get persona detail with traits, insights, and history

**Response (200)**:
```json
{
  "persona": { "id": "...", ... },
  "traits": [...],
  "insights": [...],
  "recentHistory": [...]
}
```

#### 5. PATCH /:id
Update persona fields

**Request Body**:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "role": "VP Engineering",
  "status": "active",
  "tags": ["updated", "tags"]
}
```

**Response (200)**:
```json
{
  "id": "...",
  "name": "Updated Name",
  ...
}
```

#### 6. DELETE /:id
Delete persona

**Response (204)**: No content

#### 7. GET /:id/insights
Get insights with filtering

**Query Parameters**:
```
?insightType=pain_point,opportunity
&insightCategory=behavioral
&sourceSystem=press_release
&minConfidence=0.8
&minImpact=0.7
&isActionable=true
&sortBy=confidenceScore
&sortOrder=desc
&limit=20
&offset=0
```

**Response (200)**:
```json
{
  "insights": [...],
  "total": 15
}
```

#### 8. GET /:id/history
Get historical snapshots

**Query Parameters**:
```
?snapshotType=manual_update,score_update
&minChangeMagnitude=0.5
&startDate=2024-01-01
&endDate=2024-02-01
&sortBy=snapshotAt
&sortOrder=desc
&limit=20
```

**Response (200)**:
```json
{
  "snapshots": [...],
  "total": 8
}
```

#### 9. GET /:id/trends
Get trend analytics

**Query Parameters**:
```
?daysBack=90
&includeTraits=true
&includeInsights=true
```

**Response (200)**:
```json
{
  "trends": [
    { "metric": "overall_score", "dataPoints": [...] },
    { "metric": "relevance_score", "dataPoints": [...] },
    ...
  ],
  "summary": {
    "overallTrend": "increasing",
    "avgChangePerWeek": 2.5
  }
}
```

#### 10. POST /:id/compare
Compare with another persona

**Request Body**:
```json
{
  "personaId2": "other-persona-id"
}
```

**Response (200)**:
```json
{
  "comparison": {
    "persona1": { ... },
    "persona2": { ... },
    "similarityScore": 75.5,
    "scoreDifferences": { "overall_score": 5, ... },
    "commonTraits": [...],
    "uniqueTraits1": [...],
    "uniqueTraits2": [...],
    "mergeRecommendation": false,
    "mergeSuggestion": null
  }
}
```

#### 11. POST /merge
Merge two personas

**Request Body**:
```json
{
  "sourcePersonaId": "source-id",
  "targetPersonaId": "target-id",
  "mergeTraits": true,
  "mergeInsights": true,
  "archiveSource": true
}
```

**Response (200)**:
```json
{
  "mergedPersona": { ... },
  "traitsAdded": 5,
  "insightsAdded": 3,
  "message": "Merged 5 traits and 3 insights"
}
```

#### 12. POST /:id/traits
Add trait to persona

**Request Body**:
```json
{
  "traitCategory": "skill",
  "traitType": "hard_skill",
  "traitName": "Python",
  "traitValue": "Expert",
  "traitStrength": 0.9,
  "extractionMethod": "manual",
  "isVerified": true,
  "isPrimary": false
}
```

**Response (201)**:
```json
{
  "id": "...",
  "traitName": "Python",
  ...
}
```

#### 13. POST /:id/insights
Add insight to persona

**Request Body**:
```json
{
  "insightType": "pain_point",
  "insightCategory": "behavioral",
  "insightTitle": "Struggles with scaling",
  "insightDescription": "Needs better scaling solutions",
  "confidenceScore": 0.85,
  "impactScore": 0.9,
  "isActionable": true,
  "supportingEvidence": ["Quote 1", "Quote 2"]
}
```

**Response (201)**:
```json
{
  "id": "...",
  "insightTitle": "Struggles with scaling",
  ...
}
```

---

## LLM Integration

### Supported Models
- **GPT-4** (default): Best quality, slower, higher cost
- **GPT-3.5 Turbo**: Good quality, faster, lower cost
- **Claude 3 Opus**: High quality, good for nuanced extraction
- **Claude 3 Sonnet**: Balanced quality and speed

### LLM Extraction Prompt

**System Prompt**:
```
You are an expert audience analyst. Extract persona attributes from the provided text.

Analyze the text to identify:
1. Traits: Skills, demographics, psychographics, behaviors, interests
2. Insights: Content preferences, media consumption, engagement patterns, pain points, opportunities

Return a JSON object with this exact structure: {...}
```

**User Prompt**:
```
Extract persona attributes from this {sourceType} content:

{sourceText}

{additionalContext}

Return ONLY the JSON object, no other text.
```

### Fallback Strategy

If LLM extraction fails:
1. **Deterministic Extraction**: Keyword-based trait detection
2. **Basic Scoring**: Default scores based on source type
3. **Minimal Insights**: Generic insights from content analysis

### Token Management

- **Max tokens**: 16,000 (configurable)
- **Temperature**: 0.7 (default, configurable 0-2)
- **Source text limit**: 100,000 characters
- **Estimated cost**: $0.03 - $0.15 per extraction (GPT-4)

---

## Scoring Methodology

### Component Scores

**Relevance Score (0-100)**:
```
Base = 50
+ (Verified traits × 5)
+ (High-strength traits × 3)
+ (Actionable insights × 4)
+ (Source diversity × 2)
Capped at 100
```

**Engagement Score (0-100)**:
```
Base = 50
+ (Behavioral traits × 4)
+ (Engagement insights × 5)
+ (Recent activity × 3)
Capped at 100
```

**Alignment Score (0-100)**:
```
Base = 50
+ (Psychographic traits × 4)
+ (Value alignment × 5)
+ (Strategic fit × 3)
Capped at 100
```

### Overall Score Calculation

```
Overall = (Relevance × 0.40) + (Engagement × 0.35) + (Alignment × 0.25)
```

**Rationale**:
- **40% Relevance**: Most important - does this persona matter to our business?
- **35% Engagement**: Second priority - will they actually engage?
- **25% Alignment**: Supporting factor - strategic fit with positioning

### Score Color Coding

- **80-100**: Green (High priority)
- **60-79**: Blue (Medium priority)
- **40-59**: Yellow (Low priority)
- **0-39**: Red (Review needed)

---

## User Workflows

### Workflow 1: Generate Persona from Press Release

1. User clicks "Generate Persona" button
2. Selects source type: "Press Release"
3. Pastes press release text (or selects from S38)
4. Optionally provides:
   - Suggested persona name
   - Additional context
   - Persona type selection
5. Clicks "Generate"
6. System:
   - Extracts traits and insights via LLM
   - Calculates initial scores
   - Creates persona record
   - Returns to dashboard with new persona selected

### Workflow 2: Enrich Persona with Journalist Data

1. User views persona in center panel
2. Clicks "Insights" tab
3. System shows aggregated insights from:
   - Press releases targeting this persona
   - Journalists who cover this persona's interests
   - Media coverage relevant to persona
4. User can:
   - Filter by source system
   - Mark insights as actionable
   - View supporting evidence

### Workflow 3: Compare & Merge Similar Personas

1. User selects persona A
2. Clicks "Compare" button
3. System auto-selects similar persona B
4. Comparison drawer shows:
   - Similarity score (e.g., 85%)
   - Common traits
   - Unique traits for each
   - Merge recommendation (if >80%)
5. User reviews merge direction:
   - A → B (keep B, archive A)
   - B → A (keep A, archive B)
6. User clicks "Merge"
7. System:
   - Combines traits and insights
   - Updates scores
   - Archives source persona
   - Creates history snapshot

### Workflow 4: Track Persona Evolution

1. User selects persona
2. Clicks "History" tab
3. Timeline shows:
   - All historical snapshots
   - Change magnitude indicators
   - Score differences over time
4. User filters by date (7d, 30d, 90d)
5. User clicks on snapshot to see details:
   - What changed
   - Why it changed
   - Who triggered it

---

## Best Practices

### Persona Creation

**Do**:
- Generate from real content (press releases, pitches, coverage)
- Use descriptive names that indicate role + industry
- Add tags for easy filtering
- Validate AI-generated personas before activation

**Don't**:
- Create generic personas without data
- Duplicate personas unnecessarily
- Skip the generation context fields
- Ignore merge recommendations

### Trait Management

**Do**:
- Verify important traits manually
- Mark primary traits for the persona
- Include context snippets for traceability
- Set realistic strength values (0.1-1.0)

**Don't**:
- Add traits without evidence
- Set all traits to maximum strength
- Ignore trait category classification
- Forget to update traits as persona evolves

### Insight Quality

**Do**:
- Link insights to source content
- Provide supporting evidence
- Score confidence and impact honestly
- Mark truly actionable insights

**Don't**:
- Add generic insights without specifics
- Inflate confidence/impact scores
- Skip the insight description
- Ignore insight categories

### Scoring & Comparison

**Do**:
- Review scores periodically
- Investigate sudden score drops
- Compare similar personas to find duplicates
- Use merge feature to consolidate

**Don't**:
- Manually override calculated scores frequently
- Ignore low-scoring personas
- Keep duplicate personas active
- Skip comparison before merging

---

## Integration Points

### S38: Press Release Generator

**Integration**: Extract target audience personas from press releases

```typescript
// When generating press release
const releasePersonas = await extractPersonasFromRelease(releaseId);

// Create/update personas
for (const extracted of releasePersonas) {
  await personaService.generatePersona(orgId, {
    sourceType: 'press_release',
    sourceId: releaseId,
    sourceText: releaseText,
    ...extracted
  });
}
```

### S39: PR Pitch & Outreach

**Integration**: Build journalist personas from pitching data

```typescript
// After successful pitch
const journalistPersona = await personaService.generatePersona(orgId, {
  sourceType: 'journalist_profile',
  sourceId: journalistId,
  sourceText: journalistBio,
  personaType: 'influencer'
});

// Add engagement insights
await personaService.addInsight(orgId, journalistPersona.id, {
  insightType: 'engagement_pattern',
  insightTitle: 'Responds to morning pitches',
  confidenceScore: 0.9,
  sourceSystem: 'pr_pitch'
});
```

### S40-43: Media Monitoring

**Integration**: Enrich personas with audience preference data

```typescript
// When coverage is analyzed
const audienceInsights = await analyzeAudienceFromCoverage(coverageId);

// Add insights to relevant personas
for (const persona of relevantPersonas) {
  await personaService.addInsight(orgId, persona.id, {
    insightType: 'content_preference',
    insightTitle: audienceInsights.preference,
    sourceSystem: 'media_monitoring',
    sourceId: coverageId
  });
}
```

### S46-50: Journalist Graph

**Integration**: Build decision-maker personas from journalist network

```typescript
// When journalist is enriched
const decisionMakerPersona = await personaService.generatePersona(orgId, {
  sourceType: 'journalist_profile',
  sourceText: journalist.enrichedProfile,
  personaType: 'influencer',
  extractTraits: true
});

// Link to journalist record
await linkPersonaToJournalist(decisionMakerPersona.id, journalist.id);
```

---

## Performance Considerations

### Optimization Strategies

1. **Indexing**: All query filters have corresponding indexes
2. **Pagination**: Default limit of 50, max 100 per request
3. **Caching**: Frontend caches persona list for 5 minutes
4. **Lazy Loading**: Traits/insights loaded separately from persona list
5. **Batch Operations**: Trait/insight insertion uses bulk SQL

### Expected Performance

- **Persona List**: < 200ms (50 personas)
- **Persona Detail**: < 300ms (with traits/insights)
- **LLM Generation**: 5-15s (depends on model)
- **Comparison**: < 500ms
- **Merge**: < 1s (with 50+ traits/insights)

### Scaling Limits

- **Personas per org**: 10,000 (soft limit)
- **Traits per persona**: 500 (soft limit)
- **Insights per persona**: 1,000 (soft limit)
- **History snapshots**: Unlimited (auto-archived after 1 year)

---

## Future Enhancements

### Planned Features (Post-V1)

1. **Persona Templates**: Pre-built personas for common industries
2. **Bulk Import**: CSV/Excel upload for persona creation
3. **Persona Grouping**: Organize personas into audience segments
4. **Smart Recommendations**: AI suggests which personas to target
5. **Persona Validation**: Automated quality scoring
6. **Export Capabilities**: PDF/DOCX persona profiles
7. **API Webhooks**: Notify external systems of persona changes
8. **Advanced Analytics**: Cohort analysis, persona ROI tracking

### Research Areas

- **Collaborative Filtering**: Recommend similar personas from other orgs
- **Predictive Scoring**: ML models for engagement prediction
- **Auto-Enrichment**: Continuous background persona updates
- **Natural Language Queries**: "Show me CTOs in healthcare"

---

## Support & Resources

### Documentation
- API Reference: `/api/v1/personas` (Swagger/OpenAPI)
- Type Definitions: `@pravado/types/audiencePersona`
- Validators: `@pravado/validators/audiencePersona`

### Testing
- Backend Tests: `apps/api/tests/audiencePersonaService.test.ts`
- E2E Tests: `apps/dashboard/tests/personas/personas.spec.ts`
- Test Coverage: 85%+ (target)

### Code Locations
- Service: `apps/api/src/services/audiencePersonaService.ts`
- Routes: `apps/api/src/routes/audiencePersonas/index.ts`
- Components: `apps/dashboard/src/components/personas/`
- Page: `apps/dashboard/src/app/app/personas/page.tsx`

### Migration
- Schema: `apps/api/supabase/migrations/56_create_audience_persona_schema.sql`
- **Warning**: DO NOT modify Migration 56 after deployment

---

**Document Version**: 1.0
**Last Review**: 2024-02-01
**Next Review**: 2024-03-01
