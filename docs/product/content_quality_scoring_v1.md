# Content Quality Scoring Engine V1

**Sprint S14 - Implementation Documentation**

## Overview

The Content Quality Scoring Engine V1 provides automated analysis of content items to measure quality, readability, topic alignment, keyword optimization, and detect potential issues like thin content or duplicates. The engine combines traditional readability metrics with semantic similarity analysis powered by vector embeddings.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Content Dashboard UI                     │
│  - Quality Score Visualization                              │
│  - Suggested Improvements Display                           │
│  - Analyze Quality Button                                   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ POST /api/v1/content/quality/analyze
                  │ GET  /api/v1/content/quality/:id
                  │
┌─────────────────▼───────────────────────────────────────────┐
│                  Content Quality API Routes                  │
│  - Authentication & Authorization (org-scoped)              │
│  - Request Validation (Zod schemas)                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              ContentQualityService                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ analyzeQuality()                                    │  │
│  │  ├─ computeReadability()       (Flesch-Kincaid)    │  │
│  │  ├─ computeTopicAlignment()    (Vector similarity) │  │
│  │  ├─ computeKeywordAlignment()  (Keyword detection) │  │
│  │  ├─ detectThinContent()        (Word count)        │  │
│  │  ├─ detectSimilarContent()     (pgvector RPC)      │  │
│  │  ├─ calculateOverallScore()    (Weighted formula)  │  │
│  │  ├─ generateWarnings()         (Issue detection)   │  │
│  │  └─ generateImprovements()     (Suggestions)       │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────┐
│               Supabase PostgreSQL + pgvector                │
│                                                             │
│  Tables:                                                    │
│  - content_items (with embeddings vector(1536))            │
│  - content_quality_scores                                  │
│                                                             │
│  Functions:                                                 │
│  - find_similar_content() (semantic similarity)            │
└─────────────────────────────────────────────────────────────┘
```

---

## Scoring Formula

### Overall Quality Score (0-100)

The overall quality score is calculated using a weighted formula with penalties:

```typescript
score = (readability × 0.20) + (topicAlignment × 0.30) + (keywordAlignment × 0.30)

// Penalties
if (thinContent) score -= 20
if (duplicateFlag) score -= 30

// Final score clamped to 0-100
score = Math.max(0, Math.min(100, Math.round(score)))
```

### Component Weights

| Component          | Weight | Range | Description                                    |
|--------------------|--------|-------|------------------------------------------------|
| Readability        | 20%    | 0-100 | Flesch-Kincaid Reading Ease score             |
| Topic Alignment    | 30%    | 0-100 | Vector similarity with primary topic          |
| Keyword Alignment  | 30%    | 0-100 | Target keyword presence in title and opening  |
| Thin Content       | -20    | Flag  | Penalty if word count < 300                   |
| Duplicate Content  | -30    | Flag  | Penalty if similar content exists (>85% sim)  |

**Special Cases:**
- If no primary topic is assigned, the topic alignment weight (30%) is redistributed to keyword alignment, making keyword alignment worth 60% total.
- If no target keyword is set, keyword alignment defaults to a neutral score of 50.

---

## Readability Heuristics

### Flesch-Kincaid Reading Ease Formula

The Content Quality Engine uses the **Flesch-Kincaid Reading Ease** formula to compute readability scores:

```
Reading Ease = 206.835 - (1.015 × ASL) - (84.6 × ASW)

Where:
  ASL = Average Sentence Length (words per sentence)
  ASW = Average Syllables per Word
