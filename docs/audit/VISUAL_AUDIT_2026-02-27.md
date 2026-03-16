# PRAVADO v2 — VISUAL AUDIT
**Date:** 2026-02-27
**Method:** Live browser screenshots + session history synthesis
**Status:** PARTIAL — Command Center confirmed visually. All other surfaces documented from code/history. Full browser re-verification needed when extension reconnects.

---

## AUDIT APPROACH

Screenshots were captured at session start (Command Center confirmed). Browser extension disconnected mid-audit. Remaining surfaces documented from:
- ARCHITECT_BRIEFING.md (last updated 2026-02-21)
- DECISIONS_LOG.md entries D001–D021
- Journal entries 2026-02-23 through 2026-02-27
- Code inspection of component files

---

## 0. WHAT HAS CHANGED SINCE GA (Feb 20–21)

These major changes happened in post-GA sprints and are critical context for the audit:

| Sprint | Date | Changes |
|--------|------|---------|
| Entity Map v3 (Sprints 9–9k) | Feb 25–26 | Full rebuild — concentric rings (Owned/Earned/Perceived) replacing SAGE zones. Dead space issue identified but open. |
| DS Typography Overhaul (D018) | Feb 24 | Surface titles now `text-2xl` (24px). Full 9-level hierarchy. All 70+ files updated. |
| DS Layout Laws (D019) | Feb 24 | Four laws: width earned, whitespace semantic, cards are decisions, data shape determines layout. |
| Topbar Redesign (D020) | Feb 24 | h-16 (64px), bg-slate-1/95, wordmark text-xl. Redesigned with Omni-Tray proximity logic. |
| Border Radius (D021) | Feb 24 | Default rounded-md (8px). Large panels 12px. Modals 16px. |
| Omni-Tray | Feb 24–25 | Edge-triggered AI command bar, bottom horizontal layout. Side tray for context. |
| PR Backend Wiring | Feb 27 | All 4 PR pages connected to live Supabase (journalists, pitches, coverage, action queue). |

---

## 1. COMMAND CENTER — `/app/command-center`

**Visual Status: ✅ CONFIRMED BY SCREENSHOT (today)**

### What Was Seen
- Entity Map v3 rendering: concentric ring structure with Pravado at center
- Three-tab toggle working: `Entity Map | Orchestration V2 | Synergy Flow V2`
- Action Stream: Active 6 / History tabs; items with mode badges (MANUAL, COPILOT)
- SAGE Daily Brief rendering correctly in left pane
- CiteMind Feed rendering in lower center
- Strategy Panel: EVI 67.4, Competitive band, drivers (Visibility 72.5, Authority 64.8, Momentum 61.2), Top Movers
- Status indicators in topbar: AI ACTIVE, Media Monitoring, Content Quality
- Navigation: all 6 surfaces present (Command Center, PR, Content, SEO, Calendar, Analytics)
- Ask Pravado bar visible at bottom

### Issues Observed

**1. Entity Map dead space** *(known open issue)*
The canvas has visible dead space on the left and right sides. The map renders in a narrower center band, leaving the flanks empty. Discussed in Sprint 9k — the square canvas fix vs. landscape viewport tension was unresolved. Node arrangement: Perplexity/Sarah Chen/Bing Copilot/AEO Strategy/ChatGPT/Forbes/TechCrunch/Entity SEO/Citation Intelligence/Claude/Marcus Webb/Gemini are visible but not edge-to-edge. **Needs resolution: expand to fill canvas or accept centered arrangement with explicit frame.**

**2. No per-pillar ModeSwitcher anywhere in topbar or surface header**
The three-mode toggle (Manual / Copilot / Autopilot) per pillar is absent from the visible UI. Mode IS shown on individual action cards (MANUAL badge, COPILOT badge) but there is no surface-level mode control. Per `MODE_UX_ARCHITECTURE.md`, a ModeSwitcher must be present in every work surface header. The ImpactStrip was built (Sprint 1) and wired to CC — this needs verification whether it was removed or is simply not rendering at the current route.

**3. Three-mode differentiation**
The Command Center does not yet render three distinct UI environments by mode. The Action Stream, Intelligence Canvas, and Strategy Panel show the same layout regardless of mode. This is the single biggest product experience gap across the entire product.

---

## 2. PR WORK SURFACE — `/app/pr`

