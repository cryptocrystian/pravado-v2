# PRAVADO — DECISIONS LOG

## Purpose
Auditable record of decisions to prevent long-term drift.
Per CHANGE_CONTROL.md: if it is not in canon, it is not a requirement.

---

### Decision Entry Template
- **Date:** YYYY-MM-DD
- **Decision ID:** D###
- **Area:** (SAGE / AUTOMATE / UX / DS / Plans / Contracts / Infra)
- **Decision:**
- **Rationale:**
- **Canon Files Impacted:**
- **Contracts Impacted:**
- **Implementation Notes:**

---

## Entries

---

- **Date:** 2026-02-18
- **Decision ID:** D001
- **Area:** AUTOMATE / Contracts
- **Decision:** Follow-up limit is hard-capped at **2 per contact per 7-day window**, not 3. `PRSettings.tsx` `DEFAULT_GUARDRAILS.followUpLimitPerWeek` corrected from 3 → 2. Slider max corrected from 5 → 2.
- **Rationale:** `PR_PITCH_PIPELINE_CONTRACT.md` V1.1 §4.2 explicitly sets maximum 2 follow-ups per contact per 7-day window. The implementation had drifted to 3 default / 5 max with no justification.
- **Canon Files Impacted:** `PR_PITCH_PIPELINE_CONTRACT.md`
- **Contracts Impacted:** `PR_PITCH_PIPELINE_CONTRACT.md` §4.2
- **Implementation Notes:** Fixed as P0-1 in DS v3.1 audit sprint 1.

---

- **Date:** 2026-02-18
- **Decision ID:** D002
- **Area:** DS
- **Decision:** DS v3.1 typography floor is **13px minimum** for all semantic content. 12px (`text-xs`) is permitted only when paired with `uppercase + tracking-wider` (decorative column headers, section labels). Below 12px is never valid for any rendered text.
- **Rationale:** Accessibility and readability floor established in `DS_v3_1_EXPRESSION.md`. Systematic violation found across all PR Work Surface views — 47 instances. Sweeping in sprints.
- **Canon Files Impacted:** `DS_v3_1_EXPRESSION.md`
- **Contracts Impacted:** None directly.
- **Implementation Notes:** Badges changed from `font-bold uppercase` to `font-semibold` (no uppercase) as part of the fix to maintain visual hierarchy at the larger size.

---

- **Date:** 2026-02-18
- **Decision ID:** D003
- **Area:** DS
- **Decision:** Phantom hex surface tokens (`bg-[#0D0D12]`, `border-[#1A1A24]`, etc.) will be replaced with semantic tokens in a **single coordinated PR** across all files — not file-by-file.
- **Rationale:** Piecemeal replacement creates visual inconsistency during the transition window. All hex values are visually correct; this is a semantic token path issue only, not a visual bug. Risk of doing it incrementally outweighs the delay.
- **Canon Files Impacted:** `DS_v3_1_EXPRESSION.md`
- **Contracts Impacted:** None.
- **Implementation Notes:** Deferred to Sprint 3 of PR Work Surface audit. Will create `tokens/surfaces.ts` as part of that sprint.

---

- **Date:** 2026-02-18
- **Decision ID:** D004
- **Area:** UX / Contracts
- **Decision:** CiteMind audio features are **deferred to V2**. V1 ships with CiteMind data (citation scores, share of model, entity sentiment) visible in UI but no audio playback, voice briefings, or audio-first workflows.
- **Rationale:** Audio infrastructure was not scoped for V1. Noted explicitly in `PRSettings.tsx` system-enforced guardrails and `DistributionDecisionMatrix.tsx`. Reduces V1 scope without removing CiteMind intelligence.
- **Canon Files Impacted:** `CITEMIND_SYSTEM.md`, `PR_WORK_SURFACE_CONTRACT.md`
- **Contracts Impacted:** None (V1 contracts already reflect data-only CiteMind).
- **Implementation Notes:** UI should label audio features as "V2" where referenced. Do not build stubs that imply imminent availability.

