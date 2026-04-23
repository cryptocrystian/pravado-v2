# Pravado Agency API — Parked (Not Wired)

This directory contains Pravado's Agency API route handlers (Fastify). These endpoints are intended to become part of Pravado's public API surface — the endpoints that external agency consumers (including Sapient Digital's AgencyOS, future white-label partners, and direct API customers) will call.

## Current state

- **Not wired into server.ts** — These routes are NOT mounted or activated. The commented-out references in `server.ts` were removed during the AgencyOS extraction on 2026-04-22.
- **Known issues** — Approximately 47 TypeScript errors exist across these files (flagged in earlier sessions). These need resolution before wiring.
- **Uncommitted** — Files in this directory are NOT tracked by git. They will be committed when activation begins, as part of a dedicated API development work effort.

## Activation context

Activation happens as part of Pravado's post-beta API development effort. Scope for activation:

1. Fix the ~47 TypeScript errors
2. Review and update route definitions against the finalized Pravado public API contract
3. Add proper authentication (API key based), rate limiting, and observability
4. Mount in server.ts under `/agency/v1/*` prefix
5. Commit to git as part of a documented API release
6. Publish API documentation for consumers

Activation is not blocked by AgencyOS's extraction. It's a standalone Pravado engineering effort sequenced after Pravado beta launches.

## Why these routes are Pravado's, not Sapient's

Pravado's intelligence layer (SAGE, CRAFT, CiteMind, EVI, journalist database) is exposed to external consumers via Pravado's public API. These routes are the agency-facing surface of that API — endpoints that agency consumers need (clients, retainers, reports, tasks, content, pr, video). Pravado owns and maintains them. Sapient Digital is one consumer among potentially many.

## Reference

- Extraction decision: see DECISIONS_LOG D026
- API architecture: TBD (will be documented when activation begins)
