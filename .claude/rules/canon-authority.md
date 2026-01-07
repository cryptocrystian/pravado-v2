# Canon Authority Rule

## Prime Directive

**Canon is the ONLY source of truth for PRAVADO product specifications.**

## Canon Location

All canonical specifications are located in: `/docs/canon/`

## Required Reading Order

Before any product-related work, read the canon index:
1. `/docs/canon/README.md` - Canon index and reading order

## Canon Documents

The following documents constitute PRAVADO canon:

| Document | Authority |
|----------|-----------|
| `PRODUCT_CONSTITUTION.md` | Product philosophy, pillars, user model |
| `SAGE_v2.md` | AI interaction framework |
| `AUTOMATE_v2.md` | Automation modes and orchestration |
| `UX_SURFACES.md` | Application surface definitions |
| `CORE_UX_FLOWS.md` | User journey specifications |
| `DS_v3_PRINCIPLES.md` | Design system foundation |
| `DS_v3_1_EXPRESSION.md` | Visual expression guidelines |
| `AUTOMATION_MODES_UX.md` | Automation UX patterns |
| `PLANS_LIMITS_ENTITLEMENTS.md` | Billing and feature gating |

## Conflict Resolution

When information conflicts between sources:

1. **Canon ALWAYS wins** - If a non-canon document contradicts canon, follow canon
2. **Flag conflicts** - Do not silently reconcile; explicitly flag the conflict
3. **Never use `docs/_archive/`** - Archived docs are historical only, never authoritative

## What Canon Is NOT

The following are NOT canon and should not inform product decisions:

- `docs/_archive/*` - Archived sprint reports and legacy docs
- `docs/playbooks/` - Implementation playbooks (operational, not canonical)
- `docs/agents/` - Agent configurations (operational, not canonical)
- `docs/product/` - Legacy product docs (superseded by canon)
- Sprint reports anywhere - Historical artifacts only

## Enforcement

When encountering ambiguity:
1. Check canon first
2. If canon is silent, ask for clarification
3. If non-canon contradicts canon, follow canon and flag the conflict
4. Never synthesize "best of both" - canon is authoritative

## Example Conflict Handling

```
CONFLICT DETECTED:
- Canon (SAGE_v2.md) states: "All AI actions require proposal approval"
- Legacy doc (S89_*.md) states: "AI can auto-execute low-risk actions"

RESOLUTION: Follow canon. AI actions require proposal approval.
FLAG: Legacy doc S89 contains outdated AI behavior specification.
```
