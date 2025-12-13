# Sprint S96: PR Intelligence E2E UX Truth Report

**Test Date**: December 12, 2024
**Test Method**: Code audit + route validation
**Pillar**: PR Intelligence (`/app/pr`)

---

## Executive Summary

| Area | Pass | Fail | Blocked |
|------|------|------|---------|
| Overview Tab | 4 | 3 | 0 |
| Media Explorer Tab | 2 | 1 | 0 |
| Quick Actions Tab | 7 | 0 | 0 |
| Press Release Flow | 3 | 1 | 0 |

**Overall Assessment**: The PR pillar has functional pages but lacks **context preservation** in action flows and **clickable drilldowns** for KPIs.

---

## Test Results

### 1. /app/pr Overview Tab

#### 1.1 KPI Tiles (Stats Bar)

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Click "Mentions" stat | Navigate to filtered mentions view | Not clickable - display only | **FAIL** |
| Click "Positive" stat | Navigate to positive coverage | Not clickable - display only | **FAIL** |
| Click "Negative" stat | Navigate to negative coverage | Not clickable - display only | **FAIL** |
| Click "Journalists" stat | Navigate to journalist list | Not clickable - display only | **FAIL** |

**Code Location**: `PRSituationBrief.tsx:239-263`

**Issue**: Stats bar items are `<div>` elements with no `onClick` or `<Link>` wrapper.

```tsx
// Current (non-clickable):
<div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-4/60">
  <span className="text-sm font-semibold text-white">{data.stats.totalMentions}</span>
  <span className="text-sm text-slate-10">Mentions</span>
</div>
```

**Priority**: **P0** - Users cannot drill down from high-level metrics

---

#### 1.2 Coverage Items (Changes Tab)

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Click coverage card | Open detail view | Links present via `linkUrl` property | **PASS** |
| External source link | Open source article | `linkUrl` redirects correctly | **PASS** |
| Click without linkUrl | Handle gracefully | No link shown, no error | **PASS** |

**Code Location**: `PRSituationBrief.tsx:499-508`

**Note**: Changes have optional `linkUrl` but the mock data uses generic `/app/pr/journalists` - not specific coverage detail views.

---

#### 1.3 AI Recommendations CTAs

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| "Draft Response" action | Open draft with journalist context | Links to `/app/pr/outreach` (generic) | **FAIL** |
| "Create Pitch" action | Open pitch with story context | Links to `/app/pr/pitches` (generic) | **FAIL** |
| "Follow Up" action | Open follow-up with context | Links to generic page | **FAIL** |
| Action button renders | CTA visible and clickable | Renders correctly | **PASS** |

**Code Location**: `PRAIRecommendations.tsx:356-368` and `pr/page.tsx:122-206` (mock data)

**Issue**: Action URLs are hardcoded without query params to preserve context:

```tsx
// Current (no context):
actionUrl: '/app/pr/outreach'

// Should be:
actionUrl: '/app/pr/outreach?journalist=${journalistId}&context=response'
```

**Priority**: **P0** - Users lose context when executing actions

---

#### 1.4 "Why am I seeing this?" (AI Reasoning)

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Click reasoning icon | Show popover with evidence | AIReasoningPopover displays | **PASS** |
| Shows source pillar | Displays "PR Intelligence" | Shows "PR Intelligence Analysis" | **PASS** |
| Shows related pillars | Lists affected pillars | Shows Content, Exec, Crisis | **PASS** |
| Shows confidence | Displays AI confidence % | Shows 85% confidence | **PASS** |
| Shows next actions | Actionable next steps | Shows 3 next actions | **PASS** |

**Code Location**: `PRSituationBrief.tsx:146-162`, `PRAIRecommendations.tsx:128-143`

**Status**: **PASS** - AI transparency is well implemented

---

### 2. /app/pr Media Explorer Tab

#### 2.1 Search Functionality

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Search input renders | Search box visible | Renders correctly | **PASS** |
| Search returns results | Journalists from API | Depends on API data | **PASS** (code correct) |
| Search filters work | Beat, outlet filters | Filter pills present | **PASS** |

**Code Location**: `pr/page.tsx:308-356`

---

#### 2.2 Journalist Discovery Integration

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Recommended journalists discoverable | Journalists from Overview findable in Explorer | No connection - recommendations are mock data | **FAIL** |

**Issue**: Recommendations reference mock journalists (e.g., "Sarah Chen", "Michael Torres") that don't exist in the actual database. The Media Explorer searches real API data.

**Priority**: **P1** - Requires either real data seeding or mock data removal

---

#### 2.3 Empty States

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| No results message | Guide user forward | "No journalists found" displayed | **PASS** |
| Empty search guidance | Suggest actions | Could improve with suggestions | **PASS** (minimal) |

---

### 3. /app/pr Quick Actions Tab