---

- **Date:** 2026-02-18
- **Decision ID:** D005
- **Area:** UX
- **Decision:** Personalization gate for pitch sending requires a **confirmation dialog** (not a hard block) when personalization score < 40%, not a disabled send button.
- **Rationale:** Hard block was considered too aggressive for V1 — users may have legitimate reasons to send lower-scored drafts. Warning modal preserves the guardrail intent without blocking the workflow. Per `PR_WORK_SURFACE_CONTRACT.md` personalization gate requirements.
- **Canon Files Impacted:** `PR_WORK_SURFACE_CONTRACT.md`
- **Contracts Impacted:** `PR_PITCH_PIPELINE_CONTRACT.md`
- **Implementation Notes:** Not yet implemented. Needs `window.confirm` or modal in `PitchDetailPanel.handleManualSend` before `setIsSending(true)`. Tracked as gap in DS audit.

---

- **Date:** 2026-02-18
- **Decision ID:** D006
- **Area:** UX / Infra
- **Decision:** `/app/dashboard` is **deprecated**. Command Center (`/app/command-center`) is the sole primary surface and default post-login landing. All dashboard routes must redirect to Command Center.
- **Rationale:** Consolidation of primary surface. Legacy dashboard accumulated drift from the canon tri-pane Command Center design. CI gate (`check-legacy-surfaces.mjs`) enforces this.
- **Canon Files Impacted:** `UX_SURFACES.md`
- **Contracts Impacted:** `COMMAND_CENTER_CONTRACT.md`
- **Implementation Notes:** CI will fail PRs that modify `/app/dashboard` files. Redirect is implemented. Do not add sidebar "Dashboard" entries.

---

- **Date:** 2026-02-18
- **Decision ID:** D007
- **Area:** DS
- **Decision:** Toast component will be **unified into a single shared `components/Toast.tsx`** — currently two slightly different implementations exist in `PRSettings.tsx` and `PRPitches.tsx`.
- **Rationale:** Duplicated Toast definitions will diverge further over time. P5-4 from DS audit.
- **Canon Files Impacted:** `DS_v3_1_EXPRESSION.md`
- **Contracts Impacted:** None.
- **Implementation Notes:** Deferred to Sprint 4 (polish pass). Not a ship blocker.

---

- **Date:** 2026-02-18
- **Decision ID:** D008
- **Area:** Infra
- **Decision:** The file `docs/product/pravado_master_implementation_plan.md` and `docs/canon/pravado_master_spec 2.0.md` have been **archived** to `docs/_archive/`. They described a different product (a messaging/persona platform) and a pre-v2 component handoff respectively. Neither reflects Pravado v2.
- **Rationale:** Both files were potential sources of catastrophic context drift. Any session reading them as authoritative would produce work for the wrong product.
- **Canon Files Impacted:** None (files removed from canon path).
- **Contracts Impacted:** None.
- **Implementation Notes:** See `docs/_archive/` for originals. `docs/PRAVADO_V2_STATUS.md` is the replacement for the implementation plan.

---

- **Date:** 2026-02-20
- **Decision ID:** D009
- **Area:** Contracts / UX
- **Decision:** The `UpgradeHookCard` button in Strategy Panel is **exempt** from the "no action buttons" contract invariant. It remains in the Strategy Panel as-is (Option A).
- **Rationale:** The contract invariant states "NO action buttons" and "Diagnostic only" for the Strategy Panel. The UpgradeHookCard's "Upgrade to Pro →" link is a commercial navigation action — it directs the user to a billing/plan page. It does not execute any work action (no SAGE action, no content creation, no PR outreach, no data mutation). It is functionally equivalent to displaying a "Pro" badge on a locked insight. The contract's intent is to prevent the Strategy Panel from becoming an execution surface; plan upgrade navigation does not violate that intent.
- **Canon Files Impacted:** `COMMAND_CENTER_CONTRACT.md` (invariant clarification — upgrade navigation is not a "work action")
- **Contracts Impacted:** `COMMAND_CENTER_CONTRACT.md` §Strategy Panel Invariants
- **Implementation Notes:** No code change required. The button at `StrategyPanelPane.tsx` line 330 (`Upgrade to {hook.min_plan} →`) stays. Future CI guardrail (`check-strategy-panel-buttons.mjs`) should whitelist elements with `upgrade` or `plan` in their text content.