```

**Interpretation:**
- **90-100**: Very Easy (5th grade level)
- **80-89**: Easy (6th grade)
- **70-79**: Fairly Easy (7th grade)
- **60-69**: Standard (8th-9th grade)
- **50-59**: Fairly Difficult (10th-12th grade)
- **30-49**: Difficult (College level)
- **0-29**: Very Difficult (College graduate+)

### Syllable Counting Heuristic

Since full phonetic analysis is complex, we use a simplified syllable counting algorithm:

```typescript
countSyllables(word: string): number {
  word = word.toLowerCase();

  // Words ≤3 characters = 1 syllable
  if (word.length <= 3) return 1;

  // Count vowel groups (consecutive vowels = 1 syllable)
  const vowels = word.match(/[aeiouy]+/g);
  let syllables = vowels ? vowels.length : 1;

  // Adjust for silent 'e' at end
  if (word.endsWith('e')) {
    syllables--;
  }

  // Minimum of 1 syllable per word
  return Math.max(1, syllables);
}
```

**Examples:**
- "hello" → [e], [o] → 2 syllables
- "content" → [o], [e] → 2 syllables (silent 'e' not at end)
- "quality" → [ua], [i], [y] → 3 syllables
- "the" → length ≤3 → 1 syllable

**Limitations:**
- This heuristic is approximate and may miscount complex words
- Silent letters other than final 'e' are not handled
- Diphthongs and special phonetic rules are simplified
- Adequate for general readability trends, not phonetically precise

---

## Embedding Similarity Logic

### Vector-Based Semantic Similarity

The Content Quality Engine uses **pgvector** (PostgreSQL extension) to perform semantic similarity detection via vector embeddings.

#### Embedding Storage

Content items store their semantic embeddings in the `embeddings` column:
- **Dimension**: 1536 (OpenAI `text-embedding-3-small` format)
- **Type**: `vector(1536)` (pgvector type)
- **Generation**: Embeddings are created during content ingestion (S3 flow)

#### Cosine Distance Operator

pgvector provides the **cosine distance operator** `<->` for measuring similarity:

```sql
SELECT
  ci.id,
  ci.title,
  (1 - (ci.embeddings <-> p_embedding))::FLOAT AS similarity
FROM content_items ci
WHERE ci.embeddings <-> p_embedding < 0.15  -- Distance threshold
ORDER BY ci.embeddings <-> p_embedding
```

**Distance to Similarity Conversion:**
```
similarity = 1 - distance

Example:
  distance = 0.10 → similarity = 0.90 (90% similar)
  distance = 0.15 → similarity = 0.85 (85% similar)
  distance = 0.50 → similarity = 0.50 (50% similar)