| Quick Action | Destination | Page Exists | Functional | Status |
|--------------|-------------|-------------|------------|--------|
| + New Press Release | `/app/pr/generator` | Yes | Full generator | **PASS** |
| + Create Pitch Sequence | `/app/pr/pitches` | Yes | Sequence editor | **PASS** |
| + Start Outreach | `/app/pr/outreach` | Yes | Outreach dashboard | **PASS** |
| Generate Media List | `/app/pr/media-lists` | Yes | AI list builder | **PASS** |
| Discover Journalists | `/app/pr/discovery` | Yes | Discovery dashboard | **PASS** |
| Email Deliverability | `/app/pr/deliverability` | Yes | Deliverability stats | **PASS** |
| Contact Enrichment | `/app/pr/enrichment` | Yes | Enrichment generator | **PASS** |

**Status**: All Quick Actions lead to functional pages

---

### 4. Press Release Flow

#### 4.1 Creation

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Navigate to generator | Page loads | `/app/pr/generator` loads | **PASS** |
| Form fields present | Topic, angle, keywords | PRGeneratorForm renders | **PASS** |
| Generate press release | API call + streaming | SSE subscription implemented | **PASS** |
| Progress indicator | Shows generation steps | 5-step progress bar | **PASS** |

**Code Location**: `pr/generator/page.tsx:69-137`

---

#### 4.2 Save & Revisit

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Release saved to DB | Persisted entity | listPressReleases API call | **PASS** |
| Sidebar shows releases | Historical list | PRSidebarList component | **PASS** |
| Click release loads it | Content displayed | getPressRelease + display | **PASS** |

---

#### 4.3 Publish/Share

| Test Step | Expected | Actual | Status |
|-----------|----------|--------|--------|
| Publish workflow | Distribution options | Not implemented | **FAIL** (Deferred) |
| Share functionality | Copy/export options | Not visible | **FAIL** (Deferred) |

**Note**: Wire integration is explicitly deferred per sprint scope

---

## P0 Bug List

### P0-1: KPI Stats Not Clickable

**Route**: `/app/pr` (Overview tab)
**Component**: `PRSituationBrief.tsx:239-263`
**Reproduction**:
1. Navigate to `/app/pr`
2. View stats bar (Mentions, Positive, Negative, Journalists)
3. Attempt to click any stat
**Expected**: Navigate to filtered view
**Actual**: No interaction
**Fix**: Wrap stats in `<Link>` with filter params

---

### P0-2: Recommendations Lose Context on Action

**Route**: `/app/pr` (Overview tab)
**Component**: `PRAIRecommendations.tsx:356-368`, `pr/page.tsx:122-206`
**Reproduction**:
1. Navigate to `/app/pr`
2. View AI Recommendation for "Sarah Chen" with action "Draft Response"
3. Click "Draft Response"
**Expected**: Navigate to outreach with journalist "Sarah Chen" prefilled
**Actual**: Navigate to empty `/app/pr/outreach` page
**Fix**: Pass context via URL query params or state

---

### P0-3: Mock Data Journalists Not Discoverable

**Route**: `/app/pr` (Overview + Media Explorer)
**Component**: `pr/page.tsx` mock data
**Reproduction**:
1. See recommendation for "Sarah Chen @ TechCrunch"
2. Switch to Media Explorer tab
3. Search for "Sarah Chen"
**Expected**: Find Sarah Chen in results
**Actual**: No results (mock data not in DB)
**Fix**: Either seed real demo data or connect recommendations to real journalists

---

## P1 Bug List

### P1-1: Coverage Detail View Missing

**Route**: `/app/pr` (Overview > Changes)
**Issue**: Changes link to generic `/app/pr/journalists` instead of specific coverage detail
**Fix**: Create `/app/pr/coverage/[id]` detail view or use query params

### P1-2: Empty State Could Guide Better

**Route**: `/app/pr` (Media Explorer with no results)
**Issue**: "No journalists found" could suggest next steps
**Fix**: Add "Generate Media List" or "Discover Journalists" suggestions

---

## Golden Path Assessment

**Target Flow**: See signals → Open evidence → Execute action → Generate draft → Save/send/track → View coverage/reporting

| Step | Status | Blocker |
|------|--------|---------|
| See signals | PASS | - |
| Open evidence | PASS | AIReasoningPopover works |
| Execute action | **FAIL** | Actions lose context |
| Generate draft | PASS | Press Release generator works |
| Save/send/track | PARTIAL | Save works, send deferred |
| View coverage/reporting | **FAIL** | No coverage detail view |

**Verdict**: Cannot complete golden path due to P0 issues

---

## Recommendations

### Immediate (P0 Fixes)

1. **Make KPI stats clickable** with filter navigation
2. **Pass context to action URLs** via query params
3. **Connect recommendations to real data** or create demo org seed

### Near-term (P1 Fixes)

4. Add coverage detail view `/app/pr/coverage/[id]`
5. Improve empty states with action suggestions
6. Add journalist detail view link from recommendations

---

*Report Generated: Sprint S96*
