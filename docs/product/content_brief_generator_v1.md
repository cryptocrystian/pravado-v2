# Content Brief Generator V1 (Sprint S13)

**Status:** ✅ Implemented
**Sprint:** S13
**Dependencies:** S7 (Playbook Runtime), S10 (Memory V2), S11 (Personality Engine), S12 (Content Intelligence), S4-S5 (SEO Intelligence)
**Related Docs:** [Content Intelligence V1](./content_intelligence_v1.md), [AI Personality V1](./ai_personality_v1.md), [AI Memory V2](./ai_memory_v2.md), [AI Playbooks Runtime](./ai_playbooks_runtime.md)

## Overview

The **Content Brief Generator V1** is an AI-assisted system for creating comprehensive, structured content briefs. It orchestrates multiple intelligence pillars (Content, SEO, Memory, Personality) through a three-step playbook workflow to generate high-quality briefs that include:

- Target keyword and search intent
- Target audience and tone specifications
- Detailed content outline with sections and key points
- SEO guidelines (primary/secondary keywords, meta description)
- Word count recommendations
- Context from memory (user preferences) and content patterns

**S13 Implementation Note:** This version uses **deterministic stub outputs** rather than real LLM API calls. The full playbook execution structure is in place, but LLM integration is scheduled for S16.

## Core Concepts

### Generated Brief

A `GeneratedBrief` is the output of the brief generation process:

```typescript
interface GeneratedBrief {
  id: string;
  orgId: string;
  contentItemId: string | null;      // Optional link to content item
  playbookRunId: string | null;      // Execution tracking
  brief: Record<string, unknown>;    // Full brief structure
  outline: Record<string, unknown>;  // Detailed outline
  seoContext: Record<string, unknown>;
  personalityUsed: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
```

### Brief Generation Input

Users provide minimal input to generate a brief:

```typescript
interface BriefGenerationInput {
  contentItemId?: string;            // Optional: link to content item
  targetKeyword?: string;            // Optional: primary keyword
  targetIntent?: 'informational' | 'navigational' | 'commercial' | 'transactional';
  personalityId?: string;            // Optional: personality override
}
```

### Brief Structure

The generated brief contains:

```typescript
{
  title: string;
  targetKeyword: string;
  targetIntent: string;
  targetAudience: string;
  tone: string;
  minWordCount: number;
  maxWordCount: number;
  outline: {
    introduction: {
      hook: string;
      context: string;
      thesis: string;
    };
    mainSections: Array<{
      title: string;
      keyPoints: string[];
    }>;
    conclusion: {
      summary: string;
      cta: string;
    };
  };
  seoGuidelines: {
    primaryKeyword: string;
    secondaryKeywords: string[];
    metaDescription: string;
    targetSearchVolume: number | null;
  };
  createdBy: string;
  createdAt: string;
}
```

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│              Brief Generation Workflow                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  User Input                                              │
│    │                                                     │
│    ├─► BriefGeneratorService.generateBrief()            │
│         │                                                │
│         ├─► Step 1: Build Generation Context            │
│         │    ├─► Fetch Content Item (if provided)       │
│         │    ├─► Assemble SEO Context                   │
│         │    ├─► Assemble Memory Context                │
│         │    ├─► Assemble Content Context               │
│         │    └─► Get Personality Profile                │
│         │                                                │
│         ├─► Step 2: Run Playbook                        │
│         │    ├─► GATHER_CONTEXT (merge signals)         │
│         │    ├─► GENERATE_OUTLINE (structure)           │
│         │    └─► GENERATE_BRIEF (full brief)            │
│         │                                                │
│         ├─► Step 3: Extract Brief from Output           │
│         │                                                │
│         └─► Step 4: Save to Database                    │
│              └─► Return GeneratedBrief                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Input → Context Assembly → Playbook Execution → Brief Extraction → Storage
  │           │                    │                    │              │
  │           │                    │                    │              │
  │     ┌─────▼──────┐      ┌─────▼──────┐      ┌─────▼──────┐      │
  │     │ SEO        │      │ GATHER     │      │ GENERATE   │      │
  │     │ Memory     │      │ CONTEXT    │      │ OUTLINE    │      │
  │     │ Content    │      │            │      │            │      │
  │     │ Personality│      │            │      │            │      │
  │     └────────────┘      └────────────┘      └────────────┘      │
  │                                │                    │            │
  │                                └──────────┬─────────┘            │
  │                                           │                      │
  │                                    ┌──────▼──────┐              │
  │                                    │ GENERATE    │              │
  │                                    │ BRIEF       │              │
  │                                    │             │              │
  │                                    └─────────────┘              │
  │                                           │                      │
  └───────────────────────────────────────────▼──────────────────────┘
                                    Generated Brief → DB
