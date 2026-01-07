## Canon Compliance Checklist

> **Required for all PRs** - CI will verify these automatically

- [ ] If I changed any spec/documentation, it is ONLY in `/docs/canon/`
- [ ] `/docs/canon/README.md` is updated to reflect any canon changes
- [ ] If I created a new surface/app, a Canon Amendment PR exists or is linked

### Path Guard

> If this PR touches **restricted paths** (apps/api, supabase, infra, etc.),
> you must include a Work Order reference (`WO-###` or `#issue`) in this PR,
> OR add the label `canon-amendment`.

---

## Canon References
- [ ] /docs/canon/<file> § <section>

## Contract References (if applicable)
- [ ] /contracts/openapi.yaml
- [ ] /contracts/schemas/<schema>.json
- [ ] /contracts/examples/<example>.json

---

## What changed

## Why

## Acceptance Criteria
- [ ]

## Tests / Evidence
- [ ] Unit tests:
- [ ] Contract validation:
- [ ] E2E:
- [ ] Visual regression:

## Drift Check
- [ ] This PR does not change product meaning
  - OR
- [ ] This PR is an AMENDMENT and updates canon accordingly

## Risk / Rollback

(End)