```

#### PostgreSQL Function: find_similar_content()

Located in `apps/api/supabase/migrations/28_content_quality_schema.sql`:

```sql
CREATE OR REPLACE FUNCTION public.find_similar_content(
  p_org_id UUID,
  p_content_item_id UUID,
  p_embedding vector(1536),
  p_threshold FLOAT DEFAULT 0.15,  -- Distance threshold
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  similarity FLOAT,
  -- ... all content_items columns
)
```

**Parameters:**
- `p_org_id`: Organization scope (security)
- `p_content_item_id`: Current content item to exclude from results
- `p_embedding`: The embedding vector to compare against
- `p_threshold`: Maximum distance (default 0.15 = 85% similarity)
- `p_limit`: Maximum results to return (default 5)

**Filtering:**
- Only returns content from the same organization
- Excludes the current content item itself
- Only includes items with non-null embeddings
- Only returns items within the distance threshold

---

## Duplicate Detection

### Similarity Threshold

**Default Threshold: 0.85 (85% similarity)**

Content items are flagged as potential duplicates if their cosine similarity exceeds 85%. This threshold is configurable in `ContentQualityService`:

```typescript
private readonly SIMILARITY_THRESHOLD = 0.85;
```

### Detection Logic

1. **Check for embeddings**: If the content item has no embeddings, duplicate detection is skipped (returns empty array)

2. **Call pgvector function**:
   ```typescript
   const { data: similarItems } = await this.supabase.rpc('find_similar_content', {
     p_org_id: orgId,
     p_content_item_id: item.id,
     p_embedding: item.embeddings,
     p_threshold: 1 - this.SIMILARITY_THRESHOLD,  // 0.15 distance
     p_limit: 5,
   });
   ```

3. **Set duplicate flag**:
   ```typescript
   const duplicateFlag = similarItems.length > 0;
   ```

4. **Apply penalty**: If `duplicateFlag` is true, subtract 30 points from overall score

### Warnings Generated

When duplicates are detected:
```json
{
  "duplicate": "Similar content detected"
}
```

### Suggested Improvements

When duplicates are found:
```
"Differentiate this content from \"<title>\" to avoid duplicate content issues."
```

The first similar item's title is referenced in the suggestion.

---

## Keyword Alignment

### Target Keyword Detection

The keyword alignment score measures how prominently the **target keyword** appears in strategic locations.

#### Target Keyword Source

The target keyword is retrieved from the content item's metadata:
```typescript
const metadata = item.metadata as Record<string, unknown>;
const targetKeyword = metadata?.targetKeyword as string | undefined;
```

#### Scoring Logic

```typescript
computeKeywordAlignment(item: ContentItem): number {
  // No target keyword → neutral score
  if (!targetKeyword) return 50;

  const keyword = targetKeyword.toLowerCase();
  const title = (item.title || '').toLowerCase();
  const body = (item.body || '').toLowerCase();

  // Get first 200 words
  const firstWords = body.split(/\s+/).slice(0, 200).join(' ');

  let score = 0;

  // Keyword in title: +50
  if (title.includes(keyword)) {
    score += 50;
  }

  // Keyword in first 200 words: +50
  if (firstWords.includes(keyword)) {
    score += 50;
  }

  return Math.min(100, score);
}
```

#### Score Breakdown

| Location          | Points | Description                                    |
|-------------------|--------|------------------------------------------------|
| Title             | +50    | Primary keyword in title (SEO critical)        |
| First 200 Words   | +50    | Keyword in opening content (user experience)   |
| **Maximum**       | 100    | Both conditions met                            |

**Rationale:**
- **Title**: Search engines and users see the title first—critical for SEO and CTR
- **First 200 Words**: Users decide to continue reading based on opening content—important for engagement and topical clarity

#### Warnings Generated

If keyword alignment score < 50:
```json
{
  "keyword": "Target keyword not prominently featured"
}
```

#### Suggested Improvements

If keyword alignment < 50:
```
"Add primary keyword to title or introduction for better keyword alignment."
```

---

## Thin Content Detection

### Definition

**Thin Content**: Content with fewer than 300 words

### Threshold Configuration

```typescript
private readonly THIN_CONTENT_THRESHOLD = 300;  // Words
private readonly MIN_WORD_COUNT = 800;          // Recommended minimum
private readonly MAX_WORD_COUNT = 1200;         // Recommended maximum
```

### Detection Logic

```typescript
detectThinContent(text: string): boolean {
  const words = text.split(/\s+/).filter((w) => w.trim().length > 0);
  return words.length < this.THIN_CONTENT_THRESHOLD;
}
```

### Penalty

If thin content is detected:
- **Score Penalty**: -20 points
- **Flag**: `thinContent: true`

### Warnings Generated

```json
{
  "thinContent": "Content has only 245 words"
}
```

### Suggested Improvements

```
"Expand content to exceed 800–1200 words for better depth and SEO."
```

### Rationale

Search engines favor comprehensive, in-depth content that provides value. Content under 300 words is generally considered "thin" and may:
- Rank poorly in search results
- Provide insufficient information to users
- Be perceived as low-quality by search algorithms
- Miss opportunities for keyword variations and semantic richness

The recommended range of 800-1200 words balances depth with readability.

---

## Topic Alignment (V1 Placeholder)

### Current Implementation (V1)

In V1, topic alignment uses a **simplified placeholder** implementation:

```typescript
async computeTopicAlignment(item: ContentItem): Promise<number | null> {
  // If no primary topic or no embeddings, return null
  if (!item.primaryTopicId || !item.embeddings) {
    return null;
  }

  // Fetch primary topic's existence
  const { data: topic } = await this.supabase
    .from('content_topics')
    .select('id')
    .eq('id', item.primaryTopicId)
    .single();

  if (!topic) {
    return null;
  }

  // V1 Placeholder: Return fixed score if topic is assigned
  return 85;
}
```

**Behavior:**
- If content has a primary topic assigned: **Returns 85** (good alignment)
- If no primary topic or topic not found: **Returns null** (excluded from scoring)
- If embeddings are missing: **Returns null**

### Future Enhancement (V2)

V2 will implement **actual vector similarity** between content embeddings and topic centroid:

```typescript
// Future V2 implementation
async computeTopicAlignment(item: ContentItem): Promise<number | null> {
  if (!item.primaryTopicId || !item.embeddings) {
    return null;
  }

  // Fetch topic's centroid embedding (average of all content in topic)
  const { data: topic } = await this.supabase
    .from('content_topics')
    .select('centroid_embedding')
    .eq('id', item.primaryTopicId)
    .single();

  if (!topic || !topic.centroid_embedding) {
    return null;
  }

  // Calculate cosine similarity
  const distance = await this.supabase.rpc('vector_distance', {
    embedding1: item.embeddings,
    embedding2: topic.centroid_embedding,
  });

  // Convert distance to score (0-100)
  const similarity = 1 - distance;
  const score = Math.round(similarity * 100);

  return Math.max(0, Math.min(100, score));
}
```

**Requirements for V2:**
1. Add `centroid_embedding` column to `content_topics` table
2. Compute topic centroids (average embeddings of all content in topic)
3. Update centroids when content is added/removed from topics
4. Replace placeholder logic with actual vector distance calculation

---

## API Reference

### Base URL

```
http://localhost:4000/api/v1/content/quality
```

### Authentication

All endpoints require authentication via cookies (session-based auth). User must be a member of an organization.

---

### POST /analyze

Analyze content quality for a specific content item.

**Endpoint:**
```
POST /api/v1/content/quality/analyze
```

**Request Headers:**
```
Content-Type: application/json
Cookie: <session-cookie>
```

**Request Body:**
```json
{
  "contentItemId": "uuid"
}
```

**Validation Schema:**
```typescript
{
  contentItemId: z.string().uuid()
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "result": {
      "item": {
        "id": "uuid",
        "orgId": "uuid",
        "title": "Example Article Title",
        "slug": "example-article-title",
        "contentType": "blog_post",
        "status": "published",
        "body": "Full article body text...",
        "url": "https://example.com/blog/example-article",
        "publishedAt": "2025-01-15T10:00:00Z",
        "wordCount": 850,
        "readingTimeMinutes": 4,
        "performanceScore": 72,
        "primaryTopicId": "uuid",
        "embeddings": [0.123, -0.456, ...],  // 1536 dims
        "performance": { ... },
        "metadata": {
          "targetKeyword": "content quality"
        },
        "createdAt": "2025-01-10T08:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      },
      "score": {
        "id": "uuid",
        "orgId": "uuid",
        "contentItemId": "uuid",
        "score": 78,
        "readability": 65,
        "topicAlignment": 85,
        "keywordAlignment": 100,
        "thinContent": false,
        "duplicateFlag": false,
        "warnings": {},
        "createdAt": "2025-01-16T12:00:00Z",
        "updatedAt": "2025-01-16T12:00:00Z"
      },
      "similarItems": [],
      "suggestedImprovements": [
        "Content quality is good! No major improvements needed."
      ]
    }
  }
}
```

**Error Responses:**

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "error": {
    "code": "NO_ORG",
    "message": "User is not a member of any organization"
  }
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "ANALYSIS_ERROR",
    "message": "Content item not found"
  }
}
```

