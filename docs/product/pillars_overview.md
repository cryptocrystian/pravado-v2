# Pravado Intelligence Pillars - Overview

## Introduction

Pravado v2 is built on three interconnected intelligence pillars that work together to create a unified "mesh intelligence" system for comprehensive marketing operations:

1. **PR Intelligence** - Media relations, journalist outreach, and earned media tracking
2. **Content Intelligence** - Content planning, creation, and performance optimization
3. **SEO Intelligence** - Keyword research, competitive analysis, and organic search optimization

Each pillar operates independently but shares data, insights, and workflows through a common tagging system and multi-agent orchestration layer.

---

## PR Intelligence Pillar

### Purpose
Automate and optimize public relations workflows including media database management, pitch generation, journalist relationship tracking, and earned media value measurement.

### Core Capabilities
- **Media Database**: Comprehensive tracking of media outlets, journalists, and their coverage areas
- **Pitch Generation**: AI-powered pitch email creation with personalization
- **Coverage Tracking**: Monitor press mentions, backlinks, and earned media value
- **Campaign Automation**: Multi-agent workflows for PR campaign execution

### Data Models

#### Media Outlets
Tracks publications, websites, podcasts, and other media channels.

**Schema**: `media_outlets`
- `id` (UUID) - Primary key
- `org_id` (UUID) - Organization reference
- `name` (TEXT) - Outlet name (e.g., "TechCrunch", "The Verge")
- `outlet_type` (TEXT) - Type: 'publication', 'blog', 'podcast', 'tv', 'radio', 'other'
- `url` (TEXT) - Primary website URL
- `tier` (TEXT) - Tier classification: 'tier1', 'tier2', 'tier3', 'niche'
- `monthly_reach` (INTEGER) - Estimated monthly audience
- `domain_authority` (INTEGER) - SEO metric (0-100)
- `metadata` (JSONB) - Additional structured data (social profiles, contact info, etc.)
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Relationships**:
- Has many `journalists`
- Has many `pr_sources` (backlinks/mentions from this outlet)

#### Journalists
Individual media contacts and their coverage areas.

**Schema**: `journalists`
- `id` (UUID)
- `org_id` (UUID)
- `media_outlet_id` (UUID) - Foreign key to media_outlets
- `name` (TEXT) - Full name
- `email` (TEXT) - Contact email
- `twitter_handle` (TEXT)
- `linkedin_url` (TEXT)
- `beat` (TEXT) - Coverage area (e.g., "enterprise software", "AI/ML")
- `last_contact_date` (TIMESTAMPTZ) - When last contacted
- `response_rate` (DECIMAL) - Percentage (0-100)
- `metadata` (JSONB)
- `created_at`, `updated_at`

**Relationships**:
- Belongs to one `media_outlet`
- Has many `pr_sources` (articles/mentions attributed to this journalist)

#### PR Sources
Tracks all earned media: press releases, backlinks, mentions, and media coverage.

**Schema**: `pr_sources`
- `id` (UUID)
- `org_id` (UUID)
- `source_type` (TEXT) - 'press_release', 'backlink', 'mention', 'earned_media'
- `title` (TEXT) - Article/mention title
- `url` (TEXT) - Link to the source
- `published_at` (TIMESTAMPTZ)
- `media_outlet_id` (UUID) - Which outlet published it
- `journalist_id` (UUID) - Which journalist wrote it
- `sentiment` (TEXT) - 'positive', 'neutral', 'negative'
- `evi_score` (DECIMAL) - Earned Value Index score
- `metadata` (JSONB) - Additional data (word count, share count, etc.)
- `created_at`, `updated_at`

**Relationships**:
- Belongs to one `media_outlet` (optional)
- Belongs to one `journalist` (optional)
- Can be tagged via `tag_assignments`

#### PR Events
Tracks PR campaigns, press releases, and outreach events.

**Schema**: `pr_events`
- `id` (UUID)
- `org_id` (UUID)
- `event_type` (TEXT) - 'campaign', 'press_release', 'pitch', 'event'
- `name` (TEXT)
- `description` (TEXT)
- `start_date` (TIMESTAMPTZ)
- `end_date` (TIMESTAMPTZ)
- `status` (TEXT) - 'draft', 'active', 'completed', 'cancelled'
- `metadata` (JSONB)
- `created_at`, `updated_at`

**Relationships**:
- Can be tagged via `tag_assignments`
- Can be associated with playbook executions (S4+)

#### PR Topics
Content topics for semantic PR targeting using vector embeddings.

