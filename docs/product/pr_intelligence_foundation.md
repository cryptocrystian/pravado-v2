# PR Intelligence Foundation (Sprint S6)

## Overview

The PR Intelligence pillar provides organizations with tools to discover, organize, and engage with journalists and media outlets. Sprint S6 establishes the foundational media graph and list management system.

**Key Capabilities:**
- Search and filter journalists by name, outlet, beat, location, and tier
- Organize journalists into custom lists for campaign targeting
- Track journalist-outlet relationships and coverage areas
- Multi-tenant data isolation with organization-level security

---

## The Media Graph

### Core Entities

#### 1. Journalists (`journalists`)

The central entity representing individual journalists and media professionals.

**Schema:**
```sql
journalists (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),

  -- Identity
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT,

  -- Social & Web Presence
  twitter_handle TEXT,
  linkedin_url TEXT,
  website_url TEXT,

  -- Outlet Relationship
  primary_outlet_id UUID REFERENCES media_outlets(id),

  -- Location & Context
  location TEXT,
  timezone TEXT,
  bio TEXT,
  is_freelancer BOOLEAN,

  -- Legacy fields (deprecated)
  name TEXT,
  media_outlet_id UUID,
  beat TEXT,

  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Key Indexes:**
- `(org_id, email)` - Fast email lookup within org
- `(org_id, full_name)` - Name-based search
- `(org_id, primary_outlet_id)` - Outlet-based filtering

**Design Notes:**
- `full_name` is the canonical display name; `first_name`/`last_name` support structured queries
- `primary_outlet_id` replaces deprecated `media_outlet_id`
- Legacy fields maintained for backward compatibility
- `is_freelancer` flags journalists without primary outlet affiliation

#### 2. Media Outlets (`media_outlets`)

Publications, podcasts, blogs, TV/radio stations, and other media organizations.

**Schema:**
```sql
media_outlets (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),

  name TEXT NOT NULL,
  domain TEXT,
  website_url TEXT,

  -- Geographic & Language
  country TEXT,
  language TEXT,

  -- Classification
  outlet_type TEXT, -- 'newspaper', 'magazine', 'blog', 'podcast', 'tv', 'radio'
  tier TEXT,        -- 'top_tier', 'trade', 'niche', 'local'
  distribution TEXT, -- 'national', 'regional', 'local', 'global'

  reach_estimate INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Key Indexes:**
- `(org_id, name)` - Outlet search
- `(org_id, tier)` - Tier-based filtering

**Tier System:**
- `top_tier`: Major national/global outlets (WSJ, NYT, BBC, Reuters)
- `trade`: Industry-specific publications (TechCrunch, AdWeek)
- `niche`: Specialized or vertical-focused outlets
- `local`: Regional/city-specific media

#### 3. PR Beats (`pr_beats` + `journalist_beats`)

Coverage areas and topics journalists specialize in.

