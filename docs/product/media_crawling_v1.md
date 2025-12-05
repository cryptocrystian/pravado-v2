# Automated Media Crawling & RSS Ingestion V1

**Sprint**: S41
**Status**: Complete
**Feature Flag**: `ENABLE_MEDIA_CRAWLING`

## Overview

Sprint S41 extends S40's Media Monitoring Engine with full automation capabilities:
- RSS feed management and parsing
- Automatic article discovery and job queue creation
- Background crawl job processing
- Integration with S40 ingestion pipeline
- Retry logic with exponential backoff

## Architecture

### RSS → Queue → Crawl → Ingest Flow

```
RSS Feed → fetchRSS() → Create Crawl Jobs (queued)
                              ↓
                        processPendingJobs()
                              ↓
                        executeCrawlJob()
                              ↓
                        crawlURL() (stub)
                              ↓
                      S40 ingestArticle()
                              ↓
                   Media Monitoring Article
```

### Database Schema (Migration 46)

**media_rss_feeds**
- Tracks RSS feed sources
- Fetch frequency, last fetched timestamp
- Article count tracking

**media_crawl_jobs**
- Queue of article URLs to crawl
- Status: queued → running → success/failed
- Retry count and error tracking
- Links to resulting article

### Service Architecture

```
MediaCrawlerService
├── RSS Feed Management
│   ├── addRSSFeed()
│   ├── listRSSFeeds()
│   ├── updateRSSFeed()
│   └── deactivateRSSFeed()
├── RSS Fetcher (stub XML parser)
│   ├── fetchRSS()
│   └── normalizeURL()
├── Crawl Job Management
│   ├── createCrawlJob()
│   ├── listCrawlJobs()
│   └── updateCrawlJobStatus()
├── RSS Ingestion Workflow
│   ├── ingestFromRSSFeed()
│   ├── fetchAllActiveFeeds()
│   └── updateRSSFeedMetadata()
├── HTML Crawler (stub)
│   └── crawlURL()
├── Job Execution
│   ├── executeCrawlJob()
│   └── processPendingJobs()
└── Statistics
    ├── getStats()
    └── getStatsFallback()
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/media-monitoring/rss-feeds` | Add RSS feed |
| GET | `/api/v1/media-monitoring/rss-feeds` | List RSS feeds |
| GET | `/api/v1/media-monitoring/rss-feeds/:id` | Get RSS feed |
| PUT | `/api/v1/media-monitoring/rss-feeds/:id` | Update RSS feed |
| DELETE | `/api/v1/media-monitoring/rss-feeds/:id` | Deactivate RSS feed |
| POST | `/api/v1/media-monitoring/rss/fetch` | Trigger RSS fetch |
| POST | `/api/v1/media-monitoring/crawl-jobs` | Create crawl job |
| GET | `/api/v1/media-monitoring/crawl-jobs` | List crawl jobs |
| POST | `/api/v1/media-monitoring/crawl-jobs/run` | Run pending jobs |
| GET | `/api/v1/media-monitoring/rss/stats` | Get statistics |

## Stub Implementations

### RSS Fetcher
- Currently generates deterministic mock articles based on URL hash
- Production would use fast-xml-parser or xml2js
- Returns array of RSSArticleItem with title, link, publishedAt, etc.

### HTML Crawler
- Stub content extraction based on URL
- Production would use Puppeteer, Cheerio, or Readability.js
- Extracts title, author, content, keywords

## Job Processing

### Retry Logic
- Max retries: 3 (configurable)
- Exponential backoff: 5s delay (configurable)
- Status tracking: queued → running → success/failed

### Worker Integration
- Compatible with existing S18/S21 queue system
- Can register "media:crawl" job type
- Batch processing: processPendingJobs() handles multiple jobs

## Dashboard UI

### RSS Page (`/app/media-monitoring/rss`)
- **Left**: RSS feed list with add/deactivate
- **Center**: Crawl jobs table with status badges
- **Right**: Statistics sidebar
- **Actions**: Fetch All Feeds, Run Jobs buttons

### Components
- CrawlStatusBadge - Queued/Running/Success/Failed badges
- Integrated with S40 styling patterns

## Future Enhancements (S42+)

1. **Real HTTP Fetching**
   - Actual HTTP clients (axios, node-fetch)
   - Real XML parsing
   - Proper error handling for network failures

2. **Publisher-Specific Scrapers**
   - Custom extractors for major publications
   - Structured data extraction (JSON-LD, microdata)
   - Paywall detection

3. **Scheduled Crawling**
   - Cron jobs or queue-based scheduling
   - Per-feed frequency configuration
   - Time-based triggers

4. **Advanced Job Management**
   - Priority queues
   - Rate limiting per domain
   - Distributed crawling

## Security & Performance

- **Authentication**: All endpoints require user auth
- **Org Isolation**: RLS policies on all tables
- **URL Normalization**: Strips tracking parameters
- **Deduplication**: Unique constraints prevent duplicate jobs
- **Batch Processing**: Configurable batch size for worker

## Dependencies

- S40: Media Monitoring Engine (ingestion pipeline)
- S18/S21: Queue system (compatible job runner)
- pgvector: Vector embeddings for articles
- Supabase: Database with RLS

## Limitations

- Stub RSS parser (no real HTTP/XML)
- Stub HTML crawler (no real scraping)
- Manual job execution (no automated scheduling)
- No rate limiting per domain