---

- **Date:** 2026-02-20
- **Decision ID:** D010
- **Area:** UX / DS
- **Decision:** Non-canonical/legacy component files (~200) retain `text-gray-*` violations. These are deferred as post-GA tech debt, not blocking GA.
- **Rationale:** The 200 files are in non-canonical surfaces (crisis, governance, audit, media-briefings, investor-relations, etc.) that are not part of the 6 canonical surfaces defined in UX_SURFACES.md. Fixing them all in Sprint 7 would be scope creep with no user-visible benefit on canonical surfaces. All 6 canonical surfaces pass DS v3.1 compliance.
- **Canon Files Impacted:** None
- **Contracts Impacted:** None
- **Implementation Notes:** A future sweep sprint can batch-fix these with find-and-replace. Priority: surfaces that get promoted to canonical status first.

---

- **Date:** 2026-02-20
- **Decision ID:** D011
- **Area:** DS
- **Decision:** Removed `surfaceTokens` JS hex object from `prWorkSurfaceStyles.ts` per DS_v3_COMPLIANCE_CHECKLIST.md §1D (banned pattern). The object was dead code (exported but never imported).
- **Rationale:** §1D explicitly bans JS constant objects with hardcoded hex values as they bypass Tailwind's design token system. The `surfaceTokens` object contained 5 banned hex values. `pillar-accents.ts` had already removed its copy with a comment. Replaced all hex-based Tailwind classes (`bg-[#0D0D12]`, `border-[#1A1A24]`, etc.) in cardStyles/inputStyles/sectionStyles with proper DS tokens.
- **Canon Files Impacted:** `DS_v3_COMPLIANCE_CHECKLIST.md` (enforced)
- **Contracts Impacted:** None
- **Implementation Notes:** Also updated `REQUIRED_DS3_PATTERNS` constant in same file to reference correct Tailwind classes instead of banned hex values.

---

---

- **Date:** 2026-02-23
- **Decision ID:** D012
- **Area:** UX / Contracts
- **Decision:** The Entity Map architecture is superseded from SAGE zone-based (Signal/Authority/Growth/Exposure quadrants) to a **concentric ring model** (Ring 1: Owned Authority / Ring 2: Earned Authority / Ring 3: Perceived Authority). The previously frozen `ENTITY_MAP_CONTRACT.md` v1.0 is retired and replaced by v2.0. `ENTITY-MAP-SAGE.md` is updated to reflect the new architecture.
- **Rationale:** The zone model treated all node relationships as equivalent (every satellite equidistant from center), which misrepresented the AEO causal thesis. The concentric ring model encodes causal role structurally — Ring 1 causes Ring 2, Ring 2 enables Ring 3 — making Pravado's core differentiator (Owned → Earned → Perceived authority flow) immediately visible in the visualization. The ring model also provides superior scalability, maps directly to the three-pillar attribution system in Analytics, and enables the "colonize the map" strategic narrative central to the product's value proposition.
- **Canon Files Impacted:** `ENTITY_MAP_CONTRACT.md` (v1.0 retired, v2.0 issued), `ENTITY-MAP-SAGE.md` (updated), `ENTITY_MAP_SPEC.md` (new — added to canon)
- **Contracts Impacted:** `ENTITY_MAP_CONTRACT.md`, `COMMAND_CENTER_CONTRACT.md` (Intelligence Canvas tab structure updated)
- **Implementation Notes:** CI guardrail `check-entity-map-spec.mjs` must be updated to remove `forceSimulation` as a forbidden pattern (force-directed positioning within rings is now permitted) and add new required patterns for ring structure, affinity-based angular positioning, and chain illumination behavior.