**Schema**: `pr_topics`
- `id` (UUID)
- `org_id` (UUID)
- `topic` (TEXT) - Topic name
- `description` (TEXT)
- `embedding` (VECTOR(1536)) - OpenAI embedding for semantic matching
- `metadata` (JSONB)
- `created_at`, `updated_at`

**Use Case**: Match journalists to relevant topics based on semantic similarity, auto-categorize PR sources.

---

## Content Intelligence Pillar

### Purpose
AI-powered content planning, brief generation, performance tracking, and content gap analysis for comprehensive content marketing.

### Core Capabilities
- **Content Calendar**: AI-generated publishing schedules optimized for audience engagement
- **Brief Generator**: Automated content brief creation with SEO research and structure
- **Performance Tracking**: Multi-channel content analytics (traffic, engagement, conversions)
- **Topic Clustering**: AI-powered topic analysis and content gap identification

### Data Models

#### Content Items
All published or planned content pieces.

**Schema**: `content_items`
- `id` (UUID)
- `org_id` (UUID)
- `title` (TEXT)
- `content_type` (TEXT) - 'blog_post', 'whitepaper', 'video', 'podcast', 'infographic', 'case_study', 'other'
- `status` (TEXT) - 'draft', 'in_review', 'published', 'archived'
- `body` (TEXT) - Full content text
- `url` (TEXT) - Published URL
- `published_at` (TIMESTAMPTZ)
- `word_count` (INTEGER)
- `reading_time_minutes` (INTEGER)
- `performance_score` (DECIMAL) - Composite performance metric (0-100)
- `metadata` (JSONB) - Author, editor, analytics data, etc.
- `created_at`, `updated_at`

**Relationships**:
- Can have one `content_brief`
- Can be associated with multiple `content_topics`
- Can be tagged via `tag_assignments`

#### Content Briefs
Structured content briefs with SEO research and writing guidelines.

**Schema**: `content_briefs`
- `id` (UUID)
- `org_id` (UUID)
- `content_item_id` (UUID) - Foreign key to content_items
- `target_keywords` (TEXT[]) - Array of target keywords
- `target_word_count` (INTEGER)
- `target_audience` (TEXT)
- `tone` (TEXT) - 'formal', 'casual', 'technical', 'conversational'
- `outline` (JSONB) - Structured outline with sections
- `research_data` (JSONB) - Competitive research, sources, data points
- `metadata` (JSONB)
- `created_at`, `updated_at`

**Relationships**:
- Belongs to one `content_item`

#### Content Topics
Topic clusters for content organization and gap analysis.

**Schema**: `content_topics`
- `id` (UUID)
- `org_id` (UUID)
- `topic` (TEXT)
- `parent_topic_id` (UUID) - Self-referential for topic hierarchies
- `description` (TEXT)
- `embedding` (VECTOR(1536)) - For semantic clustering
- `metadata` (JSONB)
- `created_at`, `updated_at`

**Use Case**: Build topic clusters (pillar pages + cluster content), identify content gaps, auto-tag content items.

---

## SEO Intelligence Pillar

### Purpose
Comprehensive SEO management including keyword tracking, competitive analysis, SERP monitoring, and opportunity discovery.

### Core Capabilities
- **Keyword Tracking**: Monitor keyword rankings, search volume, and difficulty
- **Opportunity Finder**: AI-powered discovery of keyword gaps, content refreshes, quick wins
- **Competitor Analysis**: Track competitor rankings, backlinks, and content strategies
- **SERP Tracking**: Historical SERP snapshots with featured snippet and PAA tracking

### Data Models

#### SEO Keywords
Target keywords and their performance metrics.

**Schema**: `seo_keywords`
- `id` (UUID)
- `org_id` (UUID)
- `keyword` (TEXT) - The target keyword phrase
- `search_volume` (INTEGER) - Monthly search volume
- `difficulty` (INTEGER) - SEO difficulty score (0-100)
- `current_rank` (INTEGER) - Current ranking position
- `target_url` (TEXT) - URL you're optimizing for this keyword
- `seo_page_id` (UUID) - Foreign key to seo_pages
- `metadata` (JSONB) - CPC, trend data, seasonality, etc.
- `created_at`, `updated_at`

**Relationships**:
- Belongs to one `seo_page`
- Has many `seo_snapshots` (historical SERP data)
- Can be tagged via `tag_assignments`

#### SEO Pages
Individual pages being optimized for SEO.