**Beats Table:**
```sql
pr_beats (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**Journalist-Beat Mapping:**
```sql
journalist_beats (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),
  journalist_id UUID NOT NULL REFERENCES journalists(id),
  beat_id UUID NOT NULL REFERENCES pr_beats(id),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,

  UNIQUE(journalist_id, beat_id)
)
```

**Examples of Beats:**
- Technology & Startups
- Healthcare & Biotech
- Finance & Markets
- Climate & Environment
- Politics & Policy
- Consumer Products
- Entertainment & Media

**Design Notes:**
- Many-to-many relationship: journalists can cover multiple beats
- `is_primary` marks the journalist's main coverage area
- Org consistency constraint ensures journalist and beat belong to same org

#### 4. PR Lists (`pr_lists` + `pr_list_members`)

Custom collections of journalists for campaign targeting and organization.

**Lists Table:**
```sql
pr_lists (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
```

**List Members Table:**
```sql
pr_list_members (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES orgs(id),
  list_id UUID NOT NULL REFERENCES pr_lists(id),
  journalist_id UUID NOT NULL REFERENCES journalists(id),
  added_by UUID REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(list_id, journalist_id)
)
```

**Design Notes:**
- Lists are org-scoped and user-created
- `is_default` can mark automatically-generated lists
- Unique constraint prevents duplicate memberships
- `added_by` tracks user who added journalist to list
- Org consistency constraint ensures journalist belongs to same org

#### 5. Integration with Tags & Topics

**Future Enhancement:**
- Link journalists to `pr_topics` via embedding-based relevance
- Use `tags` table for manual classification (e.g., "VIP", "Responsive", "Embargo-friendly")
- Build topic clusters from journalist bios and article history

---

## Multi-Tenancy & Data Isolation

### Organization-Level Security

All PR Intelligence data is isolated at the organization level using Row-Level Security (RLS).

**RLS Policies (Example from `pr_lists`):**
```sql
-- SELECT: Users can view lists from their org
CREATE POLICY select_pr_lists ON public.pr_lists
  FOR SELECT
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- INSERT: Users can create lists for their org
CREATE POLICY insert_pr_lists ON public.pr_lists
  FOR INSERT
  WITH CHECK (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- UPDATE: Users can update their org's lists
CREATE POLICY update_pr_lists ON public.pr_lists
  FOR UPDATE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );

-- DELETE: Users can delete their org's lists
CREATE POLICY delete_pr_lists ON public.pr_lists
  FOR DELETE
  USING (
    org_id IN (SELECT org_id FROM public.user_orgs WHERE user_id = auth.uid())
  );
```

**Org Consistency Constraints:**
- Foreign key relationships include org_id checks
- Example: `journalist_beats` ensures journalist and beat belong to same org
- Prevents cross-org data leakage at database level

**Service-Level Enforcement:**
- API routes retrieve `orgId` from `user_orgs` table
- All service methods require `orgId` parameter
- Queries filter by `org_id` before applying other filters

---

## Service Layer (PRMediaService)

Location: `apps/api/src/services/prMediaService.ts`

### searchJournalists

**Purpose:** Search and filter journalists with enriched context (outlet, beats).

**Signature:**
```typescript
async searchJournalists(
  orgId: string,
  options: SearchJournalistsOptions = {}
): Promise<SearchJournalistsResult>
```

**Options:**
- `q`: Search query (ILIKE on full_name, email, bio)
- `beatId`: Filter by specific beat UUID
- `outletId`: Filter by primary outlet UUID
- `country`: Filter by location field
- `tier`: Filter by outlet tier (requires outlet join)
- `limit`: Max results (default 20, max 100)
- `offset`: Pagination offset

**Algorithm:**
1. Build base query on `journalists` table with `org_id` filter
2. Apply ILIKE search on `full_name`, `email`, `bio` if `q` provided
3. Filter by `primary_outlet_id` if `outletId` provided
4. Filter by `location` if `country` provided
5. Fetch journalists with pagination (`limit`, `offset`)
6. Fetch related `media_outlets` for all journalists
7. Fetch `journalist_beats` mappings
8. Fetch `pr_beats` details
9. Build maps for outlets, beats, and journalist-beat relationships
10. Post-filter by `tier` (outlet-based) if provided
11. Post-filter by `beatId` (journalist_beats-based) if provided
12. Assemble `JournalistWithContext` objects

**Returns:**
```typescript
{
  items: JournalistWithContext[];
  total: number;
  limit: number;
  offset: number;
}
```

**JournalistWithContext:**
```typescript
{
  journalist: Journalist;
  outlet: MediaOutlet | null;
  beats: PRBeat[];
  topics: string[]; // Future: topic names
}
```

**Performance Notes:**
- Uses indexes on (org_id, email), (org_id, full_name), (org_id, primary_outlet_id)
- Batches related data fetches to avoid N+1 queries
- Tier/beat filtering done in-memory after initial fetch (acceptable for up to 100 results)

### listPRLists

**Purpose:** Get all PR lists for an organization.

**Signature:**
```typescript
async listPRLists(orgId: string): Promise<PRList[]>
```

**Implementation:**
- Fetches all `pr_lists` where `org_id = orgId`
- Orders by `created_at DESC` (newest first)
- Maps database rows to `PRList` type

### getPRListWithMembers

**Purpose:** Get a specific list with all its members and their context.

**Signature:**
```typescript
async getPRListWithMembers(
  orgId: string,
  listId: string
): Promise<PRListWithMembers | null>
```

**Algorithm:**
1. Fetch `pr_lists` row by `id` and `org_id`
2. Fetch `pr_list_members` for the list
3. Fetch `journalists` for all member IDs
4. Fetch related `media_outlets` for all journalists
5. Fetch `journalist_beats` and `pr_beats`
6. Build maps and assemble `JournalistWithContext` objects
7. Return list + members + member count

**Returns:**
```typescript
{
  list: PRList;
  members: JournalistWithContext[];
  memberCount: number;
}
```

### createPRList

**Purpose:** Create a new PR list.

**Signature:**
```typescript
async createPRList(
  orgId: string,
  userId: string,
  name: string,
  description?: string
): Promise<PRList>
```

**Implementation:**
- Inserts into `pr_lists` with `org_id`, `created_by`, `name`, `description`
- Returns created list

### addMembersToList

**Purpose:** Add journalists to an existing list.

**Signature:**
```typescript
async addMembersToList(
  orgId: string,
  listId: string,
  journalistIds: string[],
  userId: string
): Promise<void>
```

**Implementation:**
1. Verify list exists and belongs to org
2. Prepare member records with `org_id`, `list_id`, `journalist_id`, `added_by`
3. **Upsert** members with `onConflict: 'list_id,journalist_id'`, `ignoreDuplicates: true`
4. Idempotent: adding same journalist twice is safe

### removeMembersFromList

**Purpose:** Remove journalists from a list.

**Signature:**
```typescript
async removeMembersFromList(
  orgId: string,
  listId: string,
  journalistIds: string[]
): Promise<void>
```

**Implementation:**
- Deletes from `pr_list_members` where `list_id`, `org_id`, and `journalist_id IN journalistIds`

---

## API Overview

Base URL: `/api/v1/pr`

All endpoints require authentication via `requireUser` middleware.

### GET /api/v1/pr/journalists

Search journalists with filtering and context.

**Query Parameters:**
- `q` (string, optional): Search query
- `beatId` (UUID, optional): Filter by beat
- `outletId` (UUID, optional): Filter by outlet
- `country` (string, optional): Filter by location
- `tier` (string, optional): Filter by outlet tier
- `limit` (integer, optional, default 20, max 100)
- `offset` (integer, optional, default 0)

**Response:**
```typescript
{
  success: true,
  data: {
    items: JournalistWithContext[];
    total: number;
    limit: number;
    offset: number;
  }
}
```

**Example:**
```bash
GET /api/v1/pr/journalists?q=tech&tier=top_tier&limit=20
```

### GET /api/v1/pr/lists

List all PR lists for the user's organization.

**Query Parameters:** None

**Response:**
```typescript
{
  success: true,
  data: {
    items: PRList[];
  }
}
```

### GET /api/v1/pr/lists/:listId

Get a specific PR list with all its members.

**Path Parameters:**
- `listId` (UUID): List ID

**Response:**
```typescript
{
  success: true,
  data: {
    item: PRListWithMembers;
  }
}
```

**Example:**
```bash
GET /api/v1/pr/lists/550e8400-e29b-41d4-a716-446655440000
```

### POST /api/v1/pr/lists

Create a new PR list.

**Request Body:**
```typescript
{
  name: string;
  description?: string;
}
```

**Validation:**
- `name`: 1-255 characters, required
- `description`: optional

**Response:**
```typescript
{
  success: true,
  data: {
    item: PRList;
  }
}
```

**HTTP Status:** 201 Created

### POST /api/v1/pr/lists/:listId/members

Add journalists to a list.

**Path Parameters:**
- `listId` (UUID): List ID

**Request Body:**
```typescript
{
  journalistIds: string[]; // Array of journalist UUIDs, min 1
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    item: PRListWithMembers; // Updated list with members
  }
}
```

**Behavior:**
- Idempotent: adding same journalist multiple times is safe
- Returns updated list with all members

### DELETE /api/v1/pr/lists/:listId/members

Remove journalists from a list.

**Path Parameters:**
- `listId` (UUID): List ID

**Request Body:**
```typescript
{
  journalistIds: string[]; // Array of journalist UUIDs to remove
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    item: PRListWithMembers; // Updated list with remaining members
  }
}
```

### Error Responses

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

**404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "PR list not found"
  }
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters"
  }
}
```