```

## Playbook Steps

The brief generation process follows a three-step playbook:

### Step 1: GATHER_CONTEXT

**Purpose:** Collect and merge all relevant context for brief generation

**Inputs:**
- `targetKeyword`: Primary keyword
- `targetIntent`: Search intent
- `contentItem`: Content item data (optional)
- `seoContext`: SEO signals (keywords, opportunities)
- `memoryContext`: Recent interactions and preferences
- `contentContext`: Recent content, clusters, gaps
- `personality`: Personality profile for tone/style

**Outputs:**
- `mergedContext`: Combined context object
- `seoSignals`: Relevant SEO data
- `contentSignals`: Content patterns
- `memorySignals`: User preferences

**Handler:** Data merge operation (no LLM in S13)

### Step 2: GENERATE_OUTLINE

**Purpose:** Generate structured outline based on context

**Inputs:**
- `mergedContext`: From GATHER_CONTEXT step
- `targetKeyword`: Primary keyword
- `targetIntent`: Search intent
- `personality`: Tone and style preferences

**Outputs:**
- `outline`: Structured outline object
  - `title`: Compelling title
  - `sections`: Array of sections with headings, descriptions, word counts
  - `estimatedWordCount`: Total estimated words

**Handler:** Stub outline generator (S13), LLM-based generator (S16+)

**Prompt Template (for S16+):**
```
Generate a detailed content outline for: {{targetKeyword}}
Intent: {{targetIntent}}
Tone: {{personality.tone}}

Include:
- Compelling title
- 4-6 main sections with descriptions
- Estimated word counts per section
- Total estimated word count

Context:
{{mergedContext}}
```

### Step 3: GENERATE_BRIEF

**Purpose:** Generate complete content brief with all details

**Inputs:**
- `outline`: From GENERATE_OUTLINE step
- `mergedContext`: From GATHER_CONTEXT step
- `targetKeyword`: Primary keyword
- `targetIntent`: Search intent
- `personality`: Tone and style preferences
- `seoContext`: SEO signals for optimization

**Outputs:**
- `brief`: Complete brief object (see Brief Structure above)

**Handler:** Stub brief generator (S13), LLM-based generator (S16+)

**Prompt Template (for S16+):**
```
Generate a comprehensive content brief for: {{targetKeyword}}

Intent: {{targetIntent}}
Tone: {{personality.tone}}
Style: {{personality.style}}

Outline:
{{outline}}

SEO Context:
{{seoContext}}

Requirements:
- Define target audience
- Specify word count range ({{outline.estimatedWordCount}} +/- 500)
- Include detailed outline with key points per section
- Provide SEO guidelines (primary/secondary keywords, meta description)
- Ensure tone matches personality profile

Memory Context (user preferences):
{{memoryContext}}