---

### GET /:contentItemId

Retrieve quality score for a content item, analyzing if no score exists.

**Endpoint:**
```
GET /api/v1/content/quality/:contentItemId
```

**Request Headers:**
```
Cookie: <session-cookie>
```

**URL Parameters:**
- `contentItemId` (UUID): The content item ID

**Response (200 OK):**

Same structure as POST /analyze response.

**Behavior:**
1. Attempts to fetch existing quality score from database
2. If no score exists, triggers full analysis
3. Returns analysis result (either existing or newly computed)

**Note:** Current implementation always re-analyzes (line 155 in contentQuality/index.ts). This ensures fresh scores but may be optimized in future versions to return cached scores based on `updated_at` timestamp.

**Error Responses:**

Same as POST /analyze endpoint.

---

## UI Behavior

### Location

**File:** `apps/dashboard/src/app/app/content/page.tsx`

**Section:** Content Detail Panel (right sidebar)

### Components

#### 1. Analyze Quality Button

```tsx
<button
  onClick={handleAnalyzeQuality}
  disabled={isAnalyzingQuality}
  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg
             hover:bg-green-700 transition-colors font-medium text-sm
             disabled:opacity-50"
>
  {isAnalyzingQuality ? 'Analyzing...' : 'Analyze Quality'}
</button>
```

