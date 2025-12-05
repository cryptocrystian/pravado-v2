# Media Monitoring & Earned Coverage Engine V1

**Sprint**: S40
**Status**: Complete
**Feature Flag**: `ENABLE_MEDIA_MONITORING`

## Overview

The Media Monitoring Engine transforms Pravado into a comprehensive PR intelligence platform by enabling:
- Real-time media monitoring across configured publication sources
- Article ingestion with content extraction and embedding generation
- Earned mention detection using LLM-powered analysis
- Journalist matching to link coverage with PR contacts
- Relevance scoring and sentiment analysis

## Architecture

### Data Model

```
┌─────────────────────────────┐
│  media_monitoring_sources   │
├─────────────────────────────┤
│ - name                      │
│ - url                       │
│ - active                    │
│ - source_type               │
│ - crawl_frequency_hours     │
│ - last_crawled_at           │
└──────────┬──────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────┐
│  media_monitoring_articles  │
├─────────────────────────────┤
│ - url                       │
│ - title                     │
│ - author                    │
│ - published_at              │
│ - content                   │
│ - summary                   │
│ - embeddings vector(1536)   │
│ - relevance_score           │
│ - keywords[]                │
│ - domain_authority          │
└──────────┬──────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────────────┐
│  earned_mentions            │
├─────────────────────────────┤
│ - article_id (FK)           │
│ - journalist_id (FK)        │
│ - entity                    │
│ - entity_type               │
│ - snippet                   │
│ - sentiment                 │
│ - confidence                │
│ - is_primary_mention        │
└─────────────────────────────┘
```

### Service Architecture

```
MediaMonitoringService
├── Source Management
│   ├── createSource()
│   ├── listSources()
│   ├── getSource()
│   ├── updateSource()
│   └── deactivateSource()
├── Article Ingestion Pipeline
│   ├── ingestArticle()
│   ├── extractArticleContent() [stub scraper]
│   ├── generateSummary()
│   ├── generateEmbeddings()
│   ├── extractKeywords()
│   ├── calculateRelevanceScore()
│   └── estimateDomainAuthority()
├── Mention Detection Engine
│   ├── detectMentions()
│   ├── detectMentionsInContent() [LLM]
│   └── detectMentionsFallback()
├── Journalist Matching
│   └── matchJournalist()
├── Article Queries
│   ├── listArticles()
│   └── getArticleWithMentions()
├── Mention Queries
│   └── listMentions()
├── Statistics
│   └── getStats()
└── Semantic Search
    └── findSimilarArticles()
```

## Ingestion Pipeline

### Content Extraction

Currently implemented as a stub scraper. In production, would use:
- Puppeteer for JavaScript-rendered pages
- Cheerio for static HTML parsing
- Custom extractors for major publication formats

### Summary Generation

Uses LLM to generate 2-3 sentence summaries:

```
System: You are a concise article summarizer. Generate a 2-3 sentence summary.
User: Title: {title}
      Content: {content}
```

Fallback: First 200 characters of content.

### Embedding Generation

Uses OpenAI's `text-embedding-3-small` model:
- 1536 dimensions
- Enables semantic similarity search
- Used for finding related articles

### Keyword Extraction

LLM-powered extraction:

```
System: Extract 5-10 relevant keywords. Return comma-separated list.
User: Title: {title}
      Content: {content}
```

Fallback: TF-IDF style frequency analysis with stop word removal.

### Relevance Scoring

Composite score based on:
- Content length (0-0.3)
- Keyword count (0-0.3)
- Title quality (0-0.2)
- Base score (0.2)

### Domain Authority

Stub implementation with tier-based scoring:
- Tier 1 (NYT, WSJ, BBC, etc.): 90
- Tier 2 (TechCrunch, Wired, etc.): 70
- .gov/.edu domains: 75
- Default: 40

## Mention Detection

### LLM-Powered Detection

Prompt structure:

