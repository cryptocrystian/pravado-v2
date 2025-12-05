# Content Rewrite Engine V1 (Sprint S15)

## Overview

The Semantic Rewriting Engine provides deterministic content improvement with quality tracking, diff visualization, and personality-based style adjustments. This V1 implementation establishes the complete rewriting pipeline that S16 will enhance with real LLM integration.

**Sprint**: S15
**Status**: ✅ Complete
**Dependencies**: S11 (Personality Engine), S14 (Quality Scoring)

---

## Architecture

```
┌─────────────────┐
│  Content Item   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│   ContentRewriteService                 │
│  ┌───────────────────────────────────┐  │
│  │ 1. Load Content & Personality     │  │
│  │ 2. Analyze Quality (S14)          │  │
│  │ 3. Generate Rewrite (Stub)        │  │
│  │ 4. Compute Semantic Diff          │  │
│  │ 5. Extract Improvements           │  │
│  │ 6. Generate Reasoning             │  │
│  │ 7. Calculate Quality After        │  │
│  │ 8. Save Rewrite                   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   content_rewrites table    │
│  • Original text            │
│  • Rewritten text           │
│  • Semantic diff            │
│  • Improvements list        │
│  • Quality before/after     │
│  • Readability before/after │
│  • Reasoning metadata       │
└─────────────────────────────┘
```

---

## Rewrite Flow

### 1. Request Initiation

```typescript
interface RewriteRequestInput {
  contentItemId: string;
  personalityId?: string | null;      // Optional S11 personality
  targetKeyword?: string | null;      // SEO keyword to optimize for
  targetIntent?: string | null;       // Search intent
}
```

### 2. Content Loading

- Fetch content item from database
- Load personality profile if provided
- Validate content has body text

### 3. Quality Analysis (S14 Integration)

```typescript
const qualityAnalysis = await contentQualityService.analyzeQuality(orgId, contentItemId);

// Metrics captured:
// - Overall quality score (0-100)
// - Readability score (Flesch-Kincaid)
// - Keyword alignment
// - Topic alignment
// - Suggested improvements
```

### 4. Deterministic Stub Rewrite (V1)

**Current Implementation**: Rule-based transformations
**Future (S16)**: LLM-powered rewriting

#### Stub Rewrite Logic

```typescript
function stubRewrite(text, context) {
  let sentences = splitIntoSentences(text);

  // 1. Apply personality transformations
  if (personality.tone === 'assertive') {
    sentences = shortenSentences(sentences);  // <15 words
  }
  if (personality.tone === 'supportive') {
    sentences = addSoftTransitions(sentences);
  }

  // 2. Improve readability
  sentences = splitLongSentences(sentences);  // Split >20 words

  // 3. Keyword optimization
  if (targetKeyword && !isPresent(targetKeyword)) {
    sentences = injectKeyword(sentences, targetKeyword);
  }

  // 4. Add structure
  if (sentences.length > 5) {
    sentences = addSubheadings(sentences);
  }

  // 5. Add transitions
  sentences = addTransitionSentences(sentences);

  // 6. Expand thin content
  if (wordCount < 300) {
    sentences = expandWithFiller(sentences);
  }

  // 7. Remove duplicates
  sentences = removeDuplicateSentences(sentences);

  return sentences.join(' ');
}
```

### 5. Semantic Diff Computation

```typescript
interface SemanticDiffEntry {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  original?: string;
  rewritten?: string;
  similarity?: number;
}

const diff = {
  entries: SemanticDiffEntry[],
  summary: {
    added: 3,        // New sentences
    removed: 1,      // Deleted sentences
    modified: 0,     // Changed sentences
    unchanged: 5     // Preserved sentences
  }
}
```

**Diff Algorithm (V1)**:
- Split both texts into sentences
- Compare sentence by sentence (exact match)
- Classify as added, removed, or unchanged
- Future: Use embeddings for fuzzy matching

### 6. Improvements Extraction

```typescript
const improvements = [
  "Added 3 new sentence(s) to improve clarity",
  "Removed 1 redundant sentence(s)",
  "Applied assertive tone",
  "Optimized for keyword: 'content quality'",
  "Improved readability by splitting long sentences"
];
```

### 7. Reasoning Metadata

