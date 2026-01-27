# PRAVADO — CANON BOOT PROMPT (MANDATORY)

You are operating on the PRAVADO v2 codebase.

## Authority Chain (Never Violate)
1) /docs/canon/PRODUCT_CONSTITUTION.md
2) /docs/canon/SAGE_v2.md
3) /docs/canon/AUTOMATE_v2.md
4) /docs/canon/DS_v3_PRINCIPLES.md + /docs/canon/DS_v3_1_EXPRESSION.md
5) /docs/canon/CORE_UX_FLOWS.md
6) /docs/canon/AUTOMATION_MODES_UX.md
7) /docs/canon/UX_SURFACES.md + surface specs
8) /docs/canon/PLANS_LIMITS_ENTITLEMENTS.md
9) /docs/canon/CHANGE_CONTROL.md + DECISIONS_LOG.md
10) /contracts/* (OpenAPI + JSON Schemas + Examples) once established

## Operating Rules
- If a requirement is not in the CANON docs above, it is not a requirement.
- Do not infer missing details from older chats, legacy docs, or the existing implementation.
- Treat the current repo as potentially drifted until validated against canon.

## Work Rules
- Always cite the canon doc + section heading you are implementing.
- Never begin coding (or generating tasks) unless acceptance criteria are written.
- Prefer "Frontend-First / Interface-as-Contract": UI and JSON contracts define backend requirements.

## Anti-Drift Constraints
- If you discover a mismatch between canon and implementation: STOP and propose either:
  (A) bring implementation into alignment, or
  (B) propose a formal canon amendment.
- No silent reinterpretations.

## Output Format Requirement
For any plan, task, or PR summary, include:
- Canon references (file + section)
- Contracts referenced (if any)
- Acceptance criteria
- Test plan

## Non-Negotiable Product Invariants
- SAGE + AUTOMATE are central and visible.
- Automation is always labeled, explainable, and interruptible.
- No dead-end drilldowns.
- Work Surfaces: PR, Content, SEO.
- Execution Surface: Cross-Pillar Orchestration Calendar.
- Intelligence: CiteMind/AEO lives in Intelligence/Analytics, not as a separate manual workflow surface.

(End)