**Visual Status: ⚠️ NOT CONFIRMED BY SCREENSHOT THIS SESSION**
*Documented from ARCHITECT_BRIEFING + code + Feb 23 journal*

### What Should Be There (V1 Frozen + DS Compliant + Wired)
- PRWorkSurfaceShell with ImpactStrip + mode-aware tabs
- PR Inbox (3-panel triage) — **now wired to live `/api/pr/inbox`**
- PR Database (journalist list) — **now wired to live `/api/pr/journalists`**
- PR Pitches — **now wired to live `/api/pr/pitches/sequences`**
- PR Coverage — **now wired to live `/api/pr/coverage`**
- Pitch Composer, Contact Relationship Ledger, Distribution Decision Matrix
- Three-mode architecture in PRInbox (manual=workbench, copilot=plan-review, autopilot=exception-console)

### Known Issues from Feb 23 Visual Audit Session (journal entry)
The Feb 23 session identified UI/UX regressions across surfaces — generic AI aesthetics, color overuse, missing features. Specific PR findings from that session are not detailed in the journal summary but the session identified "design quality issues" that prompted the full DS typography and layout overhaul in the Feb 24 sprints.

### Gaps
- Personalization gate (< 40% score confirmation modal) — **still outstanding per D005**
- ModeSwitcher present per ImpactStrip but surface-level mode rendering difference needs verification
- Data: journalists/pitches/coverage now live; SAGE tab still on mock per PR_WIRING_SPRINT_BRIEF

### Needs Live Verification
- [ ] Does the surface render cleanly with real data (empty states for new org)
- [ ] Are mode badges rendering on action items
- [ ] Does three-panel inbox layout hold up
- [ ] Typography hierarchy: surface title at 24px, correct proportions

---

## 3. CONTENT WORK SURFACE — `/app/content`

**Visual Status: ⚠️ NOT CONFIRMED BY SCREENSHOT THIS SESSION**
*This is the surface you flagged as needing complete redo*

### What Was Built (V1 Frozen + UI Sprint 2 TipTap rebuild)
- ContentWorkSurfaceShell with ImpactStrip + mode-aware tabs
- **Manual mode:** Document-first editing experience (not action-queue). PravadoEditor (TipTap), DocumentRail (left), ContextRailEditor (right)
- **Copilot mode:** 3-pane triage view
- **Autopilot mode:** Exception queue + all-clear state
- ContentLibraryView, ContentCalendarView, ContentInsightsView
- CiteMindPublishGate (AEO < 41 blocks publish with bypass)
- Brief Editor at `/content/brief/[id]`

### Reason You Called for Redo
From conversation context: "conflicting canon resulted in bad execution." The execution issue preceded the DS overhaul and layout law canonization (both Feb 24). Whether the UI Sprint 2 TipTap rebuild + the Feb 24 typography and layout sprint fixes are sufficient, or whether the surface still reads as generic/wrong, is unknown without a live visual.

### Specific Questions to Verify
- [ ] Does Manual mode render as document-first (PravadoEditor) or does it still look like an action queue?
- [ ] Is the TipTap editor styled correctly — not generic, actually premium?
- [ ] Does the three-mode architecture feel meaningfully different between modes?
- [ ] Does the surface title ("Content Hub" or equivalent) render at 24px as per D018?
- [ ] Do the iris accent colors feel intentional or arbitrary?
- [ ] Does the right rail (ContextRailEditor) feel like a CiteMind/authority panel or clutter?
- [ ] Library view — cards or spreadsheet? Per D019 layout laws, should be decisions, not data containers.
- [ ] Calendar view — does it integrate correctly with the Orchestration Calendar or feel disconnected?

### All Data Still Mock
Content APIs are zero-wired. All data is mock/stubbed. This affects realism of the visual but not structural assessment.

---

## 4. SEO/AEO WORK SURFACE — `/app/seo`

**Visual Status: ⚠️ NOT CONFIRMED BY SCREENSHOT THIS SESSION**
*Documented from ARCHITECT_BRIEFING + Feb 24 DS sprint*