---

- **Date:** 2026-02-23
- **Decision ID:** D013
- **Area:** UX / Contracts
- **Decision:** Entity Map animation model is **event-driven only** — no ambient or real-time streaming animations. Citation detection animations fire on session load (new citations since last session) and on manual refresh trigger, not as a live stream.
- **Rationale:** CiteMind citation scans run on a daily Autopilot schedule with 1–24 hour latency depending on AI engine. Animating as if the system is live would misrepresent data freshness. Event-driven animation on session load is honest ("here's what changed since you were last here") and avoids the cognitive fatigue of continuous ambient motion.
- **Canon Files Impacted:** `ENTITY_MAP_SPEC.md`
- **Contracts Impacted:** `ENTITY_MAP_CONTRACT.md` §Animation Rules
- **Implementation Notes:** Session-load animation plays maximum once per session per new citation event. Manual refresh button in map toolbar triggers re-check and animation for newly detected citations.

---

- **Date:** 2026-02-23
- **Decision ID:** D014
- **Area:** UX / Contracts
- **Decision:** Ring node overflow uses **cluster nodes** (not "Show more") when a ring exceeds 8 nodes. A cluster node aggregates overflow entities into a single labeled node (e.g., "12 Journalists") positioned at the aggregate affinity score. Clicking expands the ring in place without reflow.
- **Rationale:** A simple "Show more" expansion destroys the ring structure's readability and spatial memory. Cluster nodes preserve the ring geometry while communicating density ("good problem to have"), scaling to arbitrarily large accounts without degrading the strategic read.
- **Canon Files Impacted:** `ENTITY_MAP_SPEC.md`, `ENTITY_MAP_CONTRACT.md`
- **Contracts Impacted:** `ENTITY_MAP_CONTRACT.md` §Performance Contract
- **Implementation Notes:** Cluster node displays aggregate authority weight as its size, aggregate affinity score as its angular position, and the count of contained entities as its label. Expand/collapse is animated (300ms). Clusters are never created for Ring 0 (Brand Core — always one node) or when ring count ≤ 8.

---

- **Date:** 2026-02-23
- **Decision ID:** D015
- **Area:** SAGE / Contracts
- **Decision:** SAGE proposals must include a **mandatory entity-specific one-sentence insight** field surfaced as the intelligence brief in Entity Map progressive disclosure panels.
- **Rationale:** The SAGE_v2 spec already requires a "why" field per proposal. The intelligence brief in node progressive disclosure is not a separate capability — it pulls from the proposal's "why" field. To make this useful at the node level, the "why" format is constrained to include one entity-specific sentence with a concrete metric or relationship signal (e.g., "This journalist covers AI infrastructure at a frequency correlating with your target topics at 3.2×"). Generic strategic rationale without entity-specific context fails the usefulness bar.
- **Canon Files Impacted:** `SAGE_v2.md` (output format constraint added), `ENTITY_MAP_SPEC.md`
- **Contracts Impacted:** `ENTITY_MAP_CONTRACT.md` §Progressive Disclosure
- **Implementation Notes:** SAGE proposal output schema must add `entity_insight: string` — required, max 160 characters, must reference the specific entity and at least one measurable signal. Null or generic values are a SAGE output quality failure.

---

