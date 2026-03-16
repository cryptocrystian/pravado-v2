# PRAVADO V2 — BUILD STATUS
**Last updated:** 2026-02-19
**Authority:** This doc reflects actual repo state. Canon docs define what things *should* be.
**Rule:** Update this file whenever a surface changes state.

---

## Surface Status Map

| Surface | Route | State | Notes |
|---|---|---|---|
| Command Center | `/app/command-center` | ✅ Built + audited | Tri-pane shell, ActionStream, StrategyPanel live. DS v3.1 sprint 1 complete. |
| PR Work Surface | `/app/pr` | ✅ Built + audited | All 7 views + 11 components exist. DS v3.1 audit verified clean — no phantom hex, no DS v2 tokens, no bare white, no sub-10px violations across all files. |
| Content Work Surface | `/app/content` | ✅ Built + audited | Shell + 4 views exist (WorkQueue, Library, Calendar, Insights). All data is mock — `useSWR` hooks stubbed out. DS v3.1 audit complete — all phantom hex + typography violations fixed. |
| SEO Work Surface | `/app/seo` | 🟡 Partial | Keywords + SERP tab has real API calls (`/api/seo/*`). On-Page and Backlinks tabs are "coming soon" stubs. DS v3.1 audit complete — all DS v2 tokens (`panel-card`, `text-white-0`, `text-slate-6`, `text-muted`, `input-field`, custom AI dot CSS classes), pillar color violation (iris→cyan), and typography violations corrected. |
| Orchestration Calendar | `/app/calendar` | ❌ Stub only | "Coming Soon" page. No views, no data, no routing. |
| Analytics & Reporting | `/app/analytics` | ❌ Stub only | "Coming Soon" page. Metrics exist in Command Center only. |
| Onboarding | `/app/onboarding` | 🟡 Built, incomplete | 6-step wizard exists and routes correctly. Captures goals/risk/cadence. Does NOT do competitive snapshot, plan generation, or pre-populate workspace. Full redesign spec at `docs/product/ONBOARDING_REDESIGN_BRIEF.md` — tabled until pillars are GA. |

---

## DS v3.1 Compliance State

| Surface | P0 Contract | P1 Tokens | P2 Typography | P3 Hex | P4 Bare White |
|---|---|---|---|---|---|
| Command Center | ✅ | ✅ | ✅ | ✅ | ✅ |
| PR Work Surface | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Fixed |
| Content Work Surface | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Fixed |
| SEO Work Surface | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Fixed | ✅ Fixed |

---

## API / Data Layer

| Area | State | Notes |
|---|---|---|
| PR APIs | 🟡 Mixed | `PRDatabase`, `PRPitches` have real `useSWR`. `PRCoverage` is all mock. `PRInbox` fetches but falls back to mock. Others mostly mock. |
| Content APIs | ❌ All mock | Hooks exist but are commented out. Mock data inline in page.tsx. |
| SEO APIs | 🟡 Partial | `/api/seo/keywords`, `/api/seo/opportunities`, `/api/seo/serp` exist and are called. On-Page and Backlinks have no routes. |
| Calendar APIs | ❌ None | No routes exist. |
| Analytics APIs | ❌ None | No routes exist. |

---

## Known Blockers / Gaps

1. ~~**PRInbox.tsx P2 sweep**~~ — ✅ Complete (verified clean on disk).
2. ~~**PR P3 (phantom hex)**~~ — ✅ Complete (verified clean on disk).
3. ~~**Content DS audit**~~ — ✅ Complete. All phantom hex and typography violations fixed across 30 component files.
4. ~~**SEO DS migration**~~ — ✅ Complete. All DS v2 tokens, pillar color violations, and typography violations corrected in `seo/page.tsx`.
5. **Calendar** — Not started. Canon contract exists at `docs/canon/ORCHESTRATION_CALENDAR_CONTRACT.md`.
6. **Analytics** — Not started. Deferred until pillar surfaces are GA.
7. **Personalization gate enforcement** — `PRPitches` shows send CTA regardless of score. Needs `< 40%` confirmation modal.
8. **Onboarding redesign** — Spec complete, implementation tabled.
9. **DECISIONS_LOG.md** — Populated retroactively (see below). Keep it current going forward.

---

## Launch Readiness Assessment

For a credible GA launch the minimum bar is:
- PR Work Surface: DS audit complete, real data where promised ✅ mostly
- Content Work Surface: DS audit + real data hookup
- SEO Work Surface: DS v3.1 migration + real data for Keywords tab
- Calendar: At minimum a functional read-only view with mock data (stub is not acceptable for GA)
- Analytics: Minimum EVI summary view (Command Center preview promoted to full page is acceptable V1)
- Onboarding: Competitive snapshot + plan generation (conversion-critical)

**Current gap to GA:** ~~Content audit~~ ✅, ~~SEO migration~~ ✅, Calendar V1, Analytics V1, Onboarding redesign.

---

## Archived Files (Do Not Reference)

| File | Reason |
|---|---|
| `docs/_archive/pravado_master_implementation_plan.ARCHIVED.md` | Described a different product (messaging/persona platform). Not Pravado v2. |
| `docs/_archive/pravado_master_spec_v1.3a.ARCHIVED.md` | Jan 2025 handoff spec for pre-v2 design. Component prop shapes do not match current implementation. |

---

*Single source of truth for build state. Canon docs (`/docs/canon/*`) remain the authority for what things should be.*