### What Was Built (V1 Frozen)
- SEOWorkSurfaceShell with brand-cyan pillar, ImpactStrip
- **Manual mode:** 4 tabs (Overview, AEO, Technical, Intelligence)
  - Overview: Share of Model hero + 3-layer health + action queue with AEO Bridge callouts
  - AEO: Asset table with AEO scores, schema/entity status, citation badges
  - Technical: Finding cards sorted by severity, AEO Bridge impact callouts
  - Intelligence: Competitor SoM chart + citation activity feed + topic clusters
- **Copilot mode:** 4 tabs, SAGE proposals + approve/reject
- **Autopilot mode:** 2 tabs (Overview, Exceptions) — exception queue + execution log
- DS v3.1 compliant post-sprint

### Specific Questions to Verify
- [ ] Does the Share of Model visualization feel premium or like a generic chart?
- [ ] Does the AEO Score system (Entity Clarity/Schema Coverage/Semantic Depth/Authority Signal) render clearly?
- [ ] Does the three-mode differentiation actually feel like three different products?
- [ ] Layer health (Layer 1/2/3) — is it clear what each layer means?
- [ ] Typography hierarchy post-D018 — does it read with authority?

### Data
Keywords/SERP tabs have real API calls. On-Page and Backlinks are stubs (no routes exist).

---

## 5. ORCHESTRATION CALENDAR — `/app/calendar`

**Visual Status: ⚠️ NOT CONFIRMED BY SCREENSHOT THIS SESSION**

### What Was Built (V1 Frozen)
- OrchestrationCalendarShell with ImpactStrip + Day/Week/Month toggle
- WeekView: 7-day strip + agenda, pillar-colored dots
- DayView: Hourly time bands (Early Morning/Morning/Midday/Afternoon/Evening)
- MonthView: 55% grid / 45% agenda split
- CalendarActionModal: click → centered overlay (never drawer, never navigate)
- 18 mock items covering all 3 pillars × 6 statuses × 3 modes × 3 risk levels
- All DS v3.1 compliant

### Specific Questions to Verify
- [ ] Does Week view render cleanly? Is it the obvious default?
- [ ] Are pillar-colored dots visible on the day cells?
- [ ] Does the CalendarActionModal feel like a proper decision overlay?
- [ ] Is the surface title at 24px — does it look authoritative?
- [ ] Does the ImpactStrip make sense here (calendar is mode-agnostic per contract)?

---

## 6. ANALYTICS — `/app/analytics`

**Visual Status: ⚠️ NOT CONFIRMED BY SCREENSHOT THIS SESSION**

### What Was Built (V1 Frozen)
Single scrollable dashboard with 6 sections:
1. EVI Scorecard (large score, 30d delta, sparkline, status label)
2. Driver Breakdown (3 equal cards: Visibility 40%, Authority 35%, Momentum 25%)
3. EVI Over Time (SVG line chart, 30d/90d/12m toggle, band zones)
4. Share of Model Trend (horizontal bars, You vs competitor per topic cluster)
5. Coverage Timeline (event markers + EVI correlation chart)
6. Top Movers (5 items, pillar badges, signed deltas)

No ModeSwitcher, no ImpactStrip, no pillar accent (observational surface).
All data mock (366-day EVI series, 4 SoM clusters, 6 coverage events, 5 movers).

### Specific Questions to Verify
- [ ] Does the EVI Scorecard hero feel impactful — large number, correct band color?
- [ ] Do the SVG charts render correctly — no blank/broken chart areas?
- [ ] Does the 30d/90d/12m toggle work?
- [ ] Does the Coverage Timeline correlation feel legible?
- [ ] Is the neutral "no pillar accent" design reading as cross-pillar, or does it feel unfinished?
- [ ] Typography: section headers at correct scale post-D018?

---

## 7. OMNI-TRAY

**Visual Status: ⚠️ NOT CONFIRMED**

### What Was Built
- Edge-triggered AI command bar (bottom-anchored horizontal tray)
- Side tray for context (proximity-driven tabs)
- Ask Pravado command bar visible in CC screenshot — partially confirmed

### What the CC Screenshot Shows
A bottom bar reading "Ask Pravado — Command Center" with quick chips (Summarize my week / What needs attention? / EVI status) and an input field. This is the Omni-Tray bottom bar.

### Needs Verification
- [ ] Side tray opens on edge hover — does it work?
- [ ] Does it render on pillar surfaces or only Command Center?
- [ ] Is the bottom bar height correct (not obscuring content)?

---