- **Date:** 2026-02-23
- **Decision ID:** D016
- **Area:** AUTOMATE / Contracts
- **Decision:** AUTOMATE is responsible for creating Action Stream records when SAGE detects a new gap node for the Entity Map. SAGE generates the proposal; AUTOMATE materializes it as an Action Stream record and sets the `linked_entity_id` binding.
- **Rationale:** SAGE is the strategic layer (what to do and why). AUTOMATE is the operational layer (task materialization, governance, audit trail). Action Stream records are AUTOMATE artifacts, not SAGE artifacts. This division is consistent with the existing AUTOMATE_v2 canon and ensures the coherence guarantee (every Entity Map node has a linked Action Stream record) is enforced by the execution governance layer, not the intelligence layer.
- **Canon Files Impacted:** `AUTOMATE_v2.md` (Entity Map gap → Action Stream record creation added as an explicit AUTOMATE responsibility), `ENTITY_MAP_SPEC.md`
- **Contracts Impacted:** `ENTITY_MAP_CONTRACT.md` §Action Stream Coherence
- **Implementation Notes:** Trigger: SAGE emits `gap_node_detected` event with `entity_id`, `ring`, `pillar`, `proposal_id`. AUTOMATE subscribes, creates Action Stream record, sets status to `Priority` if confidence ≥ 0.7 else `Pending`, writes `linked_entity_id` back to entity node record.

---

- **Date:** 2026-02-23
- **Decision ID:** D017
- **Area:** UX / Contracts
- **Decision:** Ring 1 nodes represent **topic clusters**, not individual content pieces. Each cluster aggregates all content targeting that topic and displays the cluster's structured-data coverage and schema health as its authority weight.
- **Rationale:** An active account publishes hundreds of content pieces quickly. Individual-piece nodes in Ring 1 would immediately overflow into meaningless cluster nodes before the map provides strategic value. Topic clusters represent the authority territory Pravado is building — the correct unit of analysis for Ring 1 (Owned Authority). SAGE builds authority around topics, not URLs. Individual content pieces are accessible via progressive disclosure drill-through from the topic cluster node.
- **Canon Files Impacted:** `ENTITY_MAP_SPEC.md`, `ENTITY_MAP_CONTRACT.md`
- **Contracts Impacted:** `ENTITY_MAP_CONTRACT.md` §Node Taxonomy
- **Implementation Notes:** Topic cluster node size = aggregate schema coverage score across all content in cluster. Angular position within Ring 1 = weighted average affinity score of all content pieces in cluster. Node label = topic cluster name (e.g., "AEO Strategy", "Entity SEO"). Progressive disclosure panel shows list of content pieces in cluster with individual schema and index status.

---

- **Date:** 2026-02-24
- **Decision ID:** D018
- **Area:** Design System / Typography
- **Decision:** The typography scale is corrected to a proper enterprise-grade hierarchy. Surface titles use `text-2xl` (24px) minimum. The v1.0 scale (headingLg = `text-lg` = 18px, body = `text-sm` = 14px) is deprecated due to a 4px gap that is visually indistinct at normal viewing distances.
- **Rationale:** In the v1.0 token files (`typography.ts`, `text-intents.ts`), the largest heading was 18px and body was 14px — a 4px difference invisible on 27" monitors. A proper enterprise hierarchy requires a 10px minimum gap between page title and body. The corrected scale is: Surface Title 24px, Section 20px, Pane 18px, Sub-section 16px, Card Title 15px, Body 14px, Secondary 13px, Metadata 12px (uppercase only), Badge 11px (uppercase only).
- **Canon Files Impacted:** `DS_v3_1_EXPRESSION.md` (typography scale added), `DS_v3_PRINCIPLES.md` (typography principle added)
- **Implementation Files Updated:** `typography.ts`, `text-intents.ts`
- **Implementation Notes:** Legacy token aliases (`headingLg`, `titleLarge`, `titleSecondary`) kept for backward compatibility but marked deprecated. All new components must use `titlePage`, `titleSection`, `titlePane`, `titleGroup`, `titleCard` tokens.

---