---

## Dashboard UX

Location: `apps/dashboard/src/app/app/pr/page.tsx`

### Media Explorer Workflow

**Layout:** Two-column responsive grid
- Left column (2/3 width): Media Explorer
- Right column (1/3 width): Lists Panel

**Search & Filter:**
1. User enters search query in text input (searches name, email, bio)
2. User selects country filter (dropdown)
3. User selects tier filter (dropdown: top_tier, trade, niche, local)
4. Results update on each change via `/api/v1/pr/journalists` API

**Journalist Results:**
- Grid/list view with checkbox selection
- Each card displays:
  - Full name (bold)
  - Freelancer badge (if `is_freelancer`)
  - Outlet name and tier (e.g., "TechCrunch • trade")
  - Location (e.g., "San Francisco, CA")
  - Beats as colored pills (e.g., "Technology", "Startups")
  - Email address
  - Checkbox for selection
- Pagination controls (future: infinite scroll)

**Selection State:**
- User clicks checkboxes to select journalists
- Selection count displayed
- "Add to List" button appears when:
  - A list is selected in the right panel, AND
  - At least one journalist is selected

**Add to List Action:**
1. User selects target list from Lists panel
2. User selects one or more journalists via checkboxes
3. User clicks "Add to List" button
4. POST request to `/api/v1/pr/lists/:listId/members`
5. Success: Selection clears, list members refresh
6. Error: Toast notification