```
Analyze the article and detect mentions of: {entities}

For each mention provide:
1. entity: The entity name
2. entityType: "brand", "product", "executive", "competitor"
3. snippet: Exact text containing mention
4. context: Brief context
5. sentiment: "positive", "neutral", "negative"
6. confidence: 0-1 score
7. isPrimary: Is this the main subject?
8. position: Character position

Return JSON array.
```

### Fallback Detection

Simple string matching when LLM unavailable:
- Case-insensitive search
- Extracts 100 char context around mention
- Default neutral sentiment
- 0.6 confidence score

### Sentiment Analysis

Three-tier classification:
- **Positive**: Favorable coverage, praise, success stories
- **Neutral**: Factual reporting, industry news
- **Negative**: Criticism, problems, controversies

## Journalist Matching

### Matching Strategy

1. **Exact Name Match**
   - Direct comparison with journalists table
   - Score: 1.0

2. **Fuzzy Name Match**
   - Split name into parts
   - Match against partial name components
   - Score: Based on overlap ratio

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/media-monitoring/sources` | Create source |
| GET | `/api/v1/media-monitoring/sources` | List sources |
| GET | `/api/v1/media-monitoring/sources/:id` | Get source |
| PUT | `/api/v1/media-monitoring/sources/:id` | Update source |
| DELETE | `/api/v1/media-monitoring/sources/:id` | Deactivate source |
| POST | `/api/v1/media-monitoring/ingest` | Ingest article |
| GET | `/api/v1/media-monitoring/articles` | List articles |
| GET | `/api/v1/media-monitoring/articles/:id` | Get article with mentions |
| POST | `/api/v1/media-monitoring/detect-mentions` | Detect mentions |
| GET | `/api/v1/media-monitoring/mentions` | List mentions |
| GET | `/api/v1/media-monitoring/stats` | Get statistics |

## Dashboard UI

### Media Monitoring Page

Three-column layout:
1. **Left Sidebar**: Source list with add/manage
2. **Main Panel**: Articles table or mentions list (toggle)
3. **Right Sidebar**: Statistics dashboard

### Article Drawer

Slide-out panel showing:
- Full article details
- Highlighted mentions with colors
- Keyword tags
- Source information
- Link to original article

### Components

| Component | Description |
|-----------|-------------|
| SourceList | Source management sidebar |
| ArticleTable | Paginated article list |
| MentionList | Filterable mentions with sentiment badges |
| ArticleDrawer | Article detail view with mention highlights |
| RelevanceBadge | Score visualization |
| SentimentBadge | Sentiment indicator |

## Security

1. **Authentication**: All endpoints require user auth
2. **Organization Isolation**: RLS policies on all tables
3. **Input Validation**: Zod schemas for all inputs
4. **URL Validation**: Prevents malicious URL injection

## Performance

1. **Vector Indexing**: IVFFlat index for embedding search
2. **Pagination**: All list endpoints paginated
3. **Async Generation**: Embeddings generated asynchronously
4. **Batch Operations**: Support for bulk article ingestion

## Future Enhancements

### S41+ Roadmap

1. **RSS Integration**
   - Automatic RSS feed monitoring
   - Scheduled crawling
   - New article alerts

2. **Custom Scrapers**
   - Publication-specific extractors
   - Paywall handling
   - PDF extraction

3. **Real-time Alerts**
   - Mention notifications
   - Sentiment change alerts
   - Competitor tracking

4. **Advanced Analytics**
   - Coverage trends
   - Share of voice
   - Sentiment over time
   - Journalist relationship scores

5. **Coverage Reports**
   - Automated report generation
   - Executive summaries
   - Coverage comparison

## Dependencies

- `@pravado/types`: Type definitions
- `@pravado/validators`: Zod schemas
- `@pravado/feature-flags`: Feature toggles
- `@pravado/utils`: LLM Router
- `pgvector`: PostgreSQL vector extension
- S6: PR Intelligence (journalists)
- S12-S15: Content & embeddings patterns
