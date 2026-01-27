# PRAVADO — CI GATES CHECKLIST

This checklist defines the minimum enforcement required to prevent drift.

## Canon Integrity
- Canon files are the only source of product truth.
- Any product-meaning changes require AMENDMENT process.

## Contract Integrity
- API responses validate against JSON Schema.
- Examples used by UI mocks remain in /contracts/examples.

## UI Integrity
- Core surfaces render from mock JSON (smoke tests):
  - Command Center tri-pane
  - Orchestration Calendar
  - Analytics & Reporting
  - PR journalist profile + filters
  - Mode switching indicators

## UX Invariants
- Automation is labeled, explainable, interruptible.
- Drilldowns never dead-end.
- Calendar items map to real execution units.

## Quality
- Visual regression baselines exist for:
  - Command Center
  - Calendar (week view)
  - Analytics overview

(End)
