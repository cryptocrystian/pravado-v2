# PR WIRING SPRINT — CLAUDE CODE HANDOFF BRIEF
**Date:** 2026-02-26
**Sprint Goal:** Wire the PR pillar frontend to real API/database data. Replace all mock data imports with live API calls. No UI redesign — preserve existing component structure exactly.

---

## CONTEXT

The PR pillar frontend is fully built with mock data. The backend is also fully built. Nothing is connected. This sprint connects them.

**Core rule:** Touch the minimum code necessary to wire real data. Do not redesign components, do not change layouts, do not refactor what isn't broken.

---

## WHAT EXISTS (DO NOT CHANGE)

### Frontend pages (all currently use mock data):
- `apps/dashboard/src/app/app/pr/journalists/page.tsx` — imports `mockJournalists`, `mockSageJournalists`
- `apps/dashboard/src/app/app/pr/pitches/page.tsx` — imports `mockPitches`
- `apps/dashboard/src/app/app/pr/coverage/page.tsx` — imports `mockCoverage`
- `apps/dashboard/src/app/app/pr/page.tsx` — imports `mockActions`

### Backend (fully built, do not modify):
- `apps/dashboard/src/app/api/pr/journalists/route.ts` — GET/POST, hits `journalist_profiles` table
- `apps/dashboard/src/app/api/pr/journalists/[id]/route.ts` — GET/PATCH/DELETE
- `apps/dashboard/src/app/api/pr/pitches/sequences/route.ts` — GET/POST
- `apps/dashboard/src/app/api/pr/pitches/manual-send/route.ts` — POST
- `apps/dashboard/src/app/api/pr/touches/route.ts` — GET/POST
- `apps/dashboard/src/app/api/pr/inbox/route.ts` — GET
- `apps/dashboard/src/server/pr/prService.ts` — PRService class, all DB operations
- `apps/dashboard/src/server/pr/prAuth.ts` — auth helpers

### Mock data file (keep it — SAGE tab still uses it):
- `apps/dashboard/src/components/pr/pr-mock-data.ts`

---

## TYPE MISMATCH — THE CRITICAL ISSUE

The API returns `JournalistProfile` (from `prService.ts`). The UI components expect `Journalist` (from `pr-mock-data.ts`). These are different shapes. You need an adapter.

**JournalistProfile (API shape):**
```typescript
{
  id, orgId, fullName, primaryEmail, secondaryEmails,
  primaryOutlet, beat, twitterHandle, linkedinUrl,
  engagementScore, responsivenessScore, relevanceScore,
  lastActivityAt, metadata, createdAt, updatedAt
}
```

**Journalist (UI shape):**
```typescript
{
  id, name, initials, email, publication, jobTitle,
  beats: string[], aiCitation: 'high'|'medium'|'low',
  relationship: 'warm'|'neutral'|'cold'|'new',
  socialTwitter?, socialLinkedin?, verified,
  citationStats?, relationshipStats?, recentArticles?,
  activityTimeline?, notes?, sageReason?
}
```

---

## TASK 1 — Create client API + adapter

**Create file:** `apps/dashboard/src/lib/prJournalistApi.ts`

This file needs:

1. **`fetchJournalists(params?)`** — GET `/api/pr/journalists` with optional query params (q, outlet, beat, limit, offset). Returns `{ profiles, total, limit, offset }`.

2. **`createJournalist(input)`** — POST `/api/pr/journalists`. Returns `JournalistProfile`.