```json
{
  "qualityScoreBefore": 58,
  "readabilityBefore": 45,
  "personalityApplied": "Executive Voice",
  "targetKeyword": "content quality",
  "targetIntent": "informational",
  "improvementsCount": 5,
  "strategy": "deterministic_stub_v1",
  "note": "This rewrite was generated using deterministic stub logic. S16 will introduce LLM-based rewriting."
}
```

### 8. Quality Re-Analysis

```typescript
const readabilityAfter = computeReadability(rewrittenText);
const qualityAfter = qualityBefore + 10;  // Stub: always +10 points
```

**V1 Limitation**: Quality improvement is hardcoded at +10 points
**Future (S16)**: Re-run full S14 analysis on rewritten text

### 9. Persistence

```sql
INSERT INTO content_rewrites (
  org_id,
  content_item_id,
  original_text,
  rewritten_text,
  diff,
  improvements,
  reasoning,
  readability_before,
  readability_after,
  quality_before,
  quality_after
) VALUES (...)
RETURNING id;
```

---

## API Reference

### POST /api/v1/content/rewrites

Generate a new content rewrite.

**Request Body**:
```json
{
  "contentItemId": "uuid",
  "personalityId": "uuid",          // Optional
  "targetKeyword": "content quality", // Optional
  "targetIntent": "informational"     // Optional
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "result": {
      "rewriteId": "uuid",
      "rewrittenText": "Improved content...",
      "diff": {
        "entries": [...],
        "summary": {
          "added": 3,
          "removed": 1,
          "modified": 0,
          "unchanged": 5
        }
      },
      "improvements": [
        "Added 3 new sentence(s) to improve clarity",
        "Applied assertive tone"
      ],
      "reasoning": {
        "strategy": "deterministic_stub_v1",
        "personalityApplied": "Executive Voice"
      },
      "readabilityBefore": 45,
      "readabilityAfter": 62,
      "qualityBefore": 58,
      "qualityAfter": 68
    }
  }
}
```

### GET /api/v1/content/rewrites

List rewrites for organization.

**Query Parameters**:
- `page` (number, default: 1)
- `pageSize` (number, default: 20, max: 100)
- `contentItemId` (UUID, optional) - Filter by content item

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "rewrites": [
      {
        "id": "uuid",
        "orgId": "uuid",
        "contentItemId": "uuid",
        "originalText": "...",
        "rewrittenText": "...",
        "diff": {...},
        "improvements": [...],
        "reasoning": {...},
        "readabilityBefore": 45,
        "readabilityAfter": 62,
        "qualityBefore": 58,
        "qualityAfter": 68,
        "createdAt": "2025-01-16T10:00:00Z",
        "updatedAt": "2025-01-16T10:00:00Z"
      }
    ],
    "total": 42
  }
}
```

### GET /api/v1/content/rewrites/:id

Get single rewrite with full metadata.

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "rewrite": {
      "id": "uuid",
      "orgId": "uuid",
      "contentItemId": "uuid",
      "playbookRunId": "uuid",
      "originalText": "Original content...",
      "rewrittenText": "Improved content...",
      "diff": {
        "entries": [...],
        "summary": {...}
      },
      "improvements": [...],
      "reasoning": {...},
      "readabilityBefore": 45,
      "readabilityAfter": 62,
      "qualityBefore": 58,
      "qualityAfter": 68,
      "createdAt": "2025-01-16T10:00:00Z",
      "updatedAt": "2025-01-16T10:00:00Z"
    }
  }
}
```

---

## Personality Integration (S11)

The rewrite engine adjusts content based on personality profile tone:

### Assertive Tone
- **Transformation**: Shorten sentences to <15 words
- **Goal**: Direct, concise communication
- **Example**:
  - Before: "The implementation of this feature requires careful consideration of multiple factors including performance and scalability."
  - After: "This feature needs performance and scalability considerations."

### Supportive Tone
- **Transformation**: Add soft transition phrases
- **Goal**: Warm, collaborative communication
- **Example**:
  - Before: "Performance issues exist. Optimization is needed."
  - After**: "Performance issues exist. Additionally, optimization would be beneficial."

### Professional Tone
- **Transformation**: Maintain formal structure
- **Goal**: Business-appropriate communication

