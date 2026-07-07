# User Personas Research + Entity Map Regression Archaeology

**Date:** 2026-07-06
**Type:** Research + code archaeology (no code changes, no fixes)
**Scope:** (1) Locate the "12+ user personas" canon; (2) Diagnose why Command Center's Intelligence Canvas shows a placeholder instead of the Entity Map.

> **Path note:** the request specified `docs/audits/` (plural); this file is written to `docs/audit/` (singular) to match the existing convention and the CI path-guard allowlist (`scripts/check-path-guard.mjs:63`). `docs/audits/` does not exist and would fail the path guard.

---

## Executive Summary

**Part 1 — User personas: no discrete "12+ user persona" canon exists anywhere in the repo.** Aggressive grep across `packages/`, `apps/`, `docs/` (incl. `_archive`, `sprints`), migrations, and root markdown found only adjacent constructs: `UserRole = 'admin' | 'user' | 'guest'` (3 roles, `packages/types/src/user.ts:15`), the **Audience Persona Builder** (the customer's _customers_ — `packages/types/src/audiencePersona.ts`), the **8 AI agent personalities**, **4 plan tiers**, and **6 onboarding goals**. None is a set of 12+ named _user types_. The "12+ personas" figure most plausibly originates in an external business/pitch plan and has **never been formalized as canon**. A reconstruction and a proposed `USER_PERSONAS.md` location are given.

**Part 2 — Entity Map: this is an intentional, canon-documented mock-containment gate, not an accidental regression.** The Intelligence Canvas render is gated behind the feature flag `CC_ENTITY_MAP_WIRED` (default **false**, `packages/feature-flags/src/flags.ts:175`). The prior Entity Map rendered ~340 lines of **fabricated** mock nodes/edges (fake competitors, fake citations); commit `e4fdd67` ("Phase 0 Track 0B: Mock containment", 2026-06-02, **-801/+38 lines**) deliberately deleted the mocks and gated the surface, recorded in `DECISIONS_LOG.md` ("_Empty is honest, sample is dishonest_", line 654). Kestrel genuinely has **0** `intelligence_nodes`, **0** signals, **0** content, **0** citations — the map's data does not exist, so the placeholder is _not_ hiding real data. Restoration = build the deferred Phase-1 real-data feed, **not** un-gate the mock.

---

## Part 1 — User Personas

### Search executed

Grepped (case-insensitive) for: `persona`, `userType`, `user_type`, `role_type`, `archetype`, `user_archetype`, `job_to_be_done`, `jtbd`, `usePersona`, `PERSONA_`, `USER_ROLE`, `user types`, `ICP`, `user segment` — across `packages/*/src`, `apps/api/src`, `apps/dashboard/src`, `docs/` (incl. `_archive`, `sprints`, `dev`, `tests`), root markdown, and SQL migrations.

### Verdict: **No discrete user-persona canon exists.**

### What actually exists (near-misses, each ruled out)

| Location                                                                                                                | What it is                                                              | Why it's not "12+ user personas"                                        |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/types/src/user.ts:15`                                                                                         | `UserRole = 'admin' \| 'user' \| 'guest'`                               | Access-control roles (3), not user archetypes                           |
| `packages/types/src/audiencePersona.ts` (`PersonaType`, `PersonaStatus`, `PersonaInsightCategory`, `PersonaSourceType`) | **Audience** Persona Builder                                            | Models the _customer's customers_ (buyer personas), not Pravado's users |
| `packages/types/src/agents.ts` + `docs/product/ai_personality_v1.md`                                                    | The 8 AI agent personalities                                            | AI agents, not human user types                                         |
| `docs/product/ONBOARDING_REDESIGN_BRIEF.md:14-17`                                                                       | 6 onboarding primary goals (PR/Content/SEO/Crisis/Investor/Executive)   | Goals/jobs, not persona definitions                                     |
| `apps/api/supabase/migrations/05_create_roles_and_permissions.sql:67-71`                                                | 4 org access roles (`super_admin`/`org_owner`/`org_admin`/`org_member`) | Permission roles, not user archetypes                                   |
| `docs/canon/PLANS_LIMITS_ENTITLEMENTS.md` (Starter/Pro/Enterprise/Trial)                                                | 4 plan tiers                                                            | Billing tiers, not personas                                             |
| `docs/canon/MODE_UX_ARCHITECTURE.md` (manual/copilot/autopilot, per pillar)                                             | 3 automation modes                                                      | Engagement modes, not personas                                          |
| `ARCHITECT_BRIEFING.md` segments (SMB / Mid-market / Enterprise)                                                        | 3 customer segments + mode preferences                                  | Segments, not 12+ named personas                                        |

A background full-repo sweep (independent grep across `packages/`, `apps/`, `docs/` incl. `_archive`/`sprints`, and SQL migrations) **confirmed no additional persona artifact** beyond the near-misses above. The user model is genuinely **fragmented** across `packages/types/src/user.ts`, `ONBOARDING_REDESIGN_BRIEF.md`, `MODE_UX_ARCHITECTURE.md`, `PLANS_LIMITS_ENTITLEMENTS.md`, and the org-roles migration — never consolidated into a persona canon.

### What "12+ personas" most likely refers to

There is no in-repo artifact enumerating 12+ user types, so the figure almost certainly comes from an **external business/pitch plan** (the "plan" the architect referenced) and was never migrated into canon. The most defensible **in-repo reconstructions** of a ~12 count:

1. **6 onboarding goals × 2 engagement contexts** (solo/SMB vs. team/Enterprise) = 12 — treats each primary goal as a job-to-be-done, split by segment. _(Cleanest fit for "~12+.")_
2. **3 segments (SMB/Mid/Enterprise) × the pillar leads (PR / Content / SEO / Executive)** ≈ 12 role-flavored user types.
3. **8 AI agent personalities as mirrors of 8 intended user archetypes**, plus 4 governance/admin roles (owner/admin/member/billing) = 12.

None of these is written down; all are inferences. If the founder wants to formalize, the natural home is a new canon file:

> **Proposed:** `docs/canon/USER_PERSONAS.md` — enumerate each user type with: name, segment, primary goal(s), default automation mode, plan affinity, and the pillar surface they live in. Cross-reference `PRODUCT_CONSTITUTION.md` (user model), `AUTOMATION_MODES_UX.md` (per-pillar mode preference), and onboarding goals. Add a `DECISIONS_LOG` entry recording the canonical count so it stops being ambiguous.

---

## Part 2 — Entity Map Regression

### Track A — Component locations

| Role                                                                                                                            | File                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Intelligence Canvas **container** (tab shell + gate)                                                                            | `apps/dashboard/src/components/command-center/IntelligenceCanvasPane.tsx`                           |
| Entity Map **component** (exists but **orphaned** — exported at `command-center/index.ts:32`, **not mounted** by the container) | `apps/dashboard/src/components/command-center/EntityMap.tsx`                                        |
| Placeholder                                                                                                                     | `apps/dashboard/src/components/gates/ComingSoonGate.tsx`                                            |
| Dashboard data proxy (unused by the gated pane)                                                                                 | `apps/dashboard/src/app/api/command-center/entity-map/route.ts` → backend `/api/v1/sage/entity-map` |
| Backend entity-map handler                                                                                                      | `apps/api/src/routes/sage/index.ts:594`                                                             |
| CI guard (v2.0 patterns)                                                                                                        | `apps/dashboard/scripts/check-entity-map-spec.mjs`                                                  |

### Track B — Activation gate identified

**It is a feature-flag gate, not a data gate.**

- `IntelligenceCanvasPane.tsx:66` → `const wired = useFeatureFlag('CC_ENTITY_MAP_WIRED');`
- `IntelligenceCanvasPane.tsx:88` → `{!wired ? <ComingSoonGate ... /> : null}`
- Flag default: **`CC_ENTITY_MAP_WIRED: false`** (`packages/feature-flags/src/flags.ts:175`).
- The placeholder copy in code (`IntelligenceCanvasPane.tsx:92`) matches the founder's reported string verbatim.
- **Critical:** even when `wired === true`, the render is `null` (`IntelligenceCanvasPane.tsx:94-95`, comment "_Phase 1 restores the real canvas render here_"). So **flipping the flag alone renders nothing** — the real Entity Map render was removed, not merely hidden.

No `sage_signals` count, `entity_map_nodes` count, or per-pillar threshold is involved. The placeholder's "activates once your first signals are ingested" copy is **aspirational text**, not a live condition.

### Track C — Regression archaeology (verdict: **intentional, canon-documented**)

**Git evidence:**

- Gating commit: **`e4fdd67` "Phase 0 Track 0B: Mock containment"**, cryptocrystian, **2026-06-02**, PR #8 (squash-merge).
- Diff on the container: **801 deletions / 38 insertions** (`git show --stat e4fdd67` → `IntelligenceCanvasPane.tsx | 839 +--------`). The deleted ~801 lines were the mock-driven Entity Map render.
- Container git history shows a real Entity Map rendered _before_ the gate: `0d3250a` "Entity Map v5 — geometric redesign", and `EntityMap.tsx` history shows v6 iterations (`50f9e09` glassmorphism + D3-force + Canvas, `c7cfbe1` pan/zoom, `89cc1b9` visual upgrade).
- **But** the header comment on `IntelligenceCanvasPane.tsx:9-13` states the prior canvas was "~340 lines of hardcoded `MOCK_ENTITY_NODES` / `MOCK_ENTITY_EDGES` (fabricated competitor entities, fake citation counts)."

**Intentionality — canon proof (`DECISIONS_LOG.md`):**

- Line 652: "**Track 0B — Mock containment (PR #8, squash-merge `e4fdd67`)**".
- Line 654: "\*The May 12 audit confirmed this is the exact mechanism producing fabricated journalist relationships, fake EVI narratives... **No production surface falls back to mock data under any condition. Empty is honest, sample is dishonest.\***"
- The commit gated **18 `*_WIRED` flags (all false) across 21 surfaces** — Entity Map is one of many, part of a systemic anti-fabrication fire-break.

**Verdict:** The placeholder is **not an accidental refactor side-effect.** It is a deliberate, canon-recorded mock-containment decision. The prior Entity Map "worked" only because it displayed fabricated data; it was removed on purpose, with the real SAGE-driven render explicitly deferred to Phase 1. The founder's "regression" perception is understandable (the map used to appear) but "restoring it as-was" would reintroduce canon-forbidden mock data.

### Track D — Kestrel state (org `ef0ecafa-5f6b-420b-9b28-105a93001d6d`)

Queried Supabase project `kroexsdyyqmlxfpbwajv` (pravado-v2). There is **no** `entity_map_nodes` / `entities` / `entity_relationships` table; the graph store is `intelligence_nodes` (has `node_type`, centrality, `pagerank_score`, `cluster_id` — matches the v2.0 ring model). `reality_map_nodes` belongs to the Scenario Simulation feature (unrelated).

| Table                                         | Kestrel rows                 |
| --------------------------------------------- | ---------------------------- |
| `intelligence_nodes` (Entity Map graph store) | **0**                        |
| `sage_signals`                                | **0**                        |
| `sage_proposals`                              | **5**                        |
| `org_competitors`                             | **3** (Plaid, Stripe, Alloy) |
| `content_topics`                              | **0**                        |
| `citation_monitor_results`                    | **0**                        |

**Conclusion:** the Entity Map source data **does not exist** for Kestrel (`intelligence_nodes = 0`), and the backend `/entity-map` handler's own inputs (`content_topics`, `citation_monitor_results`, journalists) are also empty. This is **not** a rendering bug hiding populated tables — it is a genuine cold-start data void. The only real entity material Kestrel has is: **brand core** (the org) + **3 real competitors** + **5 real proposals** (which name structural gaps).

### Track E — Restoration path recommendation

Canon grounding: `ENTITY_MAP_CONTRACT.md:15` — the map answers _"Where does my brand stand in the AI knowledge graph right now, and where are the structural gaps preventing authority from reaching AI perceivers?"_ — and `:17` demands the strategic state be readable "in under 5 seconds." The contract is **silent on cold-start/empty state** (no cold-start/empty handling found in the file), so neither the placeholder nor a sparse map is explicitly canon-violating — but a full-screen placeholder answers _none_ of the Prime Directive question.

Weighing the options:

- **Flip the gate alone (Option 1): rejected.** The render is stubbed to `null` (Track B) — flipping `CC_ENTITY_MAP_WIRED` shows a blank canvas, not a map. Non-viable without Phase-1 render work.
- **Reintroduce the old render: rejected.** It depended on fabricated mock data — directly violates the Track 0B canon ("sample is dishonest").
- **Recommended — Option 2: build the deferred Phase-1 render + a _real-data_ minimal assembler.** Populate the map from data Kestrel actually has, mapped onto the v2.0 concentric rings (D012): **Ring 1 Owned Authority** = brand core (1 real node); **Ring 3 Perceived Authority** = the 3 real `org_competitors`; **Ring 2 Earned Authority** = empty (0 citations) — _shown as empty, honestly_; **gap nodes** = derived from the 5 real `sage_proposals`. This honors _both_ the anti-mock canon (every node is real) _and_ the Prime Directive (it answers the question: "you have owned identity + 3 known competitors, zero earned authority in the AI graph, and here are 5 gaps to close"). It requires (a) the Phase-1 canvas render and (b) extending the backend `/entity-map` handler to read `org_competitors` + `sage_proposals` + brand core (it currently reads `content_topics`/journalists/citations, all empty for Kestrel).

**Bottom line:** the gate is intentional and canon-compliant; "restoration" is a **forward** build (real cold-start feed), not a backward un-gate. Recommend scoping it as the Phase-1 Entity Map task, explicitly limited to real entities, with the empty Earned-Authority ring rendered honestly.

---

## Recommended priorities for architect

1. **Decide the persona question at the source.** No canon exists; the "12+" is external. If it matters, create `docs/canon/USER_PERSONAS.md` + a `DECISIONS_LOG` entry fixing the count and each persona's segment/goal/mode/plan mapping. Otherwise, drop the "12+" from planning language to avoid a phantom requirement.
2. **Reframe the Entity Map "regression" as Phase-1 build, not bug.** It was intentionally gated (D-Track 0B). The restoration is the real-data minimal-map assembler (Track E Option 2), not flipping `CC_ENTITY_MAP_WIRED`.
3. **If a cold-start map is wanted, extend the backend `/entity-map` handler** to source `org_competitors` + `sage_proposals` + brand core (currently it reads only content/journalist/citation tables — all empty at cold start).
4. **Consider a canon amendment to `ENTITY_MAP_CONTRACT.md`** defining the explicit cold-start/empty-state UX (the contract is currently silent), so "placeholder vs. sparse map" is a canon decision rather than an implementation default.

## Adjacent findings

- **`EntityMap.tsx` is orphaned** — exported (`command-center/index.ts:32`) but never mounted; kept for the deferred Phase-1 restore.
- **Entity Map canon is spread across 3 files** — `ENTITY_MAP_CONTRACT.md` (v2.0), `ENTITY_MAP_SPEC.md`, `ENTITY-MAP-SAGE.md` (+ `COMMAND_CENTER_CONTRACT.md` for tab structure). The code comment cites `ENTITY_MAP_SPEC.md §8` while the founder references `ENTITY_MAP_CONTRACT.md v2.0` — worth confirming they're consistent post-D012.
- **The placeholder copy oversells a condition that doesn't exist** — "activates once your first signals are ingested" implies a data threshold, but the gate is a static feature flag. Even connecting GSC (adding `sage_signals`) would **not** flip `CC_ENTITY_MAP_WIRED`. Misleading to users.
- **`reality_map_nodes` ≠ Entity Map** — it backs the Scenario Simulation feature; easy to confuse by name.
