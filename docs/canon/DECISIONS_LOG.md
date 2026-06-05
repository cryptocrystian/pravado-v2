# PRAVADO — DECISIONS LOG

## Purpose

Auditable record of decisions to prevent long-term drift.
Per CHANGE_CONTROL.md: if it is not in canon, it is not a requirement.

---

### Decision Entry Template

- **Date:** YYYY-MM-DD
- **Decision ID:** D###
- **Area:** (SAGE / CRAFT / UX / DS / Plans / Contracts / Infra)
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

---

## D025 — Canon terminology alignment: AUTOMATE → CRAFT

**Date:** 2026-04-22
**Decision owner:** Christian Dibrell (Founder/Architect)
**Classification:** INTERNAL

### Context

Visual inspection on 2026-04-22 confirmed that the shipped Pravado v2 product — marketing site (pravado.io) and authenticated app (app.pravado.io) — consistently uses "CRAFT" as the execution layer name. Canon documentation retained the earlier "AUTOMATE" terminology in multiple files, creating drift between documented architecture and shipped reality.

### Decision

The execution layer canonical name is **CRAFT**. "AUTOMATE" is deprecated as a canon term and is replaced throughout canon documentation. The shipped product does not require changes — it is already on CRAFT. Canon is being brought into alignment with shipped reality.

### Scope of change

- Renamed: `AUTOMATE_v2.md` → `CRAFT_v2.md`
- Renamed: `AUTOMATE_EXECUTION_MODEL.md` → `CRAFT_EXECUTION_MODEL.md`
- Replaced: all current-tense AUTOMATE references in canon prose with CRAFT
- Preserved: historical references that document the original naming choice
- Updated: canon README index and cross-references

### Rationale

CRAFT was chosen over AUTOMATE in an earlier product decision (the decision itself predates this decision log entry and is not documented in detail). "AUTOMATE" implies runaway automation with no human governance; "CRAFT" signals deliberate, governed execution with quality as a first-class concern. The shipped product reflects this positioning, and canon now matches.

### Also captured in this update

Three additional drift items discovered during the same visual inspection are addressed in this commit:

1. **EVI band nomenclature.** Canon specifies bands as At Risk / Emerging / Competitive / Dominant. Shipped homepage shows At Risk / Building / Strong / Elite. This decision DOES NOT reconcile that drift — it is noted here for explicit follow-up. A separate decision (D026 or later) will determine which nomenclature wins.

2. **EVI description scope.** Canon defines EVI as 40% Visibility + 35% Authority + 25% Momentum across all discovery surfaces. Shipped homepage copy narrows EVI to "how prominently your brand appears in AI-generated responses." This decision DOES NOT reconcile that drift — noted for explicit follow-up.

3. **Pricing display format.** Shipped pricing page defaults the monthly/annual toggle to annual-discounted prices ($159/$479/$959), while memory and canon treat the undiscounted monthly prices ($199/$599/$1199) as source-of-truth. This is a merchandising choice, not a price change. Noted for documentation completeness.

### References

- Source visual inspection: `docs/audit/VISUAL_INSPECTION_2026-04-22.md`
- Prior decision introducing CRAFT (if present in DECISIONS_LOG): TBD
- Canon index version bump: v1.9 → v2.0

### Follow-up required

- D026 (future): EVI band nomenclature reconciliation decision
- D027 (future): EVI description scope reconciliation decision
- Silo Tax sunset completion (navigation badge removal, audit page replacement) — tracked in visual inspection report action items

### Canon hygiene — relocation of misfiled Sapient Digital documents

During the D025 drift audit execution, two files in Pravado's canon directory were identified
as belonging to Sapient Digital rather than Pravado:

- `AGENCY_OS_SPEC.md` — spec for Sapient Digital's multi-tenant agency platform
- `VIDEO_PIPELINE_AMENDMENT.md` — Sapient Digital's video pipeline capability (originally
  drafted as an amendment to CITEMIND_SYSTEM.md)

Both files have been relocated to Sapient Digital's repository at
`/home/saipienlabs/projects/sapient-digital/docs/canon/`. The scope exclusion rule added to
Pravado's `README.md` in this same commit formalizes the principle that only Pravado-specific
content belongs in Pravado's canon. Sibling ventures maintain their own canons.

**Architectural decision codified:** Sapient Digital operates as a fully independent venture
under the Saipien Labs umbrella, with distinct brand, distinct customer base, distinct
pricing, and independent canonical documentation. The only shared surface between Pravado
and Sapient is technical infrastructure (Supabase instance). Marketing, positioning,
product offerings, and canon documentation are strictly separated.

**Video add-on pattern:** When Pravado eventually offers a video add-on, it will be sold
under the Pravado brand with Pravado billing. The underlying pipeline capability remains
Sapient's technical responsibility. This establishes the canonical pattern for any future
cross-venture capabilities: Sapient owns technical capabilities, Pravado owns customer
experience, intercompany settlement is handled outside canon.

**Files affected in Pravado canon:** 2 removed from `docs/canon/`; `README.md` modified to
add scope exclusion rule; `DECISIONS_LOG.md` modified (this extension).

**Future work:**

- When Pravado productizes video as a customer-facing add-on, Pravado will draft
  `VIDEO_ADDON.md` describing the add-on product
- When a formal Saipien Labs umbrella canon is established, shared-infrastructure
  decisions currently in Pravado's canon (if any) may be reviewed for relocation
