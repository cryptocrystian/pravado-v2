# PRAVADO v2 — CANON INDEX
Version: v1.1

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
| `AUTOMATION_MODES_UX.md` | Manual/Copilot/Autopilot modes |
| `PLANS_LIMITS_ENTITLEMENTS.md` | Pricing tiers and limits |

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
