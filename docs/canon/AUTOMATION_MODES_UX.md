# PRAVADO v2 — AUTOMATION MODES UX
Version: v1.0 (Canon)

## Modes
- Manual: user drives actions; AI assists on demand
- Copilot: AI proposes and drafts; user approves execution
- Autopilot: AI executes within guardrails; approvals required for risky/external actions

## Granularity
Automation mode is configurable per pillar (PR/Content/SEO).

## Safety Requirements
- Autopilot shows scope, caps, approvals, kill switch, audit trail
- All actions are labeled with mode and reasoning

## UX Requirements Per Item
- mode used
- why it exists
- confidence/impact
- approval status
- execution status + logs

## Compliance Checklist
- [ ] autopilot never surprises user
- [ ] enterprise can enforce approval chains