**Schema**: `seo_pages`
- `id` (UUID)
- `org_id` (UUID)
- `url` (TEXT) - Full page URL
- `title` (TEXT) - Page title
- `meta_description` (TEXT)
- `page_type` (TEXT) - 'homepage', 'blog_post', 'product_page', 'landing_page', 'other'
- `status` (TEXT) - 'active', 'draft', 'archived'
- `performance_score` (DECIMAL) - Composite SEO health score (0-100)
- `metadata` (JSONB) - Word count, internal links, images, etc.
- `created_at`, `updated_at`

**Relationships**:
- Has many `seo_keywords`
- Has many `seo_opportunities`

#### SEO Opportunities
Actionable SEO improvement recommendations.

**Schema**: `seo_opportunities`
- `id` (UUID)
- `org_id` (UUID)
- `opportunity_type` (TEXT) - 'keyword_gap', 'content_refresh', 'technical_fix', 'quick_win', 'backlink_opportunity'
- `title` (TEXT) - Opportunity title
- `description` (TEXT) - Detailed explanation
- `priority` (TEXT) - 'low', 'medium', 'high', 'critical'
- `estimated_impact` (TEXT) - Expected traffic/ranking improvement
- `seo_page_id` (UUID) - Which page to optimize (optional)
- `seo_keyword_id` (UUID) - Related keyword (optional)
- `status` (TEXT) - 'open', 'in_progress', 'completed', 'dismissed'
- `metadata` (JSONB) - Implementation notes, links, etc.
- `created_at`, `updated_at`

**Relationships**:
- Belongs to one `seo_page` (optional)
- Belongs to one `seo_keyword` (optional)

#### SEO Competitors
Competitor tracking for competitive analysis.

**Schema**: `seo_competitors`
- `id` (UUID)
- `org_id` (UUID)
- `domain` (TEXT) - Competitor domain
- `name` (TEXT) - Company name
- `is_primary_competitor` (BOOLEAN)
- `domain_authority` (INTEGER) - SEO metric (0-100)
- `estimated_traffic` (INTEGER) - Monthly organic traffic estimate
- `metadata` (JSONB) - Backlink count, top keywords, etc.
- `created_at`, `updated_at`

**Relationships**:
- Can be tagged via `tag_assignments`

#### SEO Snapshots
Historical SERP position tracking.

**Schema**: `seo_snapshots`
- `id` (UUID)
- `org_id` (UUID)
- `seo_keyword_id` (UUID) - Foreign key to seo_keywords
- `rank` (INTEGER) - Position in SERP
- `url` (TEXT) - URL that ranked
- `serp_features` (TEXT[]) - Array of features: 'featured_snippet', 'people_also_ask', 'local_pack', etc.
- `snapshot_date` (TIMESTAMPTZ)
- `metadata` (JSONB) - SERP result details
- `created_at`

**Relationships**:
- Belongs to one `seo_keyword`

---

## Cross-Pillar Integration

### Shared Tagging System

All entities across pillars can be tagged using a polymorphic tagging system:

**Schema**: `tags`
- `id` (UUID)
- `org_id` (UUID)
- `name` (TEXT) - Tag name (unique per org)
- `color` (TEXT) - Hex color for UI display
- `created_at`, `updated_at`

**Schema**: `tag_assignments`
- `id` (UUID)
- `org_id` (UUID)
- `tag_id` (UUID) - Foreign key to tags
- `taggable_type` (TEXT) - Entity type: 'pr_source', 'content_item', 'seo_keyword', etc.
- `taggable_id` (UUID) - Entity ID
- `created_at`

**Use Cases**:
- Tag a PR source with "Product Launch Q1"
- Tag content items with "AI/ML" topic
- Tag SEO keywords with "High Priority"
- Cross-reference entities: "Find all content items and PR sources tagged with 'Product Launch Q1'"

### Vector Embeddings for Semantic Connections

Both PR and Content pillars use `VECTOR(1536)` embeddings for semantic matching:

- `pr_topics.embedding` - Match journalists to relevant topics
- `content_topics.embedding` - Cluster content by semantic similarity

**Future S4+ Features**:
- Auto-suggest journalists for content topics
- Identify PR opportunities for existing content
- Recommend content topics based on PR coverage trends

### Mesh Intelligence Model

The "mesh" concept means all three pillars feed each other:

1. **SEO → Content**:
   - SEO opportunities become content briefs
   - Keyword research informs content calendar
   - SERP features guide content structure (e.g., optimize for featured snippets)

2. **Content → PR**:
   - Published content items trigger PR outreach
   - Content topics suggest journalists to pitch
   - Performance data prioritizes which content to promote

3. **PR → SEO**:
   - Earned media backlinks tracked in SEO competitors
   - Journalist coverage topics inform keyword research
   - Press mentions generate content refresh opportunities

