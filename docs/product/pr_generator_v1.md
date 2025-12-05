# Press Release Generator v1

**Sprint**: S38
**Status**: Implemented
**Feature Flag**: `ENABLE_PR_GENERATOR`

## Overview

The Press Release Generator is an AI-powered system that creates professional press releases with:
- Context-aware content assembly
- Narrative angle finding and scoring
- SEO-optimized headline generation
- Multi-section AP-style draft generation
- Readability and SEO optimization layer
- Vector embeddings for similarity search

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Dashboard (Next.js)                             │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐  │
│  │PRGeneratorForm  │  │PRGenerationResult│  │    PRSidebarList           │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────────┬───────────────┘  │
│           │                    │                          │                  │
│           └────────────────────┴──────────────────────────┘                  │
│                                       │                                       │
│                             pressReleaseApi.ts                               │
│                          (REST + SSE subscriptions)                          │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │ HTTP/SSE
┌──────────────────────────────────┴───────────────────────────────────────────┐
│                              API (Fastify)                                    │
│  ┌──────────────────────────────────────────────────────────────────────────┐│
│  │                    /api/v1/pr/releases routes                             ││
│  │  POST /generate         - Create press release                            ││
│  │  GET /                  - List press releases                             ││
│  │  GET /:id               - Get press release details                       ││
│  │  POST /:id/optimize     - Re-run optimization                             ││
│  │  GET /:id/embeddings/similar - Find similar releases                     ││
│  │  GET /:id/stream        - SSE for generation progress                     ││
│  └──────────────────────────────────────────────────────────────────────────┘│
│                                       │                                       │
│  ┌────────────────────────────────────┴──────────────────────────────────┐   │
│  │                      PressReleaseService                               │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │   │
│  │  │Context Assembler│  │   Angle Finder   │  │ Headline Generator  │   │   │
│  │  │                 │  │                   │  │                     │   │   │
│  │  │ - SEO context   │  │ - LLM generation │  │ - 10 variants       │   │   │
│  │  │ - Company info  │  │ - Scoring rubric │  │ - SEO scoring       │   │   │
│  │  │ - Personality   │  │ - Selection      │  │ - Virality scoring  │   │   │
│  │  │ - Memory        │  │                   │  │ - Selection         │   │   │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────────┘   │   │
│  │                                                                        │   │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌─────────────────────┐   │   │
│  │  │ Draft Generator │  │Optimization Layer│  │  Storage/CRUD       │   │   │
│  │  │                 │  │                   │  │                     │   │   │
│  │  │ - AP style      │  │ - SEO keywords   │  │ - Supabase          │   │   │
│  │  │ - Multi-section │  │ - Readability    │  │ - Vector storage    │   │   │
│  │  │ - Quotes        │  │ - Tone alignment │  │ - RLS policies      │   │   │
│  │  │ - Boilerplate   │  │                   │  │                     │   │   │
│  │  └─────────────────┘  └──────────────────┘  └─────────────────────┘   │   │
│  └────────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬───────────────────────────────────────────┘
                                   │
              ┌────────────────────┴────────────────┐
              │          Supabase DB                │
              │  ┌─────────────────────────────────┐│
              │  │ pr_generated_releases           ││
              │  │ pr_headline_variants            ││
              │  │ pr_angle_options                ││
              │  └─────────────────────────────────┘│
              └─────────────────────────────────────┘
```

## Generation Pipeline

### Phase 1: Context Assembly

```typescript
const context = await service.assembleContext(orgId, input);
// Returns:
{
  input: PRGenerationInput,
  seoKeywords: string[],
  seoOpportunities: PRSEOOpportunity[],
  companyFootprint: PRCompanyFootprint,
  personality: PRPersonalityContext | null,
  industryTrends: string[],
  competitorContext: string[]
}
```

Sources:
- **SEO Intelligence**: Keywords, search volume, difficulty
- **Content Intelligence**: Recent content, topics
- **Personality System**: Tone, voice attributes, writing style
- **Organization Data**: Company name, description, industry
- **User Input**: Announcement, spokespersons, preferences

### Phase 2: Angle Finding

```
┌─────────────────────────────────────────────────────────────────┐
│                     Angle Finding Process                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Generate 5 narrative angles (LLM or fallback)                │
│                                                                  │
│  2. Score each angle:                                            │
│     ├── Newsworthiness (40%): Timeliness, impact, significance  │
│     ├── Uniqueness (30%): Differentiation from typical PR       │
│     └── Relevance (30%): Alignment with keywords, announcement  │
│                                                                  │
│  3. Select highest scoring angle (or user-preferred)             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 3: Headline Generation