**Behavior:**
- Disabled when no content item is selected
- Disabled during analysis (`isAnalyzingQuality` state)
- Shows "Analyzing..." text during API call
- Green background to distinguish from other actions
- Full width button placement

#### 2. Quality Score Display

Appears after analysis completes:

```tsx
{qualityAnalysis && (
  <div className="pt-4 border-t border-gray-200 space-y-3">
    {/* Score sections */}
  </div>
)}
```

**Sub-Components:**

##### Overall Score Progress Bar

```tsx
<div>
  <label className="text-xs font-medium text-gray-500 uppercase">
    Quality Score
  </label>
  <div className="flex items-center gap-2 mt-1">
    <div className="flex-1 bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full ${
          qualityAnalysis.score.score >= 70
            ? 'bg-green-600'
            : qualityAnalysis.score.score >= 40
            ? 'bg-yellow-600'
            : 'bg-red-600'
        }`}
        style={{ width: `${qualityAnalysis.score.score}%` }}
      />
    </div>
    <span className="text-sm font-bold">{qualityAnalysis.score.score}</span>
  </div>
</div>
```

**Color Coding:**
- **Green (≥70)**: Good quality
- **Yellow (40-69)**: Needs improvement
- **Red (<40)**: Poor quality

##### Readability Metric

```tsx
{qualityAnalysis.score.readability !== null && (
  <div>
    <label className="text-xs font-medium text-gray-500 uppercase">
      Readability
    </label>
    <p className="text-sm text-gray-900">
      {qualityAnalysis.score.readability}/100
    </p>
  </div>
)}
```

Only shown if readability score is available (non-null).

##### Keyword Alignment Metric

```tsx
{qualityAnalysis.score.keywordAlignment !== null && (
  <div>
    <label className="text-xs font-medium text-gray-500 uppercase">
      Keyword Alignment
    </label>
    <p className="text-sm text-gray-900">
      {qualityAnalysis.score.keywordAlignment}/100
    </p>
  </div>
)}
```

Only shown if keyword alignment score is available (non-null).

##### Suggested Improvements

```tsx
{qualityAnalysis.suggestedImprovements.length > 0 && (
  <div>
    <label className="text-xs font-medium text-gray-500 uppercase">
      Suggestions
    </label>
    <ul className="mt-1 space-y-1">
      {qualityAnalysis.suggestedImprovements.slice(0, 3).map((suggestion, i) => (
        <li key={i} className="text-xs text-gray-700">
          • {suggestion}
        </li>
      ))}
    </ul>
  </div>
)}
```

**Behavior:**
- Shows up to **top 3 suggestions** only (`.slice(0, 3)`)
- Bullet point list format
- Only shown if suggestions array is non-empty

### User Workflow

1. **Select Content Item**: User clicks on a content item in the left panel
2. **View Details**: Content details appear in the right panel
3. **Analyze Quality**: User clicks "Analyze Quality" button
4. **Loading State**: Button shows "Analyzing..." and is disabled
5. **API Call**: Frontend calls POST /api/v1/content/quality/analyze
6. **Display Results**: Quality score panel appears with:
   - Color-coded progress bar
   - Numeric overall score
   - Individual metrics (readability, keyword alignment)
   - Top 3 actionable suggestions
7. **Review**: User reviews quality metrics and suggestions
8. **Act**: User can implement suggested improvements and re-analyze

### State Management

```typescript
// Quality analysis state (S14)
const [qualityAnalysis, setQualityAnalysis] =
  useState<ContentQualityAnalysisResult | null>(null);
