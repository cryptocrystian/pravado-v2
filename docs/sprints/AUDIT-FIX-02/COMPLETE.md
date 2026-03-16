# AUDIT-FIX-02 — Complete

**Date**: 2026-03-15
**Scope**: Final surface audit fix sprint — demo data removal, API wiring, empty states

---

## CRITICAL — CAL-01/02: Calendar hardcoded date + API route

**Files changed**:
- `apps/dashboard/src/components/calendar/OrchestrationCalendarShell.tsx`
- Created: `apps/dashboard/src/app/api/calendar/events/route.ts`

**Changes**:
- Replaced hardcoded `STABLE_TODAY = '2026-02-20'` with `todayISO()` function using `new Date()`
- Calendar now shows the real current date
- Added `useEffect` fetch from `/api/calendar/events` for real event data
- Shows empty state when no events: "No scheduled actions yet. SAGE will populate your calendar as it generates proposals."
- Removed dependency on `MOCK_CALENDAR_ITEMS`
- Created `/api/calendar/events` stub route returning empty events array

## HIGH — PR-04: Missing PR API routes

**Files created**:
- `apps/dashboard/src/app/api/pr/action-queue/route.ts`
- `apps/dashboard/src/app/api/pr/pitches/summary/route.ts`

**Changes**:
- `/api/pr/action-queue` returns `{ success: true, items: [], total: 0 }`
- `/api/pr/pitches/summary` returns pipeline counts (all zeros)
- Both are stub routes ready to proxy to Fastify when backend routes are built

## MEDIUM — Demo data removal

### Command Center — CiteMind Feed (CC-04)
**File**: `apps/dashboard/src/components/command-center/IntelligenceCanvasPane.tsx`
- Removed `MOCK_CITATIONS` constant (6 hardcoded entries about "Pravado leads with its SAGE orchestration layer")
- CiteMind feed now uses only `useCitationResults()` API hook
- Empty state: "No AI citations detected yet. Citation monitoring runs every 6 hours."

### PR Surface — EVI + Pitch Queue + Pipeline (PR-01/02/03)
**Files**: `apps/dashboard/src/components/pr/PRChromeBar.tsx`, `apps/dashboard/src/app/app/pr/page.tsx`
- PRChromeBar: Replaced hardcoded EVI 42.1 (+3.2) with fetched data from `/api/command-center/strategy-panel`
- Removed `SAGE_PITCH_RECS` (Elena Rodriguez, Tom Whitfield, Ana Vasquez)
- Copilot view: Fetches from `/api/pr/action-queue`; empty state for pitch queue, EVI attribution, top targets
- Pipeline: Fetches from `/api/pr/pitches/summary`; shows real counts (0s when empty)
- Removed `AUTOPILOT_EXCEPTIONS` and `ACTIVITY_LOG` hardcoded data
- Autopilot: Shows empty states for exceptions and activity log

### Content Surface — SAGE queue + metrics (CON-02)
**Files**: `apps/dashboard/src/components/content/content-mock-data.ts`, `apps/dashboard/src/components/content/views/ContentOverviewView.tsx`, `apps/dashboard/src/app/app/content/page.tsx`
- Zeroed out `CONTENT_OVERVIEW_MOCK`: all scores 0, empty arrays, null top asset
- Emptied `MANUAL_QUEUE_MOCK`, `AUTOPILOT_EXCEPTIONS_MOCK`, `AUTOPILOT_ACTIVITY_MOCK`
- AutopilotStatusBar shows "IDLE" / "No items supervised" instead of hardcoded "12 items"
- Added empty state messages throughout

### SEO Surface — all data (SEO-01)
**Files**: `apps/dashboard/src/components/seo/SEOChromeBar.tsx`, `apps/dashboard/src/components/seo/SEOCopilotView.tsx`, `apps/dashboard/src/components/seo/mock-data.ts`
- SEOChromeBar: Replaced hardcoded EVI 74.0 (+4.2) with fetched data
- Share of Model section: Shows GSC connection prompt when not connected
- Layer health cards (SEH/AEO/SoM): Show "--" instead of hardcoded 78/54/18
- Removed CompetitorA-D from SEOCopilotView rendered output
- Replaced "CompetitorX" references with generic "A competitor" in mock data and content creation

### Calendar Surface — EVI
**File**: `apps/dashboard/src/components/calendar/CalendarChromeBar.tsx`
- Replaced hardcoded EVI 72.4 (+1.8) with fetched data from strategy panel

### Analytics Surface — stat cards + Top Wins (ANA-01)
**Files**: `apps/dashboard/src/components/analytics/HeadlineMetrics.tsx`, `AttributionBar.tsx`, `TopWins.tsx`
- HeadlineMetrics: Fetches real data from `/api/evi/current`, `/api/content/items`, `/api/citemind/monitor/summary`; falls back to 0 on error
- AttributionBar: Shows empty state message instead of hardcoded 58%/31%/11% bars
- TopWins: Shows empty state instead of hardcoded win items; fixed DS v3.1 token violations

## MEDIUM — SET-01: Billing settings page

**File created**: `apps/dashboard/src/app/app/settings/billing/page.tsx`

- Shows current subscription with plan name, status, renewal date when active
- Shows usage summary (SAGE proposals, CiteMind scores) with progress bars
- When no subscription: shows 3-plan pricing grid (Starter $99, Pro $299, Growth $799)
- Integrates with `/api/billing/subscription`, `/api/billing/usage`, `/api/billing/checkout`, `/api/billing/portal`

## LOW — SET-02: Settings sub-route 404s

**File**: `apps/dashboard/next.config.js`

- Added `redirects()` function with two rules:
  - `/app/settings/integrations` → `/app/settings`
  - `/app/settings/notifications` → `/app/settings`

---

## Exit Criteria Verification

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Calendar shows today's real date, empty state for no events | Done — `todayISO()` replaces 2026-02-20 |
| 2 | `/api/calendar/events` returns 200 | Done — stub returns empty array |
| 3 | `/api/pr/action-queue` + `/api/pr/pitches` return 200 | Done — stubs created |
| 4 | PR surface EVI header shows real EVI score | Done — fetches from strategy-panel API |
| 5 | Zero hardcoded competitor names in main surfaces | Done — removed from SEO/Content views |
| 6 | Zero hardcoded journalist names in main surfaces | Done — removed from PR page |
| 7 | Zero hardcoded EVI values contradicting real EVI | Done — all chrome bars fetch real EVI |
| 8 | CiteMind Feed wired to real API endpoint | Done — mock fallback removed |
| 9 | Billing settings page at /app/settings/billing | Done — created with plan/usage display |
| 10 | /settings/integrations + /notifications redirect | Done — next.config.js redirects |
| 11 | Zero TypeScript errors | Verified — dashboard + API pass tsc |
| 12 | Sprint summary written | This file |

### Residual mock data (out of scope)
- `pr-mock-data.ts`: Contains journalist names but is no longer imported by the PR page
- `calendar/mock-data.ts`: Contains 2026-02-20 dates but is no longer imported by the shell
- `seo/mock-data.ts`, `seo-mock-data.ts`: Contains CompetitorA-D in SAGE proposal mock arrays — these are backend seed data, not rendered on main surfaces
- Competitive Intelligence and Brand Reputation surfaces have their own CompetitorA-D references — separate surfaces, not in this sprint's scope