### Casual Tone
- **Transformation**: Simplify language
- **Goal**: Approachable, friendly communication

---

## Quality Improvement Tracking

### Before/After Metrics

```typescript
interface QualityMetrics {
  readabilityBefore: number;   // Flesch-Kincaid score
  readabilityAfter: number;    // After rewrite
  qualityBefore: number;       // S14 overall score
  qualityAfter: number;        // After rewrite
}
```

### Improvement Calculation

**V1 (Stub)**:
```typescript
qualityAfter = qualityBefore + 10;  // Fixed +10 improvement
```

**Future (S16)**:
```typescript
// Re-run full S14 analysis
const newAnalysis = await analyzeQuality(rewrittenText);
qualityAfter = newAnalysis.score;

// Calculate delta
const improvement = qualityAfter - qualityBefore;
```

---

## Playbook Integration (S7-S9)

The rewrite flow is orchestrated through a system playbook:

```typescript
const CONTENT_REWRITE_PLAYBOOK = {
  id: 'CONTENT_REWRITE_V1',
  steps: [
    {
      key: 'LOAD_CONTENT',
      type: 'DATA',
      handler: 'fetchContentAndPersonality'
    },
    {
      key: 'ANALYZE_QUALITY',
      type: 'AGENT',
      service: 'ContentQualityService',
      method: 'analyzeQuality'
    },
    {
      key: 'REWRITE_CONTENT',
      type: 'AGENT',
      service: 'ContentRewriteService',
      method: 'stubRewrite'
    },
    {
      key: 'ASSEMBLE_RESULT',
      type: 'DATA',
      handler: 'computeDiffAndMetrics'
    }
  ]
};
```

---

## UI Workflow

### 1. Rewrite Modal

**Trigger**: "Rewrite Content" button on content item page

**Form Fields**:
- Personality Profile (dropdown, optional)
- Target Keyword (text input, optional)
- Search Intent (dropdown: informational, navigational, commercial, transactional)

**Actions**:
- Submit → Calls POST /api/v1/content/rewrites
- Cancel → Closes modal

### 2. Preview Page

**Route**: `/app/content/rewrites/:id`

**Sections**:

#### A. Header
- Content title
- Rewrite timestamp
- Quality improvement badge (+10 points)

#### B. Diff Viewer
- Side-by-side or inline diff
- Color coding:
  - Green: Added sentences
  - Red: Removed sentences
  - Gray: Unchanged sentences

#### C. Metrics Comparison
```
Readability:  [45] → [62]  +17 points ✅
Quality:      [58] → [68]  +10 points ✅
```

#### D. Improvements List
- Bulleted list of applied improvements
- Examples:
  - "Added 3 new sentence(s) to improve clarity"
  - "Applied assertive tone"
  - "Optimized for keyword: 'content quality'"

#### E. Metadata Panel
- Personality used
- Target keyword
- Search intent
- Rewrite strategy
- Timestamp

#### F. Actions
- Apply Rewrite → Update content item with rewritten text
- Discard → Delete rewrite
- Edit & Apply → Manual editing before application

---

## Future Enhancements

### V2: LLM Integration (Sprint S16)
- Replace stub rewrite logic with OpenAI/Anthropic API calls
- Prompt engineering for quality-focused rewriting
- Real-time quality re-analysis
- A/B testing of prompts

### V3: Advanced Diff Algorithm
- Use embeddings for semantic similarity matching
- Highlight modified sentences (not just added/removed)
- Paragraph-level diff instead of sentence-level
- Visual diff with word-level highlighting

### V4: Multi-Pass Rewriting
- First pass: Structure and readability
- Second pass: Keyword optimization
- Third pass: Tone adjustment
- Fourth pass: Fact checking

### V5: Rewrite Templates
- Industry-specific templates
- Content type templates (blog, social, newsletter)
- Brand voice templates
- SEO optimization templates

### V6: Collaborative Editing
- Accept/reject individual changes
- Comment on specific diff entries
- Merge multiple rewrite versions
- Rewrite history and rollback

### V7: Real-Time Preview
- Live diff as LLM generates text
- Streaming response support
- Progressive enhancement display

