# PRAVADO v2 — UX SURFACES
Version: v1.0 (Canon)

## Purpose
Define the canonical user-facing surfaces and their responsibilities.

## Primary Surfaces
1) Command Center (Tri-pane)
- Left: Action Stream (proposals/tasks)
- Center: Intelligence Canvas (maps, relationships, citation feed)
- Right: Strategy Panel (narrative, KPIs, plan adjustments)

2) PR Work Surface
- Journalist database exploration + filtering
- Matching + pitch + outreach workflows
- Relationship/activity tracking
- Enrichment visibility (freshness, beat recency, link openness)

3) Content Work Surface
- Plan → briefs → drafts → approvals → schedule
- Transform PR narratives into content
- Connect to Calendar + Analytics

4) SEO Work Surface
- Technical blockers + ingestibility checks
- Keyword/topic gaps connected to content planning
- Execution items routed to Calendar

5) Orchestration Calendar (Execution Surface)
- Day/week/month views
- Item drilldown: why, dependencies, approvals, status, logs
- Cross-pillar scheduling + sequencing

6) Analytics & Reporting
- Outcomes, attribution, exposure measurement
- CiteMind/AEO/citation intelligence lives here and in the Command Center intelligence canvas

7) Omni-Tray (Support)
- Explain/assist/inspect
- Not the primary execution surface

## Compliance Checklist
- [ ] PR/Content/SEO each have real workflows
- [ ] Calendar connects all pillars
- [ ] Analytics ties outcomes to actions

---

## Surface Authority (Canon)

### PRIMARY + DEFAULT Surface
**Command Center** (`/app/command-center`)
- The Command Center is the ONLY primary user surface
- Default landing experience post-login
- All new feature work should integrate with Command Center
- Route: `/app/command-center`

### DEPRECATED Surfaces
**Legacy Dashboard** (`/app/dashboard`)
- Status: **DEPRECATED** - Do not use
- All traffic redirects to Command Center
- No new work permitted on this surface
- Protected by CI gate (`check-legacy-surfaces.mjs`)
- Will be removed in future cleanup sprint

### Enforcement
- `/app/dashboard` routes MUST redirect to `/app/command-center`
- Sidebar navigation MUST NOT include "Dashboard" entries
- CI will fail PRs that modify legacy dashboard files
- Exceptions: redirect implementation, documentation updates
