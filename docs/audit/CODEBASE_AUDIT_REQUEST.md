# PRAVADO v2 — CODEBASE AUDIT REQUEST
Version: v1.0
Date: 2026-01-06

## Objective
Perform a comprehensive audit of the existing codebase against the canonical specifications in `/docs/canon/` to determine:
1. What code aligns with canon and should be preserved
2. What code represents drift and should be deprecated
3. Whether to continue with this repo or start fresh

---

## Phase 1: Structural Analysis

### 1.1 Route/Surface Mapping
Map every route in `apps/dashboard/src/app/` to the 7 canonical surfaces defined in `UX_SURFACES.md`:

| Canonical Surface | Expected Routes | Actual Routes Found | Status |
|-------------------|-----------------|---------------------|--------|
| Command Center | `/app` (main) | | |
| PR Work Surface | `/app/pr`, `/app/journalists` | | |
| Content Work Surface | `/app/content` | | |
| SEO Work Surface | `/app/seo` | | |
| Orchestration Calendar | `/app/calendar` or similar | | |
| Analytics & Reporting | `/app/analytics` | | |
| Omni-Tray | Component, not route | | |

**Identify orphan routes** - routes that don't map to any canonical surface:
- List each orphan route
- Assess: is it sub-functionality of a canonical surface, or pure drift?

### 1.2 API Endpoint Mapping
Map API routes in `apps/api/src/routes/` to canonical functionality:
- Which endpoints support canonical flows?
- Which endpoints are orphaned/unused?

---

## Phase 2: Architecture Alignment

### 2.1 SAGE Implementation Check
Per `SAGE_v2.md`, assess whether the codebase has:
- [ ] Signal processing (PR intelligence inputs)
- [ ] Authority measurement (content/entity strength)
- [ ] Growth tracking (distribution/amplification)
- [ ] Exposure measurement (outcomes, CiteMind)
- [ ] Proposal generation with required fields (why, confidence, impact, risk tier, mode, approvals)
- [ ] Cross-pillar event emission
- [ ] Causality tracing ("insight → proposal → execution → outcome")

**Rating**: How much of SAGE exists? (0-100%)
**Quality**: Is what exists aligned with spec or drifted?

### 2.2 AUTOMATE Implementation Check
Per `AUTOMATE_v2.md`, assess whether the codebase has:
- [ ] Task graph / job orchestrator
- [ ] Event bus or queue semantics
- [ ] Domain executors (agents)
- [ ] Audit logs
- [ ] Calendar as execution surface
- [ ] Risk classification (externality, risk tier, cost class)
- [ ] Approval workflows (none/confirm/chained)
- [ ] Cost guardrails (budgets, caps, LLM policies)

**Rating**: How much of AUTOMATE exists? (0-100%)
**Quality**: Is what exists aligned with spec or drifted?

### 2.3 Design System Alignment
Per `DS_v3_PRINCIPLES.md` and `DS_v3_1_EXPRESSION.md`:
- [ ] Check `tailwind.config.ts` for canonical color tokens
- [ ] Check component patterns for tri-pane layout
- [ ] Check for drawer/peek patterns
- [ ] Check for state visualization (proposed → queued → running → done)
- [ ] Assess overall visual quality against "no amateur dashboard" principle

---

## Phase 3: Code Quality Assessment

### 3.1 Test Coverage
- Count test files in `apps/api/tests/` and `apps/api/__tests__/`
- Count test files in `apps/dashboard/tests/`
- Assess: are critical paths covered?

### 3.2 Type Safety
- Check for TypeScript strict mode
- Look for `any` type usage patterns
- Assess overall type discipline

### 3.3 Database Schema
- Review `apps/api/supabase/` for schema
- Map tables to canonical entities
- Identify orphan tables

### 3.4 Drift Indicators
Look for common drift patterns:
- [ ] Commented-out code blocks
- [ ] TODO/FIXME/HACK comments
- [ ] Inconsistent naming patterns
- [ ] Duplicate functionality
- [ ] Dead imports
- [ ] Unused exports

---

## Phase 4: Sprint History Analysis

### 4.1 Recent Sprint Reports
Read the last 5 sprint completion reports and summarize:
- What was the focus?
- Were there repeated issues/rework?
- Signs of circular troubleshooting?

### 4.2 Crisis Indicators
Check for files indicating past crises:
- `GOLDEN_PATH_CRISIS_REALITY_CONFLICTS.md`
- Any "STABILIZATION" or "HARDENING" reports
- Pattern of repeated "fixes" for same areas

---

## Phase 5: Verdict

### 5.1 Quantitative Summary

| Category | Score (0-100) | Notes |
|----------|---------------|-------|
| Route alignment to canon | | |
| SAGE implementation | | |
| AUTOMATE implementation | | |
| Design system alignment | | |
| Test coverage | | |
| Code quality | | |
| **Overall alignment** | | |

### 5.2 Recommendation

Based on the audit, provide ONE of these recommendations:

**A) CONTINUE WITH REPO**
- Overall alignment > 70%
- Drift is isolated and removable
- Core architecture matches canon
- Action: Document what to remove, proceed with cleanup

**B) FRESH START WITH TRANSPLANT**
- Overall alignment 30-70%
- Some valuable code exists (API, schema, utilities)
- Frontend/surfaces are too drifted to salvage
- Action: New repo, transplant verified backend components

**C) COMPLETE FRESH START**
- Overall alignment < 30%
- Drift is pervasive
- More effort to fix than rebuild
- Action: New repo, use existing code only as reference

### 5.3 If Transplanting, List Candidates
For each component worth transplanting:
- File/directory path
- What it does
- Why it's worth keeping
- Any modifications needed

---

## Output
Save this completed audit to: `docs/audit/CODEBASE_AUDIT_RESULTS.md`