- **Date:** 2026-02-24
- **Decision ID:** D019
- **Area:** Design System / Layout
- **Decision:** Four layout laws are canonized: (1) Width is earned by content, not assumed from container; (2) Whitespace separates semantic sections or is breathing room — no other purpose; (3) Cards are decision units (one action), not data containers (many attributes); (4) Data shape determines layout — tables for tabular data, cards for decisions, KPI rows for metrics, charts for time-series.
- **Rationale:** The "stacked spreadsheet" visual problem in Pravado surfaces is caused by the absence of layout laws. Without explicit rules, Claude Code defaults to full-width cards for all data, which produces the appearance of an Excel spreadsheet. These four laws directly address that failure mode.
- **Canon Files Impacted:** `DS_v3_PRINCIPLES.md` (layout laws added), `PRAVADO_DESIGN_SKILL.md` (Layout Laws section added)
- **Implementation Notes:** These are pre-implementation constraints. Every new layout component must pass the width justification test before coding begins. The compliance checklist in the design skill is updated accordingly.

---

- **Date:** 2026-02-24
- **Decision ID:** D020
- **Area:** Design System / Topbar
- **Decision:** The `CommandCenterTopbar` height is `h-16` (64px), not `h-14` (56px). Background is `bg-slate-1/95` not `bg-page/95`. Wordmark is `text-xl font-bold` minimum.
- **Rationale:** `h-14` (56px) reads as a mobile header or lightweight utility nav, not an enterprise command interface. 64px establishes visual authority. `bg-slate-1` provides subtle separation from `bg-page` content below. Wordmark at `text-xl` (20px) matches the 24px surface title standard for navigation elements.
- **Canon Files Impacted:** `PRAVADO_DESIGN_SKILL.md` (Navbar Specification section)
- **Implementation Notes:** The existing `CommandCenterTopbar.tsx` uses `h-14` and `bg-page/95` — both need updating. Wordmark is already `text-lg`; update to `text-xl`.

---

- **Date:** 2026-02-24
- **Decision ID:** D021
- **Area:** Design System / Border Radius
- **Decision:** Default border radius is `rounded-md` (8px), not `rounded-lg` (16px). Large containers use 12px. Modals/overlays use 16px.
- **Rationale:** 16px border radius reads as consumer/friendly UI (think mobile apps, consumer SaaS). 8px reads as professional precision tool — the correct target for a B2B command center. Small change, meaningful perceptual impact on authority and professional tone.
- **Canon Files Impacted:** `DS_v3_1_EXPRESSION.md` (border radius section updated)
- **Implementation Notes:** The `--radius-md` CSS variable must be set to 8px. The design skill patterns are updated to use `rounded-lg` (which maps to 12px in the updated scale) only for larger panels. Existing components using `rounded-xl` should be evaluated and updated.

---

- **Date:** 2026-03-02
- **Decision ID:** D022
- **Area:** UX / Layout / Contracts
- **Decision:** TriPaneShell is **NOT a global layout requirement**. It is the Command Center layout, appropriate for a command-and-intelligence hub. All other surfaces (Content, PR, SEO, Analytics, Calendar) must use layouts determined by their own workflow requirements. Content Work Surface layouts are now specified per-view in CONTENT_WORK_SURFACE_CONTRACT.md v2.0 §3.2.
- **Rationale:** The TriPaneShell was erroneously written into CONTENT_WORK_SURFACE_CONTRACT.md v1.0 as a mandatory requirement for all Content views. This was never a product decision — it was a specification error. Forcing a three-pane layout on views like Calendar (needs full horizontal space) and Asset Editor (needs full-width writing area) produces poor UX and contradicts D019's layout law #1 ("width is earned by content, not assumed from container"). Each surface and each view within that surface must earn its layout through workflow requirements.
- **Canon Files Impacted:** `CONTENT_WORK_SURFACE_CONTRACT.md` (§3 rewritten)
- **Contracts Impacted:** `CONTENT_WORK_SURFACE_CONTRACT.md`
- **Implementation Notes:** The TriPaneShell component itself is not deprecated — it remains available and may be appropriate for specific views within Content if their workflow genuinely requires three simultaneous panels. The change is that it cannot be the default imposed globally.

---