- The scope exclusion rule in `README.md` should be revisited at beta-launch to confirm
  no new drift has crept into canon

---

## D026 — AgencyOS Extraction and Sapient Digital Architectural Principles

**Date:** 2026-04-22
**Status:** Executed
**Supersedes:** Implicit architectural assumption in prior Sapient planning sessions that Pravado and Sapient would share codebase and infrastructure

### Context

During pre-beta work, Claude Code's stop conditions repeatedly surfaced that AgencyOS (Sapient Digital's multi-tenant agency management portal) had been built inside Pravado's monorepo at `apps/agency-os/`, with declared workspace dependencies on four Pravado packages. The architecture originated in an earlier session where "don't fork Pravado" was interpreted as "build everything in one repo," which was an over-correction.

Discovery (executed as read-only work order) confirmed:

- AgencyOS declared but never actually used the four `@pravado/*` workspace dependencies (vestigial coupling)
- No bidirectional coupling (Pravado does not import from AgencyOS)
- AgencyOS uses the shared Supabase project but queries a separate `agency` schema
- AgencyOS has its own auth flow, its own deployment config, its own env vars
- Extraction is mechanical relocation, not complex untangling

### Decisions

**D026.1 — Architecture principle: Ventures share capabilities through public APIs, not infrastructure.**

Saipien Labs ventures do not share Supabase projects, codebases, monorepo workspaces, or authentication instances. They may share capabilities through well-defined public APIs. This principle governs all current and future cross-venture integrations.

**D026.2 — Sapient Digital operates on fully air-gapped infrastructure.**

Sapient Digital runs on its own Supabase project, its own deployment infrastructure, its own repo, its own domain. Complete infrastructure independence is a business model requirement for Saipien Labs (exit flexibility, security boundaries, operational independence) and not negotiable.

**D026.3 — Sapient consumes Pravado's intelligence via public API.**

AgencyOS accesses Pravado's intelligence layer (SAGE, CRAFT, CiteMind, EVI, journalist database) through Pravado's public API as a first-party API consumer. No database access, no code imports, no shared auth. API consumption is bidirectionally compatible with Pravado's planned public API for external developers and white-label partners.

**D026.4 — Extraction executed as file-level relocation to parked state in Sapient repo.**

AgencyOS code, supporting config, Supabase migrations, session notes, and audit reports relocated to `sapient-digital/parked/agency-os/` and `sapient-digital/docs/extraction-archive/`. Activation (creating Sapient's Supabase project, migrating schema, wiring AgencyOS to Pravado's API) is sequenced to begin immediately after Pravado beta launches.

**D026.5 — Pravado's `apps/api/src/routes/agency/` stays in Pravado as the future Agency API surface.**

These routes are Pravado's platform-level API surface for agency consumers, not AgencyOS-specific code. They remain uncommitted and not wired to server.ts pending a dedicated API development effort post-beta. A README in the directory explains context.

### Scope of this extraction (what moved)

From Pravado to Sapient:

- `apps/agency-os/` (entire Next.js app, 81 files, 5,759 LOC)
- `apps/api/supabase/migrations/90_create_agency_schema.sql`
- `apps/api/supabase/migrations/91_seed_agency_demo_data.sql`
- `apps/api/.env.agency`
- `vercel.agency-os.json`
- `AGENCY_OS_SESSION_2.md` (root-level)
- `E2E_AUDIT_REPORT.md` (root-level)

From Pravado, deleted or edited:

- `apps/api/src/server.ts` — removed two commented-out agencyRoutes references
- `apps/api/src/routes/agency/` — retained with new README explaining status

### Scope of activation (future work, not part of this extraction)

- Creation of dedicated Sapient Supabase project
- Migration of `agency` schema and data from shared Supabase to dedicated Sapient Supabase
- Pravado public API development (fix 47 TS errors in routes/agency, wire to server.ts, authentication, rate limiting, documentation)
- AgencyOS frontend updates to consume Pravado API
- Sapient Vercel deployment setup

Timeline: activation begins immediately after Pravado beta launches.

### Why this decision was delayed until now

The original "one repo" architecture was chosen under pressure to avoid forking Pravado, without sufficient consideration of venture studio operating requirements (exit flexibility, infrastructure independence, brand separation). The coupling was partial (vestigial dependencies, no real code sharing) which made extraction tractable but the architectural signal was wrong.

Correcting before Pravado's beta customer acquisition is substantially cheaper than correcting after. Caught during canon hygiene cleanup when Claude Code's stop conditions surfaced the uncommitted agency-os state multiple times in a row.

### Discovery accuracy note

Discovery conducted as a read-only inventory identified AgencyOS as "uncommitted" based on the bulk state of the codebase. Execution revealed five files in `apps/agency-os/` had been tracked in prior commits (`package.json`, three source files from TypeScript fixes, and `vercel.json`). These files are recorded as deletions in this commit; content preserved in Sapient's parked artifacts. Future discovery work orders should verify tracked-file state across the full target subtree, not just the bulk-uncommitted state.

### Files affected in Pravado repo (this commit)

