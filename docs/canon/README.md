# PRAVADO v2 — CANON INDEX
Version: v1.6

## Purpose
This index lists every canonical file that must exist, what it's for, and its category.

---

## Canonical UI Target

**The canonical UI application is: `apps/dashboard`**

All UI development, surfaces, and user-facing features MUST be implemented in this single application.

### Rules
- `apps/dashboard` is the ONLY authorized UI application
- Creating a new UI app (e.g., `apps/command-center`, `apps/mobile`) requires a **Canon Amendment PR**
- Canon Amendment PRs must follow the `CHANGE_CONTROL.md` process
- The amendment must justify why a separate app is necessary vs. extending `apps/dashboard`

### Rationale
A single canonical UI app ensures:
- Consistent design system application
- Unified routing and navigation
- Shared component library
- Single source of truth for user experience

---

## A) Governance Canon
These files exist to prevent drift and ensure development discipline:

| File | Purpose |
|------|---------|
| `BOOT_PROMPT.md` | Initial session context for Claude |
| `CLAUDE_CODE_PROMPT.md` | Claude Code specific instructions |
| `CHANGE_CONTROL.md` | Process for modifying canon |
| `DECISIONS_LOG.md` | Record of architectural decisions |
| `CI_GATES_CHECKLIST.md` | Quality gates for CI/CD |
| `SPRINT_ZERO_DEMO_SCRIPT.md` | Demo script for sprint reviews |

---

## B) Product Canon
These files define WHAT Pravado is and HOW it should work:

| File | Purpose |
|------|---------|
| `PRODUCT_CONSTITUTION.md` | Mission, non-negotiables, success definition |
| `SAGE_v2.md` | Strategy mesh specification (S-A-G-E) |
| `AUTOMATE_v2.md` | Execution layer specification |
| `UX_SURFACES.md` | The 7 canonical user-facing surfaces |
| `COMMAND-CENTER-UI.md` | Command Center interaction patterns and styling |
| `CORE_UX_FLOWS.md` | The 7 canonical user flows |
| `DS_v3_PRINCIPLES.md` | Design system principles |
| `DS_v3_1_EXPRESSION.md` | Design tokens and expression |
| `AUTOMATION_MODES_UX.md` | Manual/Copilot/Autopilot UX patterns |
| `AUTOMATION_MODE_CONTRACTS_CANON.md` | Mode semantic + behavioral contracts (authority boundaries) |
| `AI_VISUAL_COMMUNICATION_CANON.md` | AI state, confidence, and motion principles |
| `CONTENT_MODE_UX_THESIS.md` | User mental models per automation mode (Content pillar) |
| `EDITOR_IDENTITY_CANON.md` | What constitutes an editor context; editor vs non-editor boundaries |
| `INFORMATION_DENSITY_HIERARCHY_CANON.md` | Typography minimums, density ceilings, spatial discipline |
| `ACTION_GRAVITY_CTA_CANON.md` | CTA placement, proximity rules, dead-space limits |
| `PLANS_LIMITS_ENTITLEMENTS.md` | Pricing tiers and limits |
| `PR_PILLAR_MODEL.md` | PR pillar operating model (Influence Orchestration) |
| `CONTENT_PILLAR_CANON.md` | Authoritative specification for Content work surface |
| `CONTENT_PILLAR_SYSTEM.md` | Content pillar system model (objects, views, agents, playbooks) |

---

## C) V1 Freeze Contracts
These files define FROZEN behavior for V1 release:

| File | Purpose |
|------|---------|
| `COMMAND_CENTER_CONTRACT.md` | V1 freeze contract for Command Center |
| `COMMAND_CENTER_GOLDEN_FLOW.md` | THE single prioritized user flow |
| `ENTITY_MAP_CONTRACT.md` | Entity Map semantic contract |
| `ORCHESTRATION_CALENDAR_CONTRACT.md` | Calendar semantic contract |
| `EARNED_VISIBILITY_INDEX.md` | EVI calculation and display |
| `ENTITY-MAP-SAGE.md` | Entity Map SAGE-native specification |
| `PR_WORK_SURFACE_CONTRACT.md` | V1 freeze contract for PR Work Surface |
| `PR_INBOX_CONTRACT.md` | V1.1 PR Inbox / Work Queue specification |
| `PR_CONTACT_LEDGER_CONTRACT.md` | V1.1 Contact Timeline / Relationship Ledger specification |
| `PR_PITCH_PIPELINE_CONTRACT.md` | V1.1 Pitch Pipeline specification |
| `CONTENT_WORK_SURFACE_CONTRACT.md` | V1 freeze contract for Content Work Surface |

---

## D) Defensible IP Canon
These files define trade secrets and patent-eligible systems:

| File | Purpose |
|------|---------|
| `SAGE_OPERATING_MODEL.md` | SAGE internal operating model (RESTRICTED) |
| `AUTOMATE_EXECUTION_MODEL.md` | AUTOMATE execution model (RESTRICTED) |
| `EVI_MATHEMATICS.md` | EVI calculation mathematics (RESTRICTED) |
| `INFLUENCE_FIELD_VISUALIZATION.md` | Physics-based visualization (RESTRICTED) |
| `CITEMIND_SYSTEM.md` | CiteMind multi-engine system (RESTRICTED) |
| `PATENT_CLAIMS_DRAFT.md` | Patent claim drafts (CONFIDENTIAL) |
| `TRADE_SECRET_BOUNDARIES.md` | Disclosure classifications (INTERNAL) |
| `EXECUTIVE_NARRATIVE.md` | CMO/CEO/Investor narrative (PUBLIC) |
| `SALES_OBJECTIONS.md` | Sales objection handling (PUBLIC)

---

## Compliance Rule
Any code, component, or feature that does not trace back to a canonical document is considered **drift** and must be either:
1. Justified and added to canon via `CHANGE_CONTROL.md` process
2. Removed or deprecated

---

## Canonical Surfaces (from UX_SURFACES.md)
1. Command Center (Tri-pane)
2. PR Work Surface
3. Content Work Surface
4. SEO Work Surface
5. Orchestration Calendar
6. Analytics & Reporting
7. Omni-Tray (Support)

Any route/page not mapping to these surfaces requires justification.