4. **Bidirectional Flows**:
   - A new blog post (Content) can automatically:
     - Generate SEO opportunities (e.g., "Add internal links from pillar page")
     - Trigger PR outreach playbook (e.g., "Pitch to journalists covering this topic")
   - A high-ranking keyword (SEO) can:
     - Create content brief for a comprehensive guide
     - Identify journalists writing about this topic for relationship building

### Multi-Agent Orchestration

Agents (S4+) can execute workflows across pillars:

**Example Playbook**: "Product Launch Campaign"
1. **SEO Agent**: Research high-value keywords for product category
2. **Content Agent**: Generate content brief for launch announcement
3. **PR Agent**: Identify tier-1 journalists covering this product category
4. **Content Agent**: Draft blog post optimized for target keywords
5. **PR Agent**: Generate personalized pitch emails with blog post link
6. **SEO Agent**: Monitor keyword rankings post-launch
7. **PR Agent**: Track earned media coverage and backlinks

All agents share data via the unified database (keywords, content items, journalist lists) and can be orchestrated through playbook templates.

---

## API Structure

All pillars expose consistent REST API patterns:

### PR Endpoints
- `GET /api/v1/pr/sources` - List PR sources
- `GET /api/v1/pr/outlets` - List media outlets
- `GET /api/v1/pr/journalists` - List journalists

### Content Endpoints
- `GET /api/v1/content/items` - List content items
- `GET /api/v1/content/briefs` - List content briefs

### SEO Endpoints
- `GET /api/v1/seo/keywords` - List SEO keywords
- `GET /api/v1/seo/pages` - List SEO pages
- `GET /api/v1/seo/opportunities` - List SEO opportunities
- `GET /api/v1/seo/competitors` - List competitors

### Cross-Pillar Endpoints
- `GET /api/v1/playbooks` - List multi-agent playbooks
- `POST /api/v1/playbooks/validate` - Validate playbook structure
- `GET /api/v1/agents` - List available agents

All endpoints:
- Require authentication (`requireUser` middleware)
- Return consistent response shape: `{ success: boolean, data?: T, error?: { code, message } }`
- Support pagination via `?limit=N&offset=N`
- Validate inputs with Zod schemas

---

## Row-Level Security (RLS)

All tables enforce organization-level data isolation via Supabase RLS policies:

```sql
-- Example RLS policy on pr_sources
CREATE POLICY "Users can view pr_sources in their org"
  ON public.pr_sources FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid()
    )
  );
```

Every table has policies for:
- **SELECT**: Users can only see data from their org(s)
- **INSERT**: Users can only create data for their org(s)
- **UPDATE**: Users can only update data from their org(s)
- **DELETE**: Users can only delete data from their org(s)

This ensures complete data isolation between organizations at the database level.

---

## Future Enhancements (S4+)

### Sprint S4 and Beyond
- **Visual Playbook Editor**: Drag-and-drop workflow builder
- **Agent Execution Runtime**: Actually run multi-agent workflows
- **Real-time Monitoring**: Live execution dashboards with step-by-step progress
- **Conditional Logic**: If/then branching in playbooks
- **Retry Policies**: Auto-retry failed agent tasks
- **Analytics Dashboard**: Cross-pillar performance metrics
- **AI Content Generation**: Full-text content creation via agents
- **Automated Pitch Sending**: Integration with email providers
- **SERP Tracking Automation**: Daily keyword rank checks
- **Backlink Monitoring**: Auto-detect new backlinks and mentions

### Embeddings and Semantic Search
- Populate all `embedding` columns with OpenAI embeddings
- Build semantic search across all pillars
- Auto-clustering of content/PR topics
- Journalist-topic matching based on past coverage analysis

### Advanced Workflows
- **Content-to-PR Pipeline**: Publish blog post → auto-generate pitch → send to matched journalists
- **SEO-to-Content Pipeline**: Identify keyword gap → generate brief → assign to writer → track performance
- **PR-to-SEO Feedback Loop**: Track earned backlinks → measure SEO impact → prioritize outlets

---

## Summary

Pravado's three intelligence pillars (PR, Content, SEO) operate as an interconnected mesh:

- **Independent Operation**: Each pillar has its own data models, UI, and workflows
- **Shared Foundation**: Common tagging, vector embeddings, and agent orchestration
- **Bidirectional Data Flow**: Insights from one pillar inform actions in others
- **Multi-Agent Automation**: Playbooks execute complex workflows across pillars
- **Organization-Level Isolation**: RLS ensures complete data security

Sprint S3 establishes the data foundation and API scaffolding. Sprint S4+ will add the visual editor, agent execution runtime, and advanced automation features.
