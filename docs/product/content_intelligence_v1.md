# Content Intelligence Engine V1 (Sprint S12)

## Overview

The Content Intelligence Engine V1 is Pravado's AI-powered content management and optimization system. It provides content library management, topic clustering, content briefs with SEO integration, and content gap analysis to help teams create strategic, high-performing content.

**Sprint**: S12
**Status**: ✅ Complete
**Foundation**: Builds on S3 pillar schemas, integrates with S4 SEO Intelligence

---

## Features

### 1. Content Library Management

- **Full CRUD Operations**: Create, read, update content items
- **Multiple Content Types**: Blog posts, social posts, long-form content, video scripts, newsletters
- **Status Tracking**: Draft, published, archived lifecycle management
- **Advanced Filtering**: Filter by status, content type, topic, search query
- **Pagination**: Efficient handling of large content libraries (20 items per page)
- **Auto Word Count**: Automatically calculated from body text
- **Slug Generation**: URL-friendly slugs auto-generated from titles
- **Vector Embeddings**: 1536-dimensional embeddings for similarity search (stub implementation)

### 2. Content Briefs

- **Brief Creation**: Structured content planning with target keywords, audience, and tone
- **SEO Integration**: Automatic keyword suggestions from SEO pillar
- **Related Topics**: Shows related content topics for comprehensive coverage
- **Outline Support**: JSONB-based outline storage for flexible brief structures
- **Status Tracking**: Draft, in-progress, completed
- **Word Count Targets**: Min/max word count guidance

### 3. Topic Clustering

- **Auto Clustering**: Groups related content topics together
- **Representative Content**: Shows content items for each cluster
- **Cluster Management**: Create, view, and organize topic clusters
- **Foundation for ML**: Embeddings-based clustering (currently stub with single "General Topics" cluster)

### 4. Content Gap Analysis

- **SEO-Driven Gaps**: Identifies content opportunities based on SEO keywords
- **Opportunity Scoring**: Scores based on search volume, difficulty, and existing content coverage
- **Intent Mapping**: Shows keyword intent (informational, navigational, commercial, transactional)
- **Existing Content Count**: Tracks how much content already covers each keyword
- **Priority Sorting**: Automatically sorted by opportunity score

---

## Data Model

### Content Items

**Table**: `content_items`