### List Management Workflow

**Lists Panel:**
- "Create List" button at top
- Scrollable list of all PR lists
- Click list to select and view members

**Create List:**
1. User clicks "Create List" button
2. Modal opens with:
   - Name input (required)
   - Description textarea (optional)
   - Cancel / Create buttons
3. User submits form
4. POST request to `/api/v1/pr/lists`
5. Success: Modal closes, list appears in panel
6. Error: Toast notification

**View List Members:**
1. User clicks a list in the panel
2. List becomes "selected" (highlighted)
3. Members load via `/api/v1/pr/lists/:listId`
4. Members display below list (same card format as search results)
5. Each member shows "Remove" button

**Remove from List:**
1. User clicks "Remove" button on a member
2. DELETE request to `/api/v1/pr/lists/:listId/members` with `{ journalistIds: [id] }`
3. Success: Member disappears from list, count updates
4. Error: Toast notification

**Empty States:**
- Search: "No journalists found. Try adjusting your filters."
- Lists: "No lists yet. Create your first list to get started."
- List Members: "This list is empty. Search for journalists and add them to this list."

---

## Future Extensions

### 1. Global Media Database

**Vision:** Shared database of verified journalists and outlets across all orgs.

**Implementation:**
- New tables: `global_journalists`, `global_media_outlets`
- Curated by Pravado team or trusted data providers
- Orgs can "import" global records to their org-scoped data
- Periodic updates from sources like Cision, Muck Rack, Meltwater
- User contributions with moderation queue