```
┌─────────────────────────────────────────────────────────────────┐
│                   Headline Scoring Rubric                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SEO Score (40%):                                                │
│    ├── Target keyword presence: +15 per keyword                  │
│    ├── Optimal length (8-15 words): +10                          │
│    ├── Company name presence: +10                                │
│    └── Too short/long: -15                                       │
│                                                                  │
│  Virality Score (35%):                                           │
│    ├── Power words (launches, announces, transforms): +8 each   │
│    ├── Numbers present: +10                                      │
│    └── Clickbait terms: -20                                      │
│                                                                  │
│  Readability Score (25%):                                        │
│    ├── Short average word length: +10                            │
│    ├── Long average word length: -15                             │
│    └── Complex punctuation: -10                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Phase 4: Draft Generation

AP Style Press Release Structure:
1. **Headline**: Selected from scored variants
2. **Subheadline**: One-sentence summary
3. **Dateline**: CITY, STATE, Date
4. **Opening Paragraph**: Who, what, when, where, why
5. **Body Paragraphs**: 2-4 paragraphs with details
6. **Quote #1**: From primary spokesperson
7. **Quote #2**: From secondary source (optional)
8. **Boilerplate**: About the company

### Phase 5: Optimization

```typescript
const optimized = await service.optimizeRelease(releaseId, orgId);
// Applies:
// - SEO keyword integration
// - Readability improvements
// - Passive voice reduction
// - Redundant phrase removal
// - Headline title case
```

## Angle Scoring Heuristics

| News Type | Base Newsworthiness | Typical Angles |
|-----------|---------------------|----------------|
| product_launch | +20 | Innovation, Customer Problem Solved |
| funding | +20 | Growth Acceleration, Investor Confidence |
| acquisition | +20 | Strategic Growth, Capabilities Expansion |
| partnership | +15 | Strategic Alignment, Market Synergy |
| executive_hire | +10 | Leadership, Industry Expertise |
| award | +10 | Industry Recognition, Excellence |
| other | 0 | Industry Leadership, Strategic Milestone |

## Headline Scoring Rules

### SEO Scoring
- **Keyword Match**: +15 per target keyword found
- **Optimal Length**: +10 for 8-15 words
- **Company Name**: +10 if company name present
- **Length Penalty**: -15 for <6 or >20 words

### Virality Scoring
- **Power Words**: +8 each (breakthrough, revolutionary, first, exclusive, announces, launches, unveils, transforms, innovates)
- **Numbers**: +10 if contains numeric data
- **Clickbait Penalty**: -20 for terms like "shocking", "unbelievable"

### Readability Scoring
- **Word Length**: +10 for avg <5 chars, -15 for avg >8 chars
- **Punctuation**: -10 for complex punctuation (semicolons, em-dashes)

## Optimization Engine

### Readability Optimizations
1. Split sentences longer than 150 characters at conjunctions
2. Replace verbose phrases with concise alternatives:
   - "in order to" → "to"
   - "due to the fact that" → "because"
   - "at this point in time" → "now"
   - "in the event that" → "if"

### Headline Optimizations
1. Apply title case capitalization
2. Lowercase articles, conjunctions, prepositions (except first word)

### SEO Optimizations
1. Track keyword density
2. Suggest additions for underused keywords
3. Flag overused keywords (>3% density)

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/pr/releases/generate` | Generate press release | Required |
| GET | `/api/v1/pr/releases` | List releases | Required |
| GET | `/api/v1/pr/releases/:id` | Get release details | Required |
| POST | `/api/v1/pr/releases/:id/optimize` | Re-run optimization | Required |
| GET | `/api/v1/pr/releases/:id/embeddings/similar` | Find similar | Required |
| GET | `/api/v1/pr/releases/:id/stream` | SSE progress | Required |