- **Date:** 2026-03-02
- **Decision ID:** D023
- **Area:** Product / Competitive Strategy / Content Pillar
- **Decision:** AEO citation-worthiness is the **primary content quality metric** in Pravado, replacing NLP term coverage and keyword density as the standard quality signal. CiteMind score is the primary visual hierarchy element on all content asset representations. Five competitive moat requirements are established for the Content surface rebuild and are codified in CONTENT_WORK_SURFACE_CONTRACT.md §9B.
- **Rationale:** Full competitive landscape analysis (COMPETITIVE_INTELLIGENCE_2026.md) confirms that every legacy content tool (Surfer, Clearscope, Frase, MarketMuse) optimizes for NLP term coverage and SEO keyword signals — metrics that have weak correlation with AI citation rates. The 2026 market reality is that citation-worthiness is the new primary content quality metric (Profound's analysis of 2.6B citations confirms classic SEO metrics show light or no correlation with AI citation frequency). No competitor builds citation-worthiness guidance into the content creation workflow itself. Making AEO citation potential the primary quality signal in the Pravado Content surface is the highest-leverage differentiation available, and is uncopiable by single-pillar tools.
- **Canon Files Impacted:** `CONTENT_WORK_SURFACE_CONTRACT.md` (§9B added), `COMPETITIVE_INTELLIGENCE_2026.md` (new file — added to canon)
- **Contracts Impacted:** `CONTENT_WORK_SURFACE_CONTRACT.md`
- **Implementation Notes:** All five moat requirements in §9B are V2 non-negotiable. The content rebuild sprint plan must satisfy all five before the surface is considered production-ready. The competitive intelligence document should be reviewed quarterly and updated when major competitor positions shift.

---

- **Date:** 2026-03-02
- **Decision ID:** D024
- **Area:** Implementation / Content Surface Rebuild
- **Decision:** Phase 1 of the Content surface rebuild (foundation) is **complete and live**. The stale `/app/content` route page (generic two-column CMS layout) has been replaced with the ContentWorkSurfaceShell-connected surface. ContentOverviewView, ContentAssetCard v2, and all four tabs are functional with no runtime errors.
- **Rationale:** Per CONTENT_REBUILD_BRIEF.md, the old page was a pre-contract placeholder disconnected from the shell and design system. The rebuild wires the route page to the existing shell infrastructure and delivers the five moat requirements at the UI layer.
- **Canon Files Impacted:** N/A (implementation)
- **Contracts Impacted:** `CONTENT_WORK_SURFACE_CONTRACT.md` (all §9B moat requirements now partially implemented)
- **Implementation Status:**
  - ✅ Route page: `/app/content/page.tsx` — connected to ContentWorkSurfaceShell, all 4 tabs wired
  - ✅ ContentOverviewView: 3-zone authority dashboard (Authority Status, SAGE Action Queue, Active Status), Active Themes strip, Cross-Pillar Attribution feed, Recent Assets grid
  - ✅ ContentAssetCard v2: CiteMind score as dominant visual anchor (text-2xl, right-aligned, color-coded, labeled), entity tags, EVI pts delta at footer — Moat 1 delivered
  - ✅ SAGE Proposal Cards: competitive gap language, EVI impact range, priority badge, "Create from Brief" CTA — Moat 5 partially delivered
  - ✅ Cross-Pillar Attribution feed: PR coverage, citation detected, pitch sent, AEO score change events with EVI delta — Moat 2 partially delivered
  - ✅ Library: density-adaptive cards with CiteMind as primary, filter panel, pagination
  - ✅ Calendar: full-width month grid, format legend, campaign tags — no errors
  - ✅ Insights: authority summary, top performers, SAGE recommendations — no errors
  - ⬜ Asset Editor (Phase 2): structured section editor, CiteMind passage-level feedback, FAQ component, derivative panel
  - ⬜ Brief Editor (Phase 2): 7-section brief, derivative map, generate draft CTA

(End)