- `docs/canon/DECISIONS_LOG.md` — this D026 entry added
- `apps/api/src/server.ts` — two agencyRoutes references removed
- `apps/api/src/routes/agency/README.md` — new file explaining parked status
- Tracked-file deletions (5 files in `apps/agency-os/` that had been committed in prior Pravado history; content preserved in Sapient's `parked/agency-os/`):
  - `apps/agency-os/package.json`
  - `apps/agency-os/src/app/(agency)/tasks/TasksClient.tsx`
  - `apps/agency-os/src/app/(client)/[clientSlug]/reports/page.tsx`
  - `apps/agency-os/src/app/(client)/[clientSlug]/video/page.tsx`
  - `apps/agency-os/vercel.json`
- Untracked deletions (files never committed to Pravado; simply disappear from working tree):
  - Remainder of `apps/agency-os/` subtree
  - `apps/api/.env.agency`
  - `apps/api/supabase/migrations/90_create_agency_schema.sql`
  - `apps/api/supabase/migrations/91_seed_agency_demo_data.sql`
  - `vercel.agency-os.json`
  - `AGENCY_OS_SESSION_2.md`
  - `E2E_AUDIT_REPORT.md`

## D027 — Audit Funnel Repositioning: Silo Tax → Three-Path EVI Scorecard

**Date:** 2026-04-21 (decided); 2026-04-28 (formally captured to canon)
**Status:** Adopted
**Supersedes:** "Silo Tax Audit" framing in `apps/dashboard/src/app/(marketing)/audit/page.tsx`, `apps/api/src/routes/siloTaxAudit/index.ts`, and any homepage/marketing copy treating Silo Tax as the top-of-funnel acquisition instrument.

### Context

The "Silo Tax" audit at /audit was constructed as a top-of-funnel acquisition instrument that combined two incompatible goals: a credible measurement instrument AND a marketing hook with a bold dollar figure. Those goals pull in opposite directions. Credible measurement wants narrow scope, wide error bars, and "insufficient data" outputs. Marketing hooks want bold numbers, universal applicability, and a CTA. The v1 implementation over-indexed on marketing and broke credibility — a single Haiku call cannot defensibly produce a monthly dollar-loss figure for arbitrary brands across arbitrary categories. The category itself confirms this: Semrush, Profound, Search Atlas, Otterly — all credible AI visibility players ship score-based audits, not dollar calculators. The single tool attempting a dollar-figure approach is a small Mexico-based agency (aiseo.com.mx). The category has moved past the calculator model.

A second strategic problem: the audit, as built, is AEO-centric. It positions Pravado as another entrant in the crowded AI visibility audit category (where Semrush has 300M+ ARR and Profound is VC-scaled). It frames Pravado around a single pillar instead of around its actual differentiation, which is cross-pillar orchestration of PR + Content + AEO/SEO. A Cision/Muck Rack refugee landing on the audit gets an AEO scorecard back and bounces — wrong inference about the product. Same for HubSpot/Contently and Semrush/Profound refugees through different doors. The audit filters out non-AEO-led ICP before they engage with what makes Pravado different.

### Decision

Replace the Silo Tax audit with a three-path EVI scorecard. Three landing pages, one audit instrument, three results-page narratives.

**Audit instrument (shared across all three paths):**
EVI as the primary anchor — `Earned Visibility Index`, decomposed into three pillar sub-scores:

- **PR Authority** — domain authority of citing sites, recency/frequency of earned mentions, named-person quotes vs brand-only mentions. Pravado's 283K-profile media database is a direct asset.
- **Content Authority** — topical coverage breadth/depth, schema completeness, content freshness, topic cluster integrity, external content references.
- **AI Citation Authority** — brand mention rate across engines, unlinked mention handling, entity disambiguation, competitive share-of-voice in AI answers.

EVI is canonical (At Risk / Emerging / Competitive / Dominant per `EARNED_VISIBILITY_INDEX.md`). The orchestration story is told through the variance across the three pillar scores — high variance is the orchestration opportunity, the explicit Pravado value wedge.

The audit produces:

- Top-line EVI score (canonical bands)
- Three pillar sub-scores with status
- Specific gap enumeration per pillar with evidence ("your brand was misattributed to [competitor] in 3 of 5 ChatGPT citation tests")
- Each gap paired with what CRAFT would do about it — remediation preview, not generic product pitch
- Category-relative positioning where calibration data permits ("bottom quartile for B2B SaaS")

**No dollar figures.** No monthly tax, no odometer, no fabricated precision. The CTA is a sales conversation, not a self-serve close. Dollar figures may live later in two specific places:

1. In the sales conversation, where prospect P&L is co-constructed
2. In a paid Pravado feature where first-party data (revenue, traffic, category) makes the math defensible

Neither belongs in a free top-of-funnel scan with no prospect data.

**Three entry paths, one audit:**

| Path             | Buyer                                      | Vocabulary                                                                          | Competitive frame                         |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------------------------------- | ----------------------------------------- |
| `/audit/pr`      | Cision / Muck Rack refugees                | Earned media authority, what your PR work is actually worth beyond placement counts | PR-first; AEO/Content as limiting pillars |
| `/audit/content` | HubSpot / Contently / Marketo refugees     | Content authority, why your content isn't compounding                               | Content-first; PR/AEO as limiting pillars |
| `/audit/ai`      | Semrush / Profound / Search Atlas refugees | AI visibility, where your AEO strategy is blind                                     | AEO-first; PR/Content as limiting pillars |
| `/audit`         | Cold traffic, generic                      | Three-pillar earned visibility                                                      | All three pillars peer-level              |

All four paths run the same audit at the backend. What differs:

- Headline and hook language
- Competitive reference points
- Order in which pillar scores are revealed (entry-pillar first, then the limiting pillars)
- Remediation framing ("what's missing from your current stack" specific to the tool they're likely replacing)
- Social proof relevant to that buyer's category

The buyer who arrived through `/audit/pr` sees their PR pillar first ("your earned media work is doing its job"), then the pivot reveals the underperforming pillars they didn't come in thinking about ("your PR hits aren't compounding because the content they should point to isn't there, and the AI citations that should echo your media moments are going to competitors"). Same scan, same data, different narrative ordering — each native to the entry path.

The entry path is also implicit buyer qualification: a `/audit/pr` lead is a PR-led buyer, sales sequence frames around PR pain. `/audit/ai` leads get a different sequence. Same product, different conversation opener.

### Why this decision

1. **Defensibility.** Every claim is qualitative or relative. EVI is an index (comparison-based). Gap analysis is descriptive. Category comparison is relative. There's no dollar figure to challenge, so there's nothing to catch the instrument lying.
2. **Universality.** Solo consultant or Fortune 500, EVI and gap analysis are meaningful for all of them because they're relative measures. The "doesn't fit all sizes" problem evaporates.
3. **Demonstrates the orchestration thesis by showing it.** Three scores that should correlate and often don't. The variance is the Pravado value wedge — visualizing the silos in silo-breaking terms.
4. **Meets every prospect where they are.** PR-led, content-led, AEO-led — each sees themselves in their entry path AND learns the pillars they weren't thinking about that are part of why they're struggling.
5. **Categorically differentiable.** Pravado isn't competing on the same axis as Semrush or Cision. Cross-pillar earned visibility orchestration is a category no competitor occupies.
6. **Cleaner sales handoff.** "Your EVI is 68, here are the gaps, let's talk about what a remediation program would look like and what it's worth to your specific P&L" is a better first sales call than defending a $37K/mo Silo Tax the prospect is already skeptical of.
7. **Acquisition channel separation.** Three smaller fights you can win beat one large fight you can't. `/audit/pr` lets Pravado win on "Cision alternative" / "Muck Rack alternative" — sharper differentiation, weaker incumbent, lower CPC — while still serving AEO-led traffic on `/audit/ai`.
8. **Phase 2 optionality preserved.** A user-input-driven AI Visibility ROI Projector can ship later as a paid-tier feature or a second free tool. Different defensibility profile (assumptions are the user's), different placement in the funnel.

### What this is not

- This is not a retreat from the Silo Tax concept's core insight (PR/Content/SEO siloing causes authority loss). That insight survives, expressed as the variance across pillar scores.
- This is not "Pravado becomes an AEO tool." The opposite — the audit explicitly de-centers AEO and makes Pravado about cross-pillar orchestration.
- This is not a copy refresh. It is a structural rebuild of the audit instrument and the funnel.

### Halo pillar

The PR pillar is Pravado's best shot at unambiguously defensible best-in-class status. AEO is the most crowded category (Semrush ~$300M ARR, Profound VC-scaled, Search Atlas ~$12M ARR). Content is HubSpot's category. PR software is stale (Cision and Muck Rack are legacy products) and Pravado has structural advantage (283K-profile database + AI-native workflow).

**Implication:** `/audit/pr` is the first acquisition path to invest in to production-quality bar. The PR pillar's standalone excellence halos the entire product. This shapes phasing and engineering allocation.

### Phasing

This is a 60–100 hour effort across all components. Phasing:

- **Phase 1 (audit funnel + three-pillar EVI audit):** Strip Silo Tax, build three-pillar EVI scorecard, ship `/audit/pr` to production-quality bar, ship `/audit/content` and `/audit/ai` with shared template, ship generic `/audit`. Email template flips. Ship before broader marketing site rebalance. **Sprint: docs/sprints/D027-AUDIT-REBUILD/**
- **Phase 2 (marketing site rebalance):** Homepage, Platform, Models, Pricing, About passes informed by Phase 1 acquisition data.
- **Phase 3 (future):** AI Visibility ROI Projector as paid-tier or second free tool — user-input-driven, defensible.

### Recovery note

Commit `c8fcaf7` (2026-04-28) shipped the audit funnel restructure (mechanics: email upfront, rate limit, removed blur gate, EVI canonical bands, Phosphor icons, email template fixes). Those mechanics are correct and stay. The Silo Tax framing in that commit is wrong and is undone by Phase 1 of this decision. The funnel mechanics work is salvaged, not redone.

### Why this decision is being captured to canon now (2026-04-28)

The decision was made in conversation on 2026-04-21 and never written to canon. As a result, the strategic context drifted out of the lead architect's working memory. Commit `c8fcaf7` was generated against the wrong assumption ("Silo Tax framing stays") and pushed to main before the drift was caught. This is the precise failure mode that motivated the 2026-04-28 CLAUDE.md Required Boot Sequence amendment (commit `4cb9fdc`). Going forward, every load-bearing strategic decision lands in `DECISIONS_LOG.md` at the moment it's made, not at some imagined "end of session." The boot sequence reads `DECISIONS_LOG.md` so future sessions inherit the decision automatically.

(End)

## 2026-05-14

- **FOLLOW-UP (Phase 0 Track 0A merge):** RLS policy on `org_members` may have a latent issue per the original "Skip org_members query" workaround comment removed in this PR (`apps/dashboard/src/app/callback/page.tsx`). Service-role `getCurrentUser` sidesteps it for cold-start, but a Phase 1 ticket should audit and fix RLS proper for any future client-side query against `org_members`.

- **DECISION (one-time CI exception):** PR #2 (Phase 0 Track 0A, squash commit `7a95e03`) merged on red CI at 2026-05-14T22:15:50Z. Architect review verified all 6 failing checks (Type Check, Lint, Test, Canon Integrity, Density Guard, Shell Guard) are pre-existing on `main` since commit `b7e8567` (2026-05-07) and unrelated to PR #2's 7 changed files. The cold-start renderer-freeze fix is P0 in production and cannot wait for CI green-up. Future PRs require green CI without exception.

- **DECISION (Phase 0 scope addition):** Track 0D (CI green-up) added to Phase 0 and must close before Tracks 0B and 0C start. Phase 0 exit criteria amended to include "CI green on three consecutive runs over 24h on `main`." See `docs/sprints/PHASE-0-FIRE-BREAK/README.md` (Track 0D to be authored after 0A is fully shipped).

- **OBSERVATION (worth investigating in Track 0D):** `main` has had red CI continuously since 2026-05-07. This means either no merges have happened in 7 days, or merges have routinely occurred on red CI. Either is a cultural/process finding. Track 0D's plan should surface which it was and whether the precedent affects how the green-up is communicated to the team.

(End)

## 2026-05-15

- **OBSERVATION (Track 0D Group 1):** Local-only WIP in `apps/api/src/routes/` for agency-mode features produces ~35 TypeScript errors that do NOT appear in CI (untracked / not in the typecheck path CI runs). Confirmed during Group 1 surface review. Fate decision deferred to Phase 1: complete, archive to `_archive/`, or remove. Tracking only ? not fixed in this PR.

- **DISCOVERY (Track 0D Group 1 A1):** `apps/api/src/routes/auth.ts` GET /me handler had a latent typo: `updatedAt` was sourced from `userData.created_at` (instead of `userData.updated_at`), causing user API responses to return a stale `updatedAt` always matching `createdAt`. Fixed alongside the missing-`email` field. Real bug masked by the typecheck failure on the same struct.

- **DISCOVERY (Track 0D Group 1 B1):** SendGrid webhook endpoint at `POST /api/pr-outreach-deliverability/webhooks/:provider` has been silently dropping events in production. Three root causes: (a) `fastify-raw-body` plugin not installed (the type error surfaced this); (b) the handler fell back to `JSON.stringify(request.body)` when raw body was unavailable ? re-serialized JSON bytes do not match what SendGrid signed, so HMAC verification fails 100% of the time; (c) the route hardcodes `'placeholder-org-id'` at line 471 with a `TODO: Extract from payload or lookup`, so even if signature passed the event would not route to the right org. This PR fixes (a) by installing the plugin and registering it `global:false` with the route opted-in via `config.rawBody:true`, and (b) by returning a loud 500 `RAW_BODY_UNAVAILABLE` when raw body is missing (no silent re-stringify fallback). The hardcoded org-id (c) remains as a follow-up ? flagged as a Phase 1 P0 item for the PR pillar.

(End)

- **FIX (Track 0D Group 3, supabase test mock):** Built shared chainable Supabase query-builder mock at `apps/api/tests/_helpers/supabase-mock.ts` (`createMockQuery(resolvedValue)` ? every builder method is a chainable `vi.fn()`, builder is thenable so `await builder` resolves uniformly). Root cause across 256 failing tests in 31 files was that production code added chain methods (`.gte` / `.lte` / `.range` / `.is` / `.match` / `.in` / `.neq` / `.order`) over time without updating the test mocks; tests still expected single- or two-level chains. A Python transformer matched 4 files (`executiveBoardReportService`, `governanceService`, `riskRadarService`, `unifiedGraphService`) ? partial improvement (e.g., `unifiedGraph` 45/52 passing post-transform). 27 files use mock idioms outside transformer scope and were not refactored in this PR.

- **EXCLUSION (Track 0D Group 3, one-time Phase 0 scope decision):** All 31 failing test files excluded via `apps/api/vitest.config.ts`. Vitest now passes 34 files / 693 tests / exit 0. Full classification list at `docs/tests/PRE-EXISTING-FAILURES-2026-05-14.md` with per-file pass/fail counts, root-cause categorization (22 ? C drifted-expectations + 2 ? A production-bug surface defects + 0 ? B + 0 ? D), and Phase 1 re-enablement protocol. Tracks 0B and 0C exit criteria do **not** require these to pass ? Phase 0 closes when CI green on the scoped set across 3 consecutive runs over 24h.

- **DISCOVERY (Track 0D Group 3 A1):** `apps/api/src/services/unifiedIntelligenceGraphService.ts:9` uses `import crypto from 'crypto'` (default import). Under the current module resolution, Node built-in `crypto` has no default export ? TS1192. Production code itself may still work at runtime (esModuleInterop synthesizes the default), but the typecheck error blocks `tests/unifiedGraphService.test.ts` from loading. Phase 1 ticket: convert to `import { ... } from 'crypto'` named-import form or `import * as crypto from 'node:crypto'`.

- **DISCOVERY (Track 0D Group 3 A2):** `apps/api/src/services/governanceService.ts:1653` iterates a `Map` without `--downlevelIteration` or ES2015+ target ? TS2802. Project root tsconfig has `target: ES2022` so this should work; possibly the test runner's effective target is overridden. Phase 1 ticket: investigate and either refactor to `Array.from(map.entries())` or align test-runner tsconfig.

- **POLICY (Track 0D Group 3 ? going forward):** Re-enablement protocol documented in `docs/tests/PRE-EXISTING-FAILURES-2026-05-14.md`. Each Phase 1 PR that touches an excluded file's production code path must (a) rewrite the test mocks using `createMockQuery()`, (b) verify the test file passes locally, (c) remove the entry from `vitest.config.ts` in the same PR. No further one-time exceptions on red CI after Track 0D closes.

(End)

## 2026-06-02

### Track 0B — Mock containment (PR #8, squash-merge `e4fdd67`)

- **DECISION (Phase 0 Track 0B mock containment — reversal of PR_WIRING_SPRINT_BRIEF Task 5):** The Feb 26 2026 brief authorized a "fallback to sample data" pattern ("If inbox returns 0 items, show the existing mock actions as a 'sample'"). The May 12 audit confirmed this is the exact mechanism producing fabricated journalist relationships, fake EVI narratives, and fabricated Board/Investor PDF templates in production. **No production surface falls back to mock data under any condition.** Empty is honest, sample is dishonest. Reversal lands in PR #8 (Phase 0 Track 0B — Mock containment).

- **DECISION (Phase 0 Track 0B — flag-and-gate strategy):** Eighteen new `*_WIRED` flags appended to `packages/feature-flags/src/flags.ts`, all defaulting to `false`. Each gates one dashboard surface. Each flag flips to `true` only after Phase 1 wires the surface to real data AND the surface passes QA. New `ComingSoonGate` component and `useFeatureFlag` hook at `apps/dashboard/src/components/gates/` and `apps/dashboard/src/hooks/`. Surface scope: Command Center (1), PR (4), Content (1 + 4 nested entry-point routes discovered during implementation), Analytics (6), SEO (4), Settings (2).

- **DECISION (Phase 0 Track 0B — Analytics Reports tab removed from nav):** The Board/Investor PDF was the highest reputational-risk surface in the entire product — a user could generate it with fabricated `EVI 74.2` stats and share with actual investors. Reports nav entry deleted from both `AnalyticsChromeBar.tsx` and `AnalyticsTabBar.tsx`. The route file at `analytics/reports/page.tsx` persists behind `ANALYTICS_REPORTS_WIRED` (default false → `ComingSoonGate`) so saved deep links don't 404, but it's no longer discoverable in product. Phase 1 Workstream 5 decides whether Reports returns and only after a data-confidence threshold (e.g., 60 days of real EVI data + 5+ real placements) is defined.

- **DECISION (Phase 0 Track 0B — required CI check):** `scripts/detect-mock-leaks.sh` runs on every PR (Lint job). Detects the 23 known mock-data identifier patterns leaking out of `apps/dashboard/src` production code, plus a sibling check that page-level files don't import directly from `pr-mock-data.ts` (SAGE journalists tab exempt per Feb brief). Allowlist additions REQUIRE an inline issue-# comment and an architect-approved DECISIONS_LOG entry. Comment-only matches are stripped via an awk filter; tests / stories / `*-mock-data.ts` files are excluded; seven orphan-consumer components allowlisted with reference to issue #10.

- **DISCOVERY (Phase 0 Track 0B — orphan mock-data consumers):** Beyond the 17 surfaces named in spec §4, the mock-leak grep flagged seven component files that consume mock data but are imported only by Phase 0-gated parent pages (`PitchWizard.tsx`, `ExecutiveSummaryReport.tsx`, `BoardInvestorUpdate.tsx`, `CoverageTimeline.tsx`, `CompetitiveSnapshot.tsx`, `BrandVoiceWizard.tsx`, `TemplateLibrary.tsx`) and one dead export (`NewDocumentDropdown.tsx`). They are dead code in Phase 0 (parent surface returns `ComingSoonGate` before invoking them). Tracked by issue #10; Phase 1 rebuilds each against real data and removes the allowlist entry.

- **DISCOVERY (Phase 0 Track 0B — four additional page-level leak surfaces):** Beyond the 17 surfaces named in spec §4, exhaustive grep caught four more user-reachable routes shipping mock data: `/app/pr/pitches/new` (mockJournalists pre-selection), `/app/content/new` (mockBriefs + TemplateLibrary), `/app/content/new/brief/[id]` (mockBriefs lookup), `/app/content/new/template/[id]` (mockTemplates lookup). All four gated in this PR under their pillar's parent flag (`PR_PITCHES_WIRED` and `CONTENT_EDITOR_WIRED`). `mockBriefs` added to the mock-leak grep pattern list.

- **DECISION (Phase 0 Track 0B — hidden routes triage):** Spec §5 calls for a per-route disposition (delete / internal-only / Phase 1 flag) for every authenticated `/app/*` route outside the main nav. Track 0B deletes the two obvious legacy directories (`apps/dashboard/src/app/app/pr-legacy/` — full duplicate of `/app/pr/`; `apps/dashboard/src/app/app/journalists/` — legacy duplicate of `/app/pr/journalists`) and defers the remaining 17 routes (3 internal-only candidates: `admin`, `ops`, `audit`; 14 Phase 1 flag candidates) to issue #11 so each gets a product-owner decision before code touches it. Architect's "no detours" rule applied — the larger sweep would have expanded scope mid-PR.

- **DECISION (Phase 0 Track 0B — `/app/content/[documentId]` real bug fix, not a gate):** The route param was ignored entirely and `mockDocuments[0]` rendered regardless of which ID was visited (audit §6). Per spec, the honest Phase 0 behavior is to return `notFound()` unconditionally — no fetch helper exists yet to look up real documents. Server-component pattern with `isEnabled('CONTENT_EDITOR_WIRED')` gate kept in place so Phase 1 flips the flag rather than re-architecting the file.

- **OBSERVATION (Phase 0 Track 0B — audit findings already resolved by prior cleanup):** The May 12 audit flagged two leaks on `/app/content` (a hardcoded "CONTENT AUTHORITY GAP: AI CITATION COVERAGE" banner and a "1 REVIEW" stale count in the pipeline). Neither string appears in code today. `CONTENT_OVERVIEW_MOCK` in `content-mock-data.ts` is already an empty-state struct (`avgCiteMindScore: 0`, all counts 0, all arrays `[]`). The page now renders honest zeros end-to-end. No edit needed for `/app/content/page.tsx` in this PR.

### Track 0C — UX hygiene (PR #9)

- **DECISION (Phase 0 Track 0C item 1 — SOC 2 trust signal removed):** Per architect directive ("in the plans but cannot claim"), the "SOC 2 compliant" trust signal on `/audit` (rendered by `apps/dashboard/src/components/marketing/AuditForm.tsx`) was replaced with "Encrypted in transit and at rest" — the strongest claim we can defend pre-certification. No other surface or email template in the codebase asserts SOC 2 (verified by grep). When SOC 2 lands, restore the badge surface-by-surface and update this entry.

- **DECISION (Phase 0 Track 0C item 2 — magic-link template scope):** The Supabase magic-link email template lives in the Supabase Dashboard (Authentication → Email Templates), not in code. No PR can change it via code. The audit-claim email at `apps/api/src/routes/siloTaxAudit/index.ts` (`buildAuditClaimEmailHtml`) already ships a light-body (`#f4f4f8` page bg, `#fff` card bg) + brand-header (cyan bottom border + monospaced PRAVADO wordmark) pattern that survives email-client dark-mode handling — verified no dark-on-dark legibility issue there. Phase 0 Track 0C item 2 therefore requires no code change; the Supabase Dashboard side is tracked by issue #12 and needs architect Dashboard access.

- **DECISION (Phase 0 Track 0C item 4 — scope reduction triggered):** Spec §item-4 calls for a full org settings page (display + PATCH form + Leave Org destructive flow) backed by new `/api/v1/orgs/:id` GET + PATCH endpoints. Inspection confirmed `apps/api/src/routes/orgs/` does not exist; the page route 404s. Per the architect's risk-note ceiling ("budget another 4 hours for building [the endpoints]") combined with the page + form + destructive modal work, total scope exceeded the half-day cap. Phase 0 ships READ-ONLY display of org name + created date + role (sourced from the existing `getCurrentUser` activeOrg) so the route returns 200 instead of 404. Form-driven rename + domain edit and the Leave Org destructive flow defer to Phase 1 alongside the backend endpoints — tracked by issue #13.

- **DECISION (Phase 0 Track 0C item 5 — Billing hidden in Phase 0):** Sprint S33.2's BillingPage rendered `NaN` for every usage stat because the usage telemetry pipeline isn't wired. Sibling pages, components, and helpers (`history/`, `invoice/`, `components/`, `lib/billingApi.ts`) stay in place so Phase 1 Workstream 6 can flip the route back on without re-implementation; the page-level route is replaced with a "coming soon" placeholder and the menu entry removed from `CommandCenterTopbar`.

- **DECISION (Phase 0 Track 0C items 6, 7, 8 — topbar cleanup):** Removed in `CommandCenterTopbar.tsx`: (6) the notification bell — non-functional, unread-dot was fabricated; (7) the SAGE / CRAFT / CiteMind chips — looked interactive but only toggled their own visual state, no API call or filter wiring; (8) the "Account" menu entry — duplicated Settings (same href). All return in Phase 1 only when backed by real behavior (real notifications, real filters, distinct Account-vs-Settings purpose).

- **DECISION (Phase 0 Track 0C item 9 — org name in topbar):** The `_orgName` prop's underscore-prefix (signaling intentional unused) was wrong. Renamed to `orgName`, rendered as `/ {orgName}` adjacent to the PRAVADO wordmark on `md:` and above. Consumers (AnalyticsShell, CalendarShell, SEOShell, ContentWorkSurfaceShell, AppShellWrapper) already pass `orgName={session?.activeOrg?.name}` — no consumer changes needed.

- **DECISION (Phase 0 Track 0C item 10 — identity fallback ONLY, per architect scope guard):** `getCurrentUser` returns `fullName: null` whenever Supabase `raw_user_meta_data` is empty, which is the default for magic-link sign-ups. The audit caught the user menu showing literal "User" with no email. Phase 0 Track 0C ships:
  - `getCurrentUser` accepts three name claims (`full_name` / `fullName` / `name`) before returning null.
  - `app/layout.tsx` FALLBACK_USER.fullName changed from literal `'User'` to `null` so the topbar's fallback chain isn't short-circuited.
  - `CommandCenterTopbar` `UserMenu` computes `displayName = userName || emailPrefix || 'You'` (never the ambiguous "User") and surfaces the real email in the dropdown header.
  - Full Supabase metadata plumbing (the wizard's Brand Setup step calls `supabase.auth.updateUser({ data: { full_name } })`) defers to Phase 1 per the architect's explicit scope guard — tracked by issue #14.

- **DECISION (Phase 0 Track 0C item 11 — wizard step 7 single message):** Removed the duplicate empty-state body that contradicted the subtitle ("SAGE is still generating proposals. They'll be ready in your Command Center"). The subtitle now carries one of two honest messages — "X prioritized actions based on your competitive position" when proposals exist, or "Your first proposals are being generated and will appear in your Command Center within a few minutes — no need to wait here" when they don't. The Enter Dashboard button stays.

- **DECISION (Phase 0 Track 0C item 12 — PostHog kill switch):** `PostHogProvider` now requires BOTH `NEXT_PUBLIC_POSTHOG_ENABLED === 'true'` AND `NEXT_PUBLIC_POSTHOG_KEY` non-empty before initializing. `.env.example` defaults `_ENABLED=false` so a stale dev key never auto-captures beta-user events. Production key verification in the PostHog dashboard remains an architect task before flipping `_ENABLED=true`.

(End)

## 2026-06-03

- **GATE SATISFIED (Phase 0 exit):** CI green on 3 consecutive runs over 24h+ on main. Anchor Run 1 at 2026-06-02T20:39:23Z (commit e4fdd67), Run 2 at 2026-06-02T21:55:24Z (commit adb03890), Run 3 at 2026-06-04T18:58:32Z (commit adb03890, workflow_dispatch via `gh workflow run ci.yml --ref main`). Total spread: 46h 19m 9s (≥24h). Phase 0 Fire Break sprint closed. Beta launch unblocked.

- **OBSERVATION (Phase 0.5 scope):** Two pre-existing workflow failures discovered during the 24h watch — `deploy-dashboard.yml` validators typecheck (#15) and `deploy-api.yml` workflow parse failure (#16). Neither blocks the CI gate signal. Both filed as Phase 1 P2 with `area:deploy` label. Phase 0.5 Observability sprint absorbs both.

- **OBSERVATION (scheduled-task Run 3 dispatch failure — operational note):** A scheduled task was armed at fire-at 2026-06-03T20:45:00Z to fire Run 3 in a fresh agent context. The task ran (lastRunAt 2026-06-03T20:45:37Z) but the `gh workflow run` dispatch never landed — no Run 3 visible on main when checked at 2026-06-04T18:57Z. Run 3 was therefore fired manually from this session at 2026-06-04T18:58:32Z. Phase 0.5 should not rely on scheduled-task agents for time-gated CI triggers without verifying their gh-CLI auth context first.

(End)

## 2026-06-05

- **FIX (Track 0D regression, Phase 0.5 Plan 06d):** `fastify-raw-body` plugin removed from `apps/api`; replaced with a hand-rolled `preParsing` raw-body capture (`apps/api/src/lib/captureRawBody.ts`) scoped to the SendGrid webhook route only. **Root cause:** the plugin's `fastify-plugin` declaration required Fastify `^5.x`, but `apps/api/package.json` is on Fastify `4.29.1`. The peer-version check is runtime-only, so `pnpm install`, `pnpm typecheck`, and `pnpm test` all passed, but every `node --import tsx src/index.ts` boot since Track 0D merged (commit `6c27359c`, 2026-05-23) crashed with `FST_ERR_PLUGIN_VERSION_MISMATCH`. Render keeps the previous container alive when a new deploy fails to bind a port, so `/health` returned 200 from stale code and nothing externally signalled the regression. **Last successful deploy SHA before this fix: `b62b43f` (2026-05-15).** Track 0D's API fixes — the SendGrid raw-body hardening itself, the `auth.ts` `updatedAt` typo fix, and the `renderFetch<T>` generic narrowing — had not been live in production for 21 days. The new `captureRawBody` hook decorates `request.rawBody` byte-exactly for HMAC verification and re-streams the buffer so Fastify body parsing continues normally; the route's loud-error path (return 500 with `RAW_BODY_UNAVAILABLE` if the hook didn't run) is preserved — never silent fallback to `JSON.stringify(request.body)`. Plan 06a bundled in: `.github/workflows/deploy-api.yml` deleted (Render auto-deploys; the workflow was redundant + failing YAML parse + generating noise).

- **STRUCTURAL FIX (Phase 0.5 Plan 06d):** Added `API startup smoke test` step to the `Test` job in `.github/workflows/ci.yml`. Boots `apps/api` for 5 seconds with test-placeholder env vars and fails the build if the process exits. Catches the entire class of failure where `typecheck` + `test` pass but the runtime plugin chain crashes at startup. The 5-second window is the minimum viable signal; a richer test that hits `/health` and verifies dep status is filed as a Phase 1 follow-up.

- **OBSERVATION (CI signal calibration):** Track 0D's "13/13 green" exit-gate satisfaction was an artifact of inadequate runtime signal — green did not mean the code actually ran. Future CI signal must include runtime startup verification at minimum (now in place per the structural fix above). Phase 0.5's `/health` endpoints (Plan 03) extend this to runtime dependency verification (Supabase / Resend / Stripe SDKs initialize). Phase 0.5's scheduled CI cron (Plan 04) extends this further to "if the cron doesn't run, we know within hours."

(End)