## SSE Events

```typescript
type PRSSEEventType =
  | 'started'     // Generation started
  | 'progress'    // Step progress update
  | 'completed'   // Generation complete
  | 'failed';     // Generation failed

// Progress event
{
  type: 'progress',
  step: 'context' | 'angles' | 'headlines' | 'draft' | 'seo',
  progress: number // 0-100
}
```

## Database Schema

```sql
-- Main releases table
CREATE TABLE pr_generated_releases (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL,
  user_id UUID NOT NULL,
  status pr_release_status NOT NULL,
  input_json JSONB,
  headline TEXT,
  subheadline TEXT,
  angle TEXT,
  body TEXT,
  dateline TEXT,
  quote_1 TEXT,
  quote_1_attribution TEXT,
  quote_2 TEXT,
  quote_2_attribution TEXT,
  boilerplate TEXT,
  seo_summary_json JSONB,
  readability_score FLOAT,
  embeddings vector(1536),
  word_count INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Headline variants
CREATE TABLE pr_headline_variants (
  id UUID PRIMARY KEY,
  release_id UUID REFERENCES pr_generated_releases,
  headline TEXT NOT NULL,
  score FLOAT,
  seo_score FLOAT,
  virality_score FLOAT,
  readability_score FLOAT,
  is_selected BOOLEAN
);

-- Angle options
CREATE TABLE pr_angle_options (
  id UUID PRIMARY KEY,
  release_id UUID REFERENCES pr_generated_releases,
  angle_title TEXT NOT NULL,
  angle_description TEXT,
  newsworthiness_score FLOAT,
  uniqueness_score FLOAT,
  relevance_score FLOAT,
  total_score FLOAT,
  is_selected BOOLEAN
);
```

## Example Output

### Input
```json
{
  "newsType": "product_launch",
  "companyName": "TechCorp",
  "announcement": "AI-powered analytics platform",
  "spokespersonName": "Jane Smith",
  "spokespersonTitle": "CEO",
  "targetKeywords": ["AI", "analytics", "business intelligence"]
}
```

### Generated Press Release
```
HEADLINE:
TechCorp Launches Revolutionary AI-Powered Analytics Platform

SUBHEADLINE:
TechCorp unveils cutting-edge business intelligence solution

DATELINE:
SAN FRANCISCO, CA, November 22, 2025

BODY:
TechCorp today announced the launch of its AI-powered analytics platform,
marking a significant milestone in the company's mission to transform
business intelligence.

The new platform leverages advanced artificial intelligence to provide
real-time insights and predictive analytics for enterprise customers.
This development positions TechCorp at the forefront of the rapidly
evolving analytics market.

"We are excited to bring this innovative solution to market," said
Jane Smith, CEO of TechCorp. "Our AI-powered platform will help
businesses make smarter, data-driven decisions faster than ever before."

For more information about TechCorp and its offerings, please visit
the company website.

###

About TechCorp: TechCorp is a leading technology company specializing
in artificial intelligence and analytics solutions for enterprise customers.
```

## Configuration

### Feature Flag
```typescript
ENABLE_PR_GENERATOR: true
```

### Environment Variables
- `LLM_ANTHROPIC_API_KEY`: Required for AI generation
- `SUPABASE_URL`: Database connection
- `SUPABASE_SERVICE_ROLE_KEY`: Service account key

## Limitations

1. **LLM Dependency**: Full functionality requires LLM API access
2. **Fallback Mode**: Works with deterministic generation when LLM unavailable
3. **Embedding Model**: Uses simplified embeddings (production would use dedicated model)
4. **Single Language**: Currently supports English only

## Future Enhancements

1. **Multi-language Support**: Generate PRs in multiple languages
2. **Template Library**: Pre-built templates for common scenarios
3. **Distribution Integration**: Direct publishing to wire services
4. **A/B Testing**: Test multiple headlines with audience
5. **Performance Tracking**: Track PR performance metrics
6. **Collaboration**: Multi-user editing and approval workflows
