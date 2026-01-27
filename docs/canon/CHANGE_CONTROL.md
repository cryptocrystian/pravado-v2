# PRAVADO — CHANGE CONTROL (CANON AMENDMENTS)

## Purpose
Prevent context drift by making product truth explicit, versioned, and enforced.

## Canon Rule
- /docs/canon/* is the single source of truth.
- If it is not in canon, it is not a requirement.

## When a Canon Amendment is Required
A PR MUST be labeled `AMENDMENT:` if it changes:
- product scope or behavior
- SAGE/AUTOMATE semantics
- UX surfaces or flows
- DS v3/v3.1 principles
- automation modes / approval chains
- plans/entitlements
- JSON contracts (OpenAPI/schemas/examples)

## Amendment PR Requirements
Include a section titled **"Amendment Summary"** with:
- What changed
- Why
- Impacted canon files
- Impacted UX surfaces
- Impacted contracts
- Migration notes (if any)

## Two-Way Consistency Rule
- If implementation changes require canon updates: update canon in the same PR.
- If canon changes require implementation updates: either implement in same PR or create linked issues.

## Drift Stop Rule
If any contributor detects canon/implementation mismatch:
- Stop feature expansion.
- File an issue tagged `drift`.
- Decide: align implementation OR amend canon.

## Acceptance Criteria Rule
No sprint work begins without written acceptance criteria in the issue.

(End)