Content Context (recent patterns):
{{contentContext}}
```

## Context Assembly

The service assembles comprehensive context from multiple sources:

### SEO Context

```typescript
{
  targetKeyword: string;
  targetIntent: string;
  relatedKeywords: Array<{
    keyword: string;
    searchVolume: number | null;
    difficulty: number | null;
    intent: string;
  }>;
  opportunities: Array<{
    type: string;
    title: string;
    priority: string;
  }>;
}
```

**Source:** SEOKeywordService + seo_opportunities table

### Memory Context

```typescript
{
  recentInteractions: Array<{
    type: string;
    content: string;
    timestamp: string;
  }>;
  contentPreferences: {
    preferredTone: string | null;
    preferredLength: string | null;
    preferredFormat: string | null;
  };
}
```

**Source:** MemoryStore.searchMemories() + preference extraction (stub in S13)

### Content Context

```typescript
{
  recentContent: Array<{
    title: string;
    type: string;
    wordCount: number;
  }>;
  clusters: Array<{
    name: string;
    topicCount: number;
  }>;
  gaps: Array<{
    keyword: string;
    score: number;
  }>;
}
```

**Source:** ContentService (listContentItems, listContentClusters, listContentGaps)

### Personality Context

```typescript
{
  tone: string;
  style: string;
}
```

**Source:** PersonalityStore.getPersonality() or default personality for content generation

## API Endpoints

### POST /api/v1/content/briefs/generate

Generate a new content brief.

**Request:**
```json
{
  "contentItemId": "uuid",      // optional
  "targetKeyword": "content marketing strategy",
  "targetIntent": "informational",
  "personalityId": "uuid"       // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "result": {
      "runId": "uuid",
      "generatedBriefId": "uuid",
      "brief": { /* brief object */ },
      "outline": { /* outline object */ },
      "seoContext": { /* seo context */ }
    }
  }
}
```

### GET /api/v1/content/generated-briefs/:id

Get a generated brief by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "item": {
      "id": "uuid",
      "orgId": "uuid",
      "contentItemId": "uuid",
      "playbookRunId": "uuid",
      "brief": { /* brief object */ },
      "outline": { /* outline object */ },
      "seoContext": { /* seo context */ },
      "personalityUsed": { /* personality */ },
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  }
}
```

### GET /api/v1/content/generated-briefs

List generated briefs for the organization.

**Query Parameters:**
- `limit`: Number of items (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `contentItemId`: Filter by content item (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      { /* GeneratedBrief */ }
    ]
  }
}
```

## UI Workflow

### Brief Generation Modal

**Location:** `/app/content` page, Content Detail panel

**Trigger:** "Generate Brief" button (appears when content item is selected)

**Form Fields:**
1. **Target Keyword** (optional text input)
   - Placeholder: "e.g., content marketing strategy"
   - Help text: "Primary keyword to target in the brief"

2. **Search Intent** (required select)
   - Options: Informational, Navigational, Commercial, Transactional
   - Default: Informational

3. **Personality** (optional select)
   - Options: Default + all available personalities
   - Shows personality name
   - Help text: "Choose a personality profile for tone and style"

**Submission:**
- Calls POST /api/v1/content/briefs/generate
- Shows loading state: "Generating..."
- On success: Navigates to /app/content/brief/[id]
- On error: Shows error message in modal

### Brief Viewer Page

**Location:** `/app/content/brief/[id]`

**Sections:**

1. **Header**
   - Back button → /app/content
   - Brief title
   - Generation timestamp

2. **Overview Card**
   - Target Keyword
   - Search Intent
   - Target Audience
   - Tone
   - Word Count Range

3. **Content Outline Card**
   - Introduction (hook, context, thesis)
   - Main Sections (title + key points)
   - Conclusion (summary, CTA)

4. **SEO Guidelines Card**
   - Primary Keyword
   - Secondary Keywords (pills)
   - Meta Description (formatted box)
   - Target Search Volume

5. **Context Cards** (2-column grid)
   - Personality Used (tone, style)
   - SEO Context Summary (related keywords)

6. **Metadata Footer**
   - Created by
   - Brief ID

## Database Schema

### content_generated_briefs

```sql
CREATE TABLE public.content_generated_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  playbook_run_id UUID REFERENCES playbook_runs(id) ON DELETE SET NULL,
  brief JSONB NOT NULL,
  outline JSONB,
  seo_context JSONB,
  personality_used JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_generated_briefs_org
  ON content_generated_briefs(org_id);
CREATE INDEX idx_content_generated_briefs_content_item
  ON content_generated_briefs(content_item_id);