**Benefits:**
- Reduces manual data entry
- Ensures data quality and freshness
- Pre-populated beats and outlet classifications

### 2. Journalist Quality Scoring

**Metrics:**
- Responsiveness: % of pitches that receive a response
- Engagement: Opens, clicks, replies to PR emails
- Authority: Domain authority of primary outlet
- Reach: Social media followers, outlet circulation
- Relevance: Topic alignment via embedding similarity

**Implementation:**
- New table: `journalist_quality_scores`
- Fields: `responsiveness_score`, `engagement_score`, `authority_score`, `reach_estimate`, `relevance_score`
- Composite `quality_score` (0-100)
- Update scores periodically via background job
- Display in search results and list views

**UI Changes:**
- Sort by quality score
- Filter by minimum quality threshold
- Badge for "VIP" or "Highly Responsive" journalists

### 3. Pitch History & Engagement Tracking

**Entities:**
- `pr_pitches`: Campaigns sent to journalists
- `pr_pitch_recipients`: Many-to-many (pitch → journalist)
- `pr_engagements`: Email opens, clicks, replies, article placements

**Workflow:**
1. User creates pitch campaign (subject, body, attachments)
2. User selects target list(s)
3. System sends personalized emails via SendGrid/Postmark
4. Tracks opens, clicks, replies
5. User marks placements (article published)
6. Updates journalist engagement scores

**Analytics:**
- Campaign performance dashboard
- Journalist engagement heatmap
- Best-performing subject lines
- Optimal send times

### 4. Guardrails for Non-Spammy Outreach

**Rate Limiting:**
- Max pitches per journalist per month (e.g., 3)
- Cooldown period after non-response (e.g., 30 days)
- Prevent bulk pitching to entire database

**Quality Gates:**
- Require personalization tokens (first name, recent article)
- Minimum word count for pitch body
- Relevance check: journalist beat must match pitch topic

**Opt-Out Management:**
- Journalist can click "unsubscribe" in pitch email
- Org-level suppression list
- Compliance with CAN-SPAM, GDPR

**Ethical Scoring:**
- Penalize orgs with high unsubscribe rates
- Reward orgs with high placement rates
- Display "spam score" to discourage bad behavior

**UI Indicators:**
- Warning if journalist was recently pitched
- Badge for "Opted Out" journalists
- Suggested waiting period before re-pitching

---

## Migrations Reference

### Migration 18: Extend Journalists & Media Outlets

**File:** `apps/api/supabase/migrations/18_extend_journalists_and_media_outlets.sql`

**Changes:**
- Added 10 new columns to `journalists` table
- Added 5 new columns to `media_outlets` table
- Created indexes for performance

**Safe Column Addition Pattern:**
```sql
DO $ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='journalists' AND column_name='first_name'
  ) THEN
    ALTER TABLE public.journalists ADD COLUMN first_name TEXT;
  END IF;
END $;
```

### Migration 19: PR Beats & Mappings

**File:** `apps/api/supabase/migrations/19_create_pr_beats_and_mappings.sql`

**Tables Created:**
- `pr_beats`
- `journalist_beats`

**RLS Policies:** Full CRUD for both tables with org-level isolation

**Org Consistency Constraint:**
```sql
CONSTRAINT fk_journalist_beats_org_consistency CHECK (
  org_id = (SELECT org_id FROM public.journalists WHERE id = journalist_id)
)
```

### Migration 20: PR Lists

**File:** `apps/api/supabase/migrations/20_create_pr_lists.sql`

**Tables Created:**
- `pr_lists`
- `pr_list_members`

**RLS Policies:** Full CRUD with org-level isolation

**Unique Constraint:**
```sql
UNIQUE(list_id, journalist_id)
```

---

## Type System

### Core Types

Location: `packages/types/src/pillars.ts`