### V8: Bulk Rewriting
- Batch rewrite multiple items
- Queue-based processing
- Progress tracking
- Batch quality reporting

### V9: Rewrite Analytics
- Track acceptance rate of rewrites
- A/B test rewrite strategies
- Measure SEO impact of rewrites
- Quality improvement trends

### V10: Smart Rewrite Suggestions
- Auto-suggest rewrite candidates based on quality scores
- Proactive rewrite recommendations
- Scheduled automated rewrites
- Content decay detection with rewrite alerts

---

## Technical Implementation Details

### Database Schema

```sql
CREATE TABLE content_rewrites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES orgs(id),
  content_item_id UUID NOT NULL REFERENCES content_items(id),
  playbook_run_id UUID REFERENCES playbook_runs(id),

  original_text TEXT NOT NULL,
  rewritten_text TEXT NOT NULL,

  diff JSONB,          -- Semantic diff structure
  improvements JSONB,  -- Array of improvement descriptions
  reasoning JSONB,     -- Rewrite reasoning metadata

  readability_before NUMERIC,
  readability_after NUMERIC,
  quality_before NUMERIC,
  quality_after NUMERIC,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_content_rewrites_org_content ON content_rewrites(org_id, content_item_id);
CREATE INDEX idx_content_rewrites_created ON content_rewrites(org_id, created_at DESC);
```

### Service Architecture

```typescript
class ContentRewriteService {
  private qualityService: ContentQualityService;  // S14
  private personalityStore: PersonalityStore;      // S11

  async generateRewrite(orgId, input): Promise<RewriteResult> {
    // 1. Load content + personality
    // 2. Analyze quality (S14)
    // 3. Generate rewrite (stub)
    // 4. Compute diff
    // 5. Extract improvements
    // 6. Calculate quality after
    // 7. Save to DB
    // 8. Return result
  }

  async getRewrite(orgId, rewriteId): Promise<ContentRewrite | null>
  async listRewrites(orgId, options): Promise<{ rewrites, total }>

  private stubRewrite(text, context): string
  private computeSemanticDiff(original, rewritten): Record<string, unknown>
  private extractImprovements(context, diff): string[]
  private generateReasoning(context, improvements): Record<string, unknown>
}
```

---

## Testing Strategy

### Unit Tests
- ✅ Stub rewrite transformations
- ✅ Sentence splitting logic
- ✅ Diff computation correctness
- ✅ Personality transformations
- ✅ Keyword injection
- ✅ Readability improvements
- ✅ Duplicate removal

### Integration Tests
- ✅ Full rewrite flow (load → analyze → rewrite → save)
- ✅ S14 quality service integration
- ✅ S11 personality store integration
- ✅ Database persistence
- ✅ API endpoint functionality

### API Tests
- ✅ POST /rewrites with valid input
- ✅ POST /rewrites with missing content
- ✅ POST /rewrites with invalid personality
- ✅ GET /rewrites pagination
- ✅ GET /rewrites filtering by content item
- ✅ GET /rewrites/:id with valid ID
- ✅ GET /rewrites/:id with invalid ID

---

## Performance Considerations

### V1 Performance
- **Rewrite Generation**: <100ms (deterministic logic)
- **Diff Computation**: O(n) sentence comparison
- **Database Write**: Single INSERT operation

### Future Optimizations
- **LLM Caching**: Cache rewrites for identical inputs
- **Streaming**: Progressive diff rendering
- **Background Processing**: Queue-based rewriting
- **Batch Operations**: Bulk rewrite API

---

## Error Handling

### Common Errors

**Content Not Found**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Content item not found or has no body"
  }
}
```

**Invalid Personality**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PERSONALITY",
    "message": "Personality profile not found for this organization"
  }
}
```

**Validation Error**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body"
  }
}
```

---

## Conclusion

Sprint S15 establishes the complete semantic rewriting pipeline with:

✅ Database schema for rewrite persistence
✅ Deterministic stub rewriting logic
✅ Semantic diff computation
✅ Quality improvement tracking
✅ Personality-based style adjustments
✅ Full API integration
✅ Comprehensive documentation
✅ Test coverage

**Next Sprint (S16)**: Replace stub logic with real LLM APIs for intelligent, context-aware content rewriting.