3. **`adaptProfileToJournalist(profile: JournalistProfile): Journalist`** — maps API shape to UI shape:
   - `name` ← `fullName`
   - `email` ← `primaryEmail`
   - `publication` ← `primaryOutlet ?? 'Unknown'`
   - `initials` ← first letter of each word in fullName, max 2
   - `beats` ← `metadata.beats as string[]` if present, else split `beat` by comma, else `[]`
   - `jobTitle` ← `metadata.jobTitle as string ?? ''`
   - `relationship` ← derived from `engagementScore`: ≥0.7='warm', ≥0.4='neutral', >0='cold', else 'new'
   - `aiCitation` ← derived from `relevanceScore`: ≥0.7='high', ≥0.4='medium', else 'low'
   - `verified` ← `metadata.verified as boolean ?? false`
   - `socialTwitter` ← `twitterHandle ?? undefined`
   - `socialLinkedin` ← `!!linkedinUrl`
   - `relationshipStats` ← if `lastActivityAt` exists: `{ lastContact: formatRelativeDate(lastActivityAt), totalInteractions: metadata.interaction_count ?? 1, coverageReceived: metadata.coverage_count ?? 0, warmthScore: Math.round(engagementScore * 100), owner: metadata.owner ?? 'You' }`
   - All other fields (citationStats, recentArticles, activityTimeline, notes, sageReason) ← `undefined`

4. **`formatRelativeDate(dateString: string): string`** — returns human-readable relative date: "X days ago", "X weeks ago", etc.

---

## TASK 2 — Wire journalists/page.tsx

**File:** `apps/dashboard/src/app/app/pr/journalists/page.tsx`

Replace the mock data import and static state with a live fetch.

**Current:**
```typescript
import { mockJournalists, mockSageJournalists } from '@/components/pr/pr-mock-data';
// ...
const [contacts, setContacts] = useState<Journalist[]>(mockJournalists);
```

**Target behavior:**
- On mount, fetch from API via `fetchJournalists()` from `prJournalistApi.ts`
- Map results through `adaptProfileToJournalist()`
- Show loading state while fetching (simple: dim the list, show a subtle spinner or skeleton — do not build a complex skeleton system)
- Show empty state if 0 results: "No contacts yet. Add your first journalist to get started."
- Show error state if fetch fails: "Could not load contacts. Please try again." with a retry button
- SAGE tab (`activeTab === 'sage'`) stays on `mockSageJournalists` — do not wire this tab
- Search (the `search` state) should filter client-side against already-fetched data for instant feel. Do NOT add server-side search on every keystroke — fetch once on mount, filter in memory.
- The `+Add` button should still work (keep the existing handler or stub it — do not build the form in this sprint)
- `selectedId` default: if API returns results, default to first result's id. If empty, null.

**State shape needed:**
```typescript
const [contacts, setContacts] = useState<Journalist[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

---

## TASK 3 — Wire pitches/page.tsx

**File:** `apps/dashboard/src/app/app/pr/pitches/page.tsx`

First read this file to understand its current structure.

Replace mock pitch data with live sequence data from `/api/pr/pitches/sequences`.

The API returns `PitchSequence[]` with shape:
```typescript
{ id, orgId, userId, name, status, defaultSubject, defaultPreviewText, settings, createdAt, updatedAt }
```

The UI `PitchItem` shape is:
```typescript
{ id, title, journalistName, publication, priority, aeoTarget, created, stage, beats? }
```

**Adapter `adaptSequenceToPitchItem(seq: PitchSequence): PitchItem`:**
- `title` ← `name`
- `journalistName` ← `metadata.journalistName ?? 'Unassigned'`
- `publication` ← `metadata.publication ?? '—'`
- `priority` ← `metadata.priority ?? 'medium'`
- `aeoTarget` ← `metadata.aeoTarget ?? 'Est. impact TBD'`
- `created` ← format `createdAt` as "Mon DD" (e.g. "Feb 18")
- `stage` ← map sequence `status` to `PitchStage`: `'draft'→'drafts'`, `'active'→'awaiting_send'`, `'sent'→'sent'`, `'completed'|'paused'|'archived'→'closed'`
- `beats` ← `metadata.beats as string[] ?? []`

Same loading/error/empty state pattern as Task 2.

---

## TASK 4 — Wire coverage/page.tsx

**File:** `apps/dashboard/src/app/app/pr/coverage/page.tsx`

First read this file to understand its current structure.

Coverage data lives in the `earned_mentions` table. There is likely no existing `/api/pr/coverage` route. Check first — if it doesn't exist, create it.

**If route doesn't exist, create:** `apps/dashboard/src/app/api/pr/coverage/route.ts`

Use the same auth pattern as the journalists route (`authenticatePRRequest`, `createPRService` pattern). Query:
```typescript
this.client
  .from('earned_mentions')
  .select('*')
  .eq('org_id', this.orgId)
  .order('published_at', { ascending: false })
  .limit(50)