**Entities:**
- `Journalist`: Journalist record with all fields
- `MediaOutlet`: Media outlet record
- `PRBeat`: Beat/coverage area
- `JournalistBeat`: Journalist-beat mapping
- `PRList`: PR list
- `PRListMember`: List membership

**DTOs:**
- `JournalistWithContext`: Journalist + outlet + beats + topics
- `PRListWithMembers`: List + members + count

**API Responses:**
- `ListJournalistsWithContextResponse`
- `ListPRBeatsResponse`
- `ListPRListsResponse`
- `GetPRListResponse`
- `GetPRListWithMembersResponse`
- `CreatePRListResponse`
- `UpdatePRListMembersResponse`

### Validators

Location: `packages/validators/src/pillar.ts`

**Schemas:**
- `listJournalistsQuerySchema`: Search and filter params
- `listPRListsQuerySchema`: List pagination
- `createPRListSchema`: List creation
- `updatePRListMembersSchema`: Add/remove members

**Example:**
```typescript
export const listJournalistsQuerySchema = z.object({
  q: z.string().optional(),
  beatId: z.string().uuid().optional(),
  outletId: z.string().uuid().optional(),
  country: z.string().optional(),
  tier: z.string().optional(),
  limit: z.number().int().positive().max(100).optional().default(20),
  offset: z.number().int().nonnegative().optional().default(0),
});
```

---

## Testing Strategy

### Service Tests (Vitest)

**Location:** `apps/api/src/services/__tests__/prMediaService.test.ts` (to be created)

**Coverage:**
- `searchJournalists`: Basic search, filtering by beat/outlet/tier/country, pagination, empty results
- `listPRLists`: Fetch all lists, empty org
- `getPRListWithMembers`: Valid list, not found, empty list
- `createPRList`: Success, validation error
- `addMembersToList`: Add single/multiple, duplicate handling
- `removeMembersFromList`: Remove single/multiple, non-existent member

**Mocking:**
- Mock Supabase client with `vi.fn()`
- Return fixtures for database queries
- Test error handling and edge cases

### Dashboard Tests (Playwright)

**Location:** `apps/dashboard/e2e/pr.spec.ts` (to be created)

**Coverage:**
- Media Explorer renders with search and filters
- Search input triggers API call with debounce
- Filter dropdowns update results
- Journalist cards display all fields correctly
- Checkbox selection works
- Lists panel renders
- Create list modal opens/submits
- Add to list button appears when conditions met
- Remove from list works
- Empty states display correctly

**Mocking:**
- Mock API responses with MSW (Mock Service Worker)
- Test loading states, error states, empty states

---

## Acceptance Criteria (Sprint S6)

- [x] **Migrations:** All 3 migrations apply cleanly with RLS enabled
- [x] **Services:** `prMediaService.ts` implements journalist search & list operations
- [x] **API:** 6 endpoints return structured, typed data
- [x] **Dashboard:** `/app/pr` supports searching/filtering journalists and list management
- [ ] **Tests:** Vitest tests for prMediaService, Playwright tests for dashboard
- [ ] **Build:** `pnpm lint`, `typecheck`, `test`, `build` all succeed
- [x] **Documentation:** This file (`pr_intelligence_foundation.md`)

---

## Summary

Sprint S6 establishes the foundational media graph for PR Intelligence:

1. **Database:** Extended journalists/outlets, added beats/mappings, added lists/members
2. **Service Layer:** `PRMediaService` with search, list CRUD, membership operations
3. **API Layer:** 6 RESTful endpoints with validation and error handling
4. **Dashboard:** Media Explorer UI with search, filters, selection, list management
5. **Multi-Tenancy:** Full org-level isolation with RLS and service-level enforcement

**Next Steps:**
- Sprint S7: Pitch tracking and engagement analytics
- Sprint S8: Global media database integration
- Sprint S9: Quality scoring and anti-spam guardrails
