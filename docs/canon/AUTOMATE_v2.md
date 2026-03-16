# PRAVADO v2 — AUTOMATE v2 SPEC
Version: v1.0 (Canon)

## Purpose
AUTOMATE is Pravado's execution and governance layer:
- turns SAGE proposals into tasks
- manages concurrency and cost
- enforces approvals and safeguards
- provides full visibility into execution and results

## Principles
- No silent automation: every action is visible and traceable
- Human-in-the-loop is default; autopilot is guarded
- Guardrails prevent chaos/thrashing and runaway LLM/API costs

## Core Components
1) Task graph / job orchestrator
2) Event semantics (DB queue/event bus implementation acceptable)
3) Executors (agents) per domain
4) Audit logs + telemetry
5) Orchestration Calendar as primary execution surface
6) Entity Map gap → Action Stream record creation (D016)

## Entity Map Action Stream Coherence (D016)
When SAGE detects a new Entity Map gap node, AUTOMATE is responsible for materializing the corresponding Action Stream record. SAGE generates the proposal; AUTOMATE creates the record.

Trigger chain:
- SAGE emits `gap_node_detected` event: `{ entity_id, ring, pillar, proposal_id, confidence }`
- AUTOMATE subscribes and creates Action Stream record
- Initial status: `Priority` if confidence ≥ 0.7, `Pending` otherwise
- AUTOMATE writes `linked_action_id` back to the entity node record

This is an architectural invariant: every Entity Map gap node must have a corresponding Action Stream record. A gap node without `linked_action_id` is a system error. AUTOMATE is the enforcement layer for this invariant, not SAGE.

## Risk and Approval
Actions are classified by:
- externality (internal vs external publish/send)
- risk tier (low/med/high)
- cost class (LLM/API spend)
- compliance requirements (enterprise policy)

Approvals can be:
- none (safe internal)
- confirm (standard)
- chained (enterprise)

## Cost Guardrails
- budgets per org and per period
- caps on concurrent jobs
- LLM router policies by plan/tier
- degradation modes (cheaper model, reduced frequency, queued execution)

## UX Requirements
AUTOMATE must be visible via:
- calendar items: status + dependencies + approvals + logs
- queue processing states
- "why this ran" annotations
- pause/cancel/retry controls (where safe)

## Compliance Checklist
- [ ] Calendar shows scheduled/running/completed with dependencies
- [ ] External actions require explicit approval path by mode/tier
- [ ] Cost guardrails exist and are enforced