```

Add a `listCoverage()` method to `PRService` if needed following the existing pattern.

Map `earned_mentions` columns to `CoverageRow` UI type:
- `id` ← `id`
- `headline` ← `headline ?? title ?? 'Untitled'`
- `publication` ← `outlet_name ?? source_domain ?? 'Unknown'`
- `reporter` ← `author_name ?? 'Unknown'`
- `date` ← format `published_at` as "Mon DD"
- `reach` ← `metadata.reach ?? estimated_reach ?? '—'`
- `sentiment` ← `sentiment ?? 'neutral'`
- `eviImpact` ← `metadata.evi_impact ?? 'Pending'`
- `isPending` ← `!metadata.evi_impact`

Same loading/error/empty state pattern.

---

## TASK 5 — Wire PR dashboard action queue (page.tsx)

**File:** `apps/dashboard/src/app/app/pr/page.tsx`

Replace `mockActions` with live inbox items from `/api/pr/inbox`.

The inbox API returns items shaped as `InboxItem[]` (defined in `prService.ts`). The UI expects `PRActionItem[]`.

**Adapter `adaptInboxToPRAction(item: InboxItem): PRActionItem`:**
- `id` ← `id`
- `priority` ← `priority`
- `iconName` ← map `type`: `'inquiry'→'EnvelopeOpen'`, `'follow_up_due'→'Bell'`, `'coverage_triage'→'Newspaper'`, `'relationship_decay'→'ChartBar'`, `'approval_queue'→'FileText'`, `'data_hygiene'→'Lightning'`
- `title` ← `title`
- `description` ← `description`
- `primaryCta` ← `primaryAction.label`
- `secondaryCta` ← `'Dismiss'`
- `dismissible` ← `true`
- `journalistId` ← `relatedContactId ?? undefined`

If inbox returns 0 items (new org, no data), show the existing mock actions as a "sample" — this keeps the demo useful. Add a subtle `// using sample data` indicator in dev mode only.

---

## TASK 6 — Verify and clean up

1. Run `pnpm build` from the monorepo root. Fix any TypeScript errors.
2. Run `pnpm lint` and fix any lint errors.
3. Do NOT delete `pr-mock-data.ts` — it is still used by the SAGE tab and pitch wizard components.
4. Confirm: none of the existing PR component files (JournalistListItem, JournalistProfile, SageJournalistCard, etc.) were modified. If you had to modify any, document why.

---

## ERROR HANDLING PATTERN (use consistently across all tasks)

```typescript
useEffect(() => {
  let cancelled = false;

  async function load() {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchXxx();
      if (!cancelled) {
        setItems(data.items.map(adaptXxxToYyy));
      }
    } catch (err) {
      if (!cancelled) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  }

  load();
  return () => { cancelled = true; };
}, []);
```

---

## DO NOT DO ANY OF THE FOLLOWING

- Do not redesign any UI component
- Do not change any CSS classes or layout
- Do not add new dependencies
- Do not add server-side search/filter — client-side filtering only for this sprint
- Do not build the Add Journalist form — stub the button
- Do not wire the SAGE suggested journalists tab — keep on mock data
- Do not add pagination UI — fetch first 50, that is sufficient for V1
- Do not modify `prService.ts` or `prAuth.ts` unless adding a new method for coverage
- Do not add any new pages or routes beyond the coverage route if it's missing

---

## DEFINITION OF DONE

- [ ] Journalists page loads real contacts from DB (or shows empty state)
- [ ] Journalist search filters against real data
- [ ] Pitches page loads real sequences from DB (or shows empty state)
- [ ] Coverage page loads real earned_mentions from DB (or shows empty state)
- [ ] PR dashboard action queue loads real inbox items (or falls back to sample data)
- [ ] `pnpm build` passes with no errors
- [ ] `pnpm lint` passes with no errors
- [ ] No mock data imports remain in page.tsx files (except SAGE tab in journalists page)
- [ ] `pr-mock-data.ts` file still exists and is unchanged