```typescript
interface ContentItem {
  id: UUID;
  orgId: UUID;
  title: string;
  slug: string | null;
  contentType: 'blog_post' | 'social_post' | 'long_form' | 'video_script' | 'newsletter';
  status: 'draft' | 'published' | 'archived';
  body: string | null;
  url: string | null;
  publishedAt: string | null;
  wordCount: number | null; // Auto-calculated
  readingTimeMinutes: number | null;
  performanceScore: number | null;
  primaryTopicId: UUID | null;
  embeddings: number[] | null; // 1536-dimensional vector
  performance: Record<string, unknown>; // JSONB for analytics stub
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

**Indexes**:
- `idx_content_items_org_status` (org_id, status)
- `idx_content_items_org_topic` (org_id, primary_topic_id)
- `idx_content_items_embeddings` HNSW index for vector similarity

### Content Briefs

**Table**: `content_briefs`

```typescript
interface ContentBrief {
  id: UUID;
  orgId: UUID;
  title: string;
  targetAudience: string | null;
  targetKeywords: string[]; // Array of keywords
  targetKeyword: string | null; // Primary keyword
  targetIntent: string | null;
  outline: Record<string, unknown> | null; // JSONB outline
  tone: 'professional' | 'casual' | 'technical' | 'friendly' | null;
  minWordCount: number | null;
  maxWordCount: number | null;
  contentItemId: UUID | null;
  status: 'draft' | 'in_progress' | 'completed';
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### Content Topics

**Table**: `content_topics`

```typescript
interface ContentTopic {
  id: UUID;
  orgId: UUID;
  name: string;
  description: string | null;
  embeddings: number[] | null; // 1536-dimensional vector
  contentItemId: UUID | null;
  relevanceScore: number | null;
  clusterId: UUID | null; // Reference to cluster
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
```

### Topic Clusters

**Table**: `content_topic_clusters`

```typescript
interface ContentTopicCluster {
  id: UUID;
  orgId: UUID;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
```

---

## Services

### ContentService

**Location**: `apps/api/src/services/contentService.ts`

#### Content Library Methods

**`listContentItems(orgId, filters)`**
- Lists content items with filtering and pagination
- Filters: status, q (search), topicId, page, pageSize, contentType
- Returns: `ContentItemListDTO` with items, total, page, pageSize

**`getContentItemById(orgId, id)`**
- Retrieves single content item
- Returns: `ContentItem | null`

**`createContentItem(orgId, data)`**
- Creates new content item
- Auto-generates: word count, slug, embeddings
- Returns: `ContentItem`

**`updateContentItem(orgId, id, updates)`**
- Updates existing content item
- Recalculates: word count, embeddings if body changed
- Returns: `ContentItem | null`

#### Content Brief Methods

**`listContentBriefs(orgId, filters)`**
- Lists content briefs with status filtering
- Filters: status, limit, offset
- Returns: `ContentBrief[]`

**`getContentBriefWithContext(orgId, id)`**
- Gets brief with related topics and suggested keywords
- Integrates with SEO pillar for keyword suggestions
- Returns: `ContentBriefWithContextDTO`

**`createContentBrief(orgId, data)`**
- Creates new content brief
- Returns: `ContentBrief`

**`updateContentBrief(orgId, id, updates)`**
- Updates existing content brief
- Returns: `ContentBrief | null`

#### Clustering Methods

**`listContentClusters(orgId)`**
- Lists all topic clusters with topics and representative content
- Returns: `ContentClusterDTO[]`

**`rebuildTopicClusters(orgId)`**
- Rebuilds topic clusters (stub: creates single "General Topics" cluster)
- Future: Will implement embeddings-based clustering (k-means, DBSCAN)
- Returns: `ContentClusterDTO[]`

#### Gap Analysis Methods

**`listContentGaps(orgId, filters)`**
- Identifies content opportunities from SEO keywords
- Filters: keyword, minScore, topicId, limit
- Scoring formula: `(searchVolume/100) * (1-difficulty/100) * (1-existingContent/10) * 100`
- Returns: `ContentGapDTO[]` sorted by opportunity score

---

## Clustering Heuristic

### Current Implementation (V1)

**Approach**: Single cluster stub
**Algorithm**: All topics assigned to one "General Topics" cluster

### Future Enhancement (V2+)

**Approach**: Embeddings-based clustering
**Algorithms**:
- K-means clustering on topic embeddings
- DBSCAN for density-based clustering
- Hierarchical clustering for nested topic structures

**Process**:
1. Generate embeddings for all topics using OpenAI/Anthropic
2. Apply clustering algorithm (configurable)
3. Calculate cluster centroids
4. Assign representative content items to each cluster
5. Generate cluster names from most common topic keywords

---

## Gap Detection Logic

### Scoring Formula

```typescript
seoOpportunityScore = Math.min(100, Math.max(0,
  (searchVolume / 100) *
  (1 - difficulty / 100) *
  (1 - existingContentCount / 10) *
  100
));
```

### Factors

1. **Search Volume** (from SEO keywords)
   - Higher search volume = higher opportunity
   - Normalized to 0-100 scale

2. **Difficulty Score** (from SEO keywords)
   - Lower difficulty = higher opportunity
   - Inverse relationship (1 - difficulty/100)

3. **Existing Content Count**
   - Fewer existing content items = higher opportunity
   - Counts content items where title or URL matches keyword
   - Inverse relationship (1 - count/10)

### Score Interpretation

- **70-100**: High opportunity (green badge)
- **40-69**: Medium opportunity (yellow badge)
- **0-39**: Low opportunity (gray badge)

---

## API Reference

### Content Items

**GET /api/v1/content/items**
- Query params: `status`, `q`, `topicId`, `page`, `pageSize`, `contentType`
- Response: `ContentItemListDTO`
- Auth: requireUser, requireOrg

**GET /api/v1/content/items/:id**
- Response: `ContentItem`
- Auth: requireUser, requireOrg

**POST /api/v1/content/items**
- Body: `CreateContentItemParams` (validated via Zod)
- Response: `ContentItem`
- Auth: requireUser, requireOrg

**PUT /api/v1/content/items/:id**
- Body: `UpdateContentItemParams` (validated via Zod)
- Response: `ContentItem`
- Auth: requireUser, requireOrg

### Content Briefs

**GET /api/v1/content/briefs**
- Query params: `status`, `limit`, `offset`
- Response: `ContentBrief[]`
- Auth: requireUser, requireOrg

**GET /api/v1/content/briefs/:id**
- Response: `ContentBriefWithContextDTO`
- Includes: related topics, suggested keywords from SEO
- Auth: requireUser, requireOrg

**POST /api/v1/content/briefs**
- Body: `CreateContentBriefParams` (validated via Zod)
- Response: `ContentBrief`
- Auth: requireUser, requireOrg

**PUT /api/v1/content/briefs/:id**
- Body: `UpdateContentBriefParams` (validated via Zod)
- Response: `ContentBrief`
- Auth: requireUser, requireOrg

### Topic Clusters

**GET /api/v1/content/clusters**
- Response: `ContentClusterDTO[]`
- Includes: topics and representative content for each cluster
- Auth: requireUser, requireOrg

### Content Gaps

**GET /api/v1/content/gaps**
- Query params: `keyword`, `minScore`, `topicId`, `limit`
- Response: `ContentGapDTO[]`
- Sorted by SEO opportunity score (descending)
- Auth: requireUser, requireOrg

---

## Dashboard UX

**Location**: `apps/dashboard/src/app/app/content/page.tsx`

### Layout

Three-panel horizontal layout:

#### Left Panel: Content Library (1/3 width)
- Search input (debounced, 500ms)
- Status filter dropdown (all, draft, published, archived)
- Content type filter dropdown (all types)
- Scrollable content items list
- Pagination controls (prev/next, page indicator)
- Items show: title, status badge, type, word count, date

#### Center Panel: Content Detail / Briefs (1/3 width)
- Tab navigation: "Content Detail" | "Briefs (count)"
- **Content Detail tab**: Shows selected item details
  - Title, status, type, slug, URL
  - Word count, reading time
  - Published date
  - Content preview (6-line clamp)
- **Briefs tab**: Lists all briefs
  - Click brief to see full context view
  - Shows suggested keywords (from SEO)
  - Shows related topics
  - Back button to return to list

#### Right Panel: Insights (1/3 width)
- **Topic Clusters card**: Shows all clusters with topic/content counts
- **Content Opportunities card**: Top 10 gaps with opportunity scores
  - Color-coded badges (green/yellow/gray)
  - Shows keyword, intent, existing content count

### Interactions

1. **Select content item**: Click in left panel → details show in center
2. **View brief**: Switch to Briefs tab → click brief → see context
3. **Filter content**: Change status/type → auto-refresh list
4. **Search**: Type in search box → debounced fetch after 500ms
5. **Pagination**: Click prev/next → load new page

---

## Integration Points

### SEO Pillar Integration

1. **Suggested Keywords for Briefs**
   - Fetches top 5 SEO keywords matching brief's target keyword
   - Shows search volume and difficulty
   - Updates when brief keyword changes

2. **Content Gap Detection**
   - Reads from `seo_keywords` table
   - Filters for active keywords only
   - Matches existing content via title/URL search

### Future Integrations

- **PR Pillar**: Match content to earned media mentions
- **Agent System**: Auto-generate content from briefs using LLMs
- **Analytics**: Track content performance metrics
- **Publishing**: Direct publishing to CMS/platforms

---

## Helper Functions

### Word Count Calculation

```typescript
calculateWordCount(text: string): number {
  return text.trim().split(/\s+/).length;
}
```

Simple whitespace splitting. Future: Handle code blocks, tables, special chars.

### Slug Generation

```typescript
generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

Converts to lowercase, replaces non-alphanumeric with hyphens, trims edges.

### Embeddings Generation (Stub)

```typescript
async generateEmbeddings(_text: string): Promise<number[]> {
  // V1: Random 1536-dimensional vector
  return new Array(1536).fill(0).map(() => Math.random());
}
```

Future: Use OpenAI `text-embedding-3-small` or Anthropic embeddings.

---

## Validation

All API endpoints use Zod schemas from `@pravado/validators`:

- `listContentItemsSchema`
- `createContentItemSchema`
- `updateContentItemSchema`
- `listContentBriefsSchema`
- `createContentBriefSchema`
- `updateContentBriefSchema`
- `listContentGapsSchema`

Validation errors return:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid ...",
    "details": [...] // Zod error details
  }
}
```

---

## Testing

See `apps/api/tests/contentService.test.ts` for comprehensive tests covering:

- Content item CRUD operations
- Word count auto-calculation
- Slug generation
- Content brief CRUD
- Brief context fetching (with SEO integration)
- Cluster listing
- Gap detection and scoring

---

## Future Enhancements (Post-V1)

1. **Advanced Clustering**
   - Implement k-means/DBSCAN on real embeddings
   - Auto-generate cluster names from topic keywords
   - Support manual cluster management

2. **Real Embeddings**
   - Integrate OpenAI or Anthropic embeddings API
   - Implement similarity search for related content
   - Support semantic content recommendations

3. **Content Performance**
   - Track views, engagement, conversions
   - Calculate performance scores
   - Identify top-performing content patterns

4. **AI Content Generation**
   - Generate content from briefs using LLMs
   - Support multiple tones and styles
   - Integrate with agent system (S9+)

5. **Publishing Workflows**
   - Direct CMS integration (WordPress, Contentful, etc.)
   - Scheduling and automated publishing
   - Multi-channel distribution

6. **Advanced Analytics**
   - Content ROI tracking
   - Topic trend analysis
   - Competitive content gap analysis

---

## Migration

**File**: `apps/api/supabase/migrations/26_extend_content_schema.sql`

### Changes

1. **content_items**: Added status, url, word_count, primary_topic_id, embeddings (vector), performance (JSONB)
2. **content_briefs**: Added target_keyword, target_intent, outline (JSONB), status
3. **content_topics**: Added embeddings (vector), cluster_id
4. **content_topic_clusters**: New table created

### Indexes Added

- Composite indexes on org_id + status/topic
- HNSW vector indexes for similarity search
- Foreign key constraints for referential integrity

---

## Troubleshooting

### No content items showing

**Check**:
1. User has org_id set (requireOrg middleware)
2. Content items exist in database for that org
3. API is running on port 4000
4. Credentials are being sent (`credentials: 'include'`)

### Briefs not showing suggested keywords

**Check**:
1. SEO keywords exist in database for org
2. Target keyword in brief matches SEO keywords
3. SEO keywords have status = 'active'

### Content gaps not appearing

**Check**:
1. SEO keywords exist and are active
2. Keywords have search_volume > 0
3. Gap detection query is not filtered out by minScore

---

## Deployment Checklist

- [ ] Run migration 26 on production database
- [ ] Verify vector extension (pgvector) is installed
- [ ] Test all API endpoints with production data
- [ ] Verify RLS policies are working
- [ ] Monitor embedding generation performance
- [ ] Set up error tracking for content operations
- [ ] Document content workflow for team

---

## Summary

Content Intelligence V1 provides a solid foundation for content management with SEO integration, topic clustering, and gap analysis. The system is ready for production use with stub implementations for ML features (embeddings, clustering) that can be enhanced in future sprints.

**Key Achievements**:
- ✅ Full content library CRUD
- ✅ Content briefs with SEO context
- ✅ Topic clustering foundation
- ✅ Content gap detection
- ✅ Three-panel dashboard UI
- ✅ Comprehensive API with validation
- ✅ Cross-pillar SEO integration