const [isAnalyzingQuality, setIsAnalyzingQuality] = useState(false);
```

**State Flow:**
1. `isAnalyzingQuality = true` → Button disabled, shows "Analyzing..."
2. API call executes
3. On success: `qualityAnalysis` set to result
4. On error: Error logged to console (no user-facing error state yet)
5. Finally: `isAnalyzingQuality = false` → Button re-enabled

### Future UI Enhancements

Potential improvements for future versions:

1. **Error Handling**: Display user-facing error messages (toast notifications, inline errors)
2. **Loading Skeleton**: Show skeleton UI instead of hiding the panel during analysis
3. **History**: Show analysis history with timestamps ("Last analyzed: 2 hours ago")
4. **Re-analysis Prompt**: Suggest re-analysis if content has been edited since last score
5. **Detailed Modal**: Expand to full-screen modal with:
   - All similar items (not just count)
   - All suggestions (not just top 3)
   - Detailed breakdowns of each metric
   - Edit suggestions inline
6. **Comparison**: Compare quality scores across multiple content items
7. **Trends**: Show quality score trends over time
8. **Export**: Export quality report as PDF or CSV

---

## Database Schema

### Table: content_quality_scores

**Location:** `apps/api/supabase/migrations/28_content_quality_schema.sql`

```sql
CREATE TABLE IF NOT EXISTS public.content_quality_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,

  -- Quality metrics
  score NUMERIC NOT NULL,
  readability NUMERIC,
  topic_alignment NUMERIC,
  keyword_alignment NUMERIC,

  -- Flags
  thin_content BOOLEAN DEFAULT false,
  duplicate_flag BOOLEAN DEFAULT false,

  -- Warnings and recommendations
  warnings JSONB DEFAULT '[]'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one score per content item
  UNIQUE(content_item_id)
);
```

**Indexes:**
- `idx_content_quality_scores_org` on `org_id`
- `idx_content_quality_scores_content_item` on `content_item_id`
- `idx_content_quality_scores_org_content` on `(org_id, content_item_id)`
- `idx_content_quality_scores_score` on `(org_id, score DESC)`

**Row Level Security (RLS):**
- Enabled for org-scoped access control
- Users can only SELECT/INSERT/UPDATE/DELETE scores for their organization
- Policies check `user_orgs` table for membership

**Triggers:**
- `update_content_quality_scores_updated_at()`: Auto-updates `updated_at` on row modification

---

## Future Enhancements

### V2: Advanced Topic Alignment

**Goal:** Replace placeholder topic alignment with actual vector similarity

**Requirements:**
1. Add `centroid_embedding vector(1536)` to `content_topics` table
2. Create background job to compute topic centroids:
   - Average all content item embeddings for each topic
   - Update centroids when content is added/removed
3. Implement actual cosine similarity calculation in `computeTopicAlignment()`
4. Consider weighted centroids (more weight to high-performing content)

**Expected Impact:**
- More accurate topic alignment scores
- Better detection of off-topic content
- Improved overall quality scoring precision

---

### V3: Advanced Readability Metrics

**Goal:** Add multiple readability formulas and grade-level estimates

**Potential Additions:**
- **Flesch-Kincaid Grade Level** (in addition to Reading Ease)
- **Gunning Fog Index** (estimate years of education required)
- **SMOG Index** (Simple Measure of Gobbledygook)
- **Coleman-Liau Index** (based on characters instead of syllables)
- **Automated Readability Index (ARI)**

**Benefits:**
- Cross-validation across multiple formulas
- Different perspectives on readability
- Target specific grade levels for audience segmentation

---

### V4: Content Structure Analysis

**Goal:** Analyze content structure completeness

**Metrics:**
- **Heading hierarchy** (H1 → H2 → H3 proper nesting)
- **Paragraph length distribution** (detect walls of text)
- **Sentence length variance** (detect monotonous rhythm)
- **List usage** (bullets, numbered lists for scannability)
- **Media presence** (images, videos, embeds)
- **Internal/external link count**
- **Call-to-action presence**

**Scoring Impact:**
- Add "Structure Score" component (10-15% weight)
- Penalize missing H1, improper heading hierarchy
- Reward balanced paragraph lengths, varied sentence structure

---

### V5: SEO-Specific Heuristics

**Goal:** Integrate SEO best practices into quality scoring

**Checks:**
- **Title length** (50-60 characters optimal)
- **Meta description** (150-160 characters)
- **Image alt text** (presence and quality)
- **URL structure** (readable, keyword-rich slugs)
- **Internal linking** (3-5 internal links per post)
- **External authority links** (link to high-authority sources)
- **Keyword density** (1-2% target, avoid over-optimization)
- **LSI keywords** (semantic variations and related terms)
- **Schema markup** (structured data presence)

**Integration:**
- Add `seo_score` column to quality scores
- Weight SEO score as 10-20% of overall quality
- Generate SEO-specific warnings and improvements

---

### V6: Real-Time Analysis

**Goal:** Provide live quality feedback during content editing

**Approach:**
- WebSocket or Server-Sent Events for real-time updates
- Debounced analysis triggers (analyze after 2 seconds of inactivity)
- Incremental updates (only recompute changed metrics)
- Client-side heuristics for instant feedback (readability, word count)

**Benefits:**
- Writers see quality score while drafting
- Immediate feedback on improvements
- Prevent low-quality content from being saved

---

### V7: Machine Learning Enhancements

**Goal:** Train ML models on high-performing content

**Potential Models:**
1. **Performance Predictor**: Predict traffic, engagement, conversions based on content features
2. **Quality Classifier**: Binary classifier (high/low quality) trained on editor labels
3. **Topic Suggester**: Recommend related topics based on content embeddings
4. **Keyword Extractor**: Extract key phrases using TF-IDF or BERT
5. **Improvement Ranker**: Rank suggested improvements by expected impact

**Data Requirements:**
- Historical performance data (pageviews, time on page, conversions)
- Editor quality labels (human-rated content quality)
- A/B test results (which improvements actually worked)

---

### V8: Multi-Language Support

**Goal:** Support content quality analysis in multiple languages

**Challenges:**
- Readability formulas are English-specific
- Syllable counting differs across languages
- Embedding models may have language biases

**Solutions:**
1. Use language-specific readability formulas:
   - **Spanish**: Flesch-Szigriszt
   - **German**: Wiener Sachtextformel
   - **French**: Kandel-Moles
2. Detect content language automatically
3. Use multilingual embedding models (e.g., `multilingual-e5-large`)
4. Adjust keyword alignment for character-based languages (Chinese, Japanese)

---

### V9: Content Gap Integration

**Goal:** Tie quality analysis to content gap recommendations

**Integration Points:**
1. **Gap-Driven Quality**: Prioritize quality improvements for content targeting high-value gaps
2. **Quality-Driven Gaps**: Identify topics where existing content is low-quality
3. **Competitor Comparison**: Compare quality scores to competitor content on same topics
4. **Opportunity Score**: Combine quality score + gap score for prioritization

**Formula:**
```
opportunity = (gap_score × 0.6) + (quality_score × 0.4)
```

High gap + low quality = highest priority for improvement

---

### V10: Automated Improvement Execution

**Goal:** Auto-implement suggested improvements using AI

**Capabilities:**
1. **Readability Rewrite**: AI rewrites complex sentences for clarity
2. **Keyword Insertion**: AI suggests natural placements for target keyword
3. **Content Expansion**: AI generates additional paragraphs to meet word count
4. **Duplicate Resolution**: AI suggests unique angles to differentiate content
5. **Structure Fixes**: AI reorganizes content with proper headings

**Workflow:**
1. User reviews suggested improvements
2. User selects which improvements to auto-apply
3. AI generates revised content sections
4. User reviews and approves AI changes
5. Content updated, quality re-analyzed

**Safety:**
- Always human-in-the-loop (no auto-publish)
- Track AI-generated vs. human-written content
- Version control for rollback

---

## Implementation Checklist

- [x] Migration 28: content_quality_scores table
- [x] Migration 28: find_similar_content() function
- [x] Types: ContentQualityScore interface
- [x] Types: ContentQualityAnalysisResult interface
- [x] Validators: analyzeContentQualitySchema
- [x] Validators: contentQualityScoreSchema
- [x] Service: ContentQualityService class
- [x] Service: computeReadability() with Flesch-Kincaid
- [x] Service: computeTopicAlignment() (V1 placeholder)
- [x] Service: computeKeywordAlignment()
- [x] Service: detectThinContent()
- [x] Service: detectSimilarContent() with pgvector
- [x] Service: calculateOverallScore()
- [x] Service: generateWarnings()
- [x] Service: generateImprovements()
- [x] API: POST /api/v1/content/quality/analyze
- [x] API: GET /api/v1/content/quality/:contentItemId
- [x] UI: Analyze Quality button
- [x] UI: Quality score progress bar
- [x] UI: Readability metric display
- [x] UI: Keyword alignment metric display
- [x] UI: Suggested improvements list
- [x] Documentation: content_quality_scoring_v1.md
- [ ] Tests: contentQualityService.test.ts
- [ ] Build: Validation (lint, typecheck, test, build)

---

## Testing Strategy

See `apps/api/tests/contentQualityService.test.ts` for comprehensive test coverage including:

- Thin content detection (< 300 words)
- Keyword alignment scoring (title, opening)
- Topic alignment placeholder logic
- Readability scoring with Flesch-Kincaid
- Semantic similarity detection (pgvector integration)
- Overall score calculation with penalties
- Warning generation for quality issues
- Improvement suggestions based on scores
- API endpoint smoke tests (auth, validation, execution)

---

## References

### Academic Sources

- **Flesch-Kincaid Readability**: Flesch, R. (1948). "A New Readability Yardstick." *Journal of Applied Psychology*, 32(3), 221-233.
- **Cosine Similarity**: Salton, G., & McGill, M. J. (1983). *Introduction to Modern Information Retrieval*. McGraw-Hill.

### Tools and Libraries

- **pgvector**: PostgreSQL extension for vector similarity search - https://github.com/pgvector/pgvector
- **Supabase**: PostgreSQL-based backend platform - https://supabase.com
- **Fastify**: Fast Node.js web framework - https://fastify.dev
- **Zod**: TypeScript-first schema validation - https://zod.dev

### Internal Documentation

- Sprint S3: Content Pillar (content_items schema)
- Sprint S11: Personality Profiles (tone and voice)
- Sprint S13: Content Brief Generator (content planning)
- Migration 28: content_quality_scores schema

---

**Document Version:** 1.0
**Last Updated:** 2025-01-16
**Author:** Pravado Engineering Team
**Sprint:** S14 - Content Quality Scoring Engine V1