CREATE INDEX idx_content_generated_briefs_created_at
  ON content_generated_briefs(org_id, created_at DESC);
```

**RLS Policies:**
- SELECT: Users can view briefs for their org
- INSERT: Users can create briefs for their org
- UPDATE: Users can update briefs for their org
- DELETE: Users can delete briefs for their org

## Stub Implementation (S13)

The S13 implementation uses deterministic stub outputs:

### Sample Stub Output

For input keyword "content strategy", the stub generates:

**Outline:**
```json
{
  "title": "Complete Guide to content strategy",
  "sections": [
    {
      "heading": "Introduction",
      "description": "Overview of content strategy and its importance",
      "wordCount": 200
    },
    {
      "heading": "Understanding content strategy",
      "description": "Core concepts and fundamentals",
      "wordCount": 500
    },
    {
      "heading": "Best Practices",
      "description": "Proven strategies and techniques",
      "wordCount": 600
    },
    {
      "heading": "Common Mistakes",
      "description": "Pitfalls to avoid",
      "wordCount": 400
    },
    {
      "heading": "Conclusion",
      "description": "Summary and next steps",
      "wordCount": 200
    }
  ],
  "estimatedWordCount": 1900
}
```

**Brief:**
```json
{
  "title": "Complete Guide to content strategy",
  "targetKeyword": "content strategy",
  "targetIntent": "informational",
  "targetAudience": "Marketing professionals and content creators",
  "tone": "professional",
  "minWordCount": 1500,
  "maxWordCount": 2500,
  "outline": { /* detailed outline */ },
  "seoGuidelines": {
    "primaryKeyword": "content strategy",
    "secondaryKeywords": ["content marketing", "..."],
    "metaDescription": "Learn everything about content strategy...",
    "targetSearchVolume": 5400
  },
  "createdBy": "AI Brief Generator V1",
  "createdAt": "2025-01-16T..."
}
```

## Future Enhancements

### S16: Real LLM Integration

- Replace stub outputs with real LLM API calls
- Implement prompt templates with variable substitution
- Add structured output parsing
- Implement error handling and retry logic

### S17+: Advanced Features

- **Brief Templates:** User-defined brief structures
- **Collaborative Briefs:** Multi-agent brief refinement
- **Brief Versioning:** Track and compare brief iterations
- **Brief Analytics:** Track brief effectiveness and usage
- **Custom Sections:** Allow users to define custom outline sections
- **Brief Export:** Export to Google Docs, Notion, etc.
- **Brief Approval Workflow:** Review and approval process

### Adaptive Brief Generation

- **Learning from Outcomes:** Adjust brief structure based on content performance
- **User Feedback:** Incorporate user preferences and corrections
- **A/B Testing:** Generate multiple brief variants for comparison

## Testing

### Unit Tests

`apps/api/tests/briefGeneratorService.test.ts`

**Test Coverage:**
- ✅ Generation workflow with stub outputs
- ✅ Database persistence
- ✅ Personality override logic
- ✅ Context assembly (SEO + memory + content)
- ✅ API endpoint validation

### Integration Tests

- ✅ Full workflow: Input → Context → Playbook → Brief → Storage
- ✅ Multi-pillar integration (SEO, Memory, Content, Personality)
- ✅ Org-scoped access control (RLS)

## Success Metrics

- **Brief Generation Success Rate:** % of successful brief generations
- **Average Generation Time:** Time from request to saved brief
- **Brief Usage:** % of briefs that lead to content creation
- **User Satisfaction:** Feedback on brief quality and usefulness
- **Context Completeness:** % of briefs with full SEO + memory + content context

## Related Features

- [Content Intelligence V1 (S12)](./content_intelligence_v1.md) - Content items, clusters, gaps
- [SEO Intelligence (S4-S5)](./seo_intelligence.md) - Keywords, opportunities
- [AI Memory V2 (S10)](./ai_memory_v2.md) - User preferences and interactions
- [AI Personality V1 (S11)](./ai_personality_v1.md) - Tone and style configuration
- [AI Playbooks Runtime (S7)](./ai_playbooks_runtime.md) - Execution engine