## 8. CROSS-CUTTING ISSUES (All Surfaces)

### 8.1 Three-Mode Architecture — CRITICAL GAP
**None of the surfaces currently show meaningfully different layouts by mode.** Per `MODE_UX_ARCHITECTURE.md` canon, modes should render as three different products:
- Manual: dense, full queue, direct manipulation, AI invisible
- Copilot: proposal-first, SAGE reasoning visible, approve/reject dominant
- Autopilot: sparse, exception-focused, execution log visible

The mode badge exists on action cards and the ImpactStrip, but the surface layout itself does not change. This is the most significant product experience deficit.

**Exception:** PRInbox does implement the three-posture architecture (`PR_MODE_BEHAVIOR` config). SEO was built with three separate view trees (SEOManualView / SEOCopilotView / SEOAutopilotView). Content was built with three separate views. The question is whether the *visual* differentiation is strong enough and whether the *per-pillar mode selector* is easily accessible.

### 8.2 ModeSwitcher Visibility
The ImpactStrip component includes an embedded ModeSwitcher. Whether this is rendering visibly and prominently enough on each surface needs visual confirmation. Per D018 and D020, the surface header should be at a scale where the mode control reads immediately.

### 8.3 SMB Mode Toggle Access
Per canon: SMB plan defaults to Autopilot, full access to all three modes. The toggle must be available. Needs visual confirmation it's accessible and obvious — not buried.

### 8.4 Content Surface Quality (Your Specific Concern)
You called for a complete redo. The TipTap rebuild (UI Sprint 2, Feb 21) rebuilt Manual mode as document-first. The DS overhaul (Feb 24) fixed typography hierarchy and layout laws. Whether the combination addresses the "feels generic, bad execution" concern requires a live visual look — cannot be determined from code alone.

### 8.5 Entity Map Dead Space
Open issue from Sprint 9k. The canvas renders correctly but has lateral dead space in the landscape viewport. Options documented: (A) accept centered arrangement, (B) expand radius to fill canvas, (C) add contextual information panels to flanks. No decision made yet.

---

## 9. WHAT WAS NOT POSSIBLE TO AUDIT VISUALLY

Due to browser extension disconnection, these were not captured as screenshots:
- PR surface (any tab)
- Content surface (any mode)
- SEO surface (any mode or tab)
- Calendar (any view)
- Analytics (full scroll)
- Omni-Tray side panel
- Any surface at non-default tab/mode

---

## 10. RECOMMENDED NEXT STEPS

### Immediate (Next Session)
1. **Full browser walkthrough** — With a working browser connection, capture screenshot of every surface at every tab/mode. Takes ~30 minutes. Run once, document everything.
2. **Content surface visual verdict** — Is the TipTap + DS overhaul enough, or is a redo still needed? This is the decision that unblocks the Content wiring sprint.

### Priority Decisions Needed
1. **Entity Map dead space** — Accept it, fill it, or flank it? Simple decision, affects Command Center feel significantly.
2. **ModeSwitcher prominence** — Is the embedded ImpactStrip ModeSwitcher visible/obvious enough across all surfaces, or does it need to be elevated?
3. **Content redo scope** — If still not satisfactory after visual inspection, what specifically is wrong? Document the exact problems before rebuilding anything.

---

## 11. KNOWN STATE SUMMARY (AS OF 2026-02-27)

| Surface | Built | DS Clean | Three Modes | Wired | Visual Confirmed |
|---------|-------|----------|-------------|-------|------------------|
| Command Center | ✅ | ✅ | Partial (badges only) | Mock + Entity Map | ✅ Today |
| PR | ✅ | ✅ | ✅ (code) | ✅ Feb 27 | ❌ Needed |
| Content | ✅ | ✅ | ✅ (code) | ❌ All mock | ❌ Needed |
| SEO | ✅ | ✅ | ✅ (code) | Partial (Keywords/SERP) | ❌ Needed |
| Calendar | ✅ | ✅ | N/A | ❌ All mock | ❌ Needed |
| Analytics | ✅ | ✅ | N/A | ❌ All mock | ❌ Needed |
| Omni-Tray | ✅ Partial | ✅ | N/A | N/A | Partial (CC only) |

---

*This document must be updated after the full browser walkthrough session. Every ❌ in "Visual Confirmed" represents an assumption that needs hard evidence.*
