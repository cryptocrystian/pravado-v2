# COMMAND CENTER V1 CONTRACT

> **Status:** CANONICAL — V1 FROZEN
> **Authority:** This document freezes Command Center V1 behavior and serves as the integration contract.
> **Classification:** Release Lock — Changes require formal change control + breaking change review
> **Last Updated:** 2026-01-13

---

## 1. Contract Purpose

This document FREEZES Command Center V1 by:

1. Defining the component composition and integration points
2. Establishing behavioral invariants that MUST NOT change
3. Specifying CI guardrails that enforce the contract
4. Documenting known deviations and their disposition

---

## 2. V1 Scope Definition

### 2.1 What V1 Includes

| Component | Status | Contract Document |
|-----------|--------|-------------------|
| **Action Stream** | FROZEN | COMMAND-CENTER-UI.md |
| **Entity Map** | FROZEN | ENTITY_MAP_CONTRACT.md |
| **Calendar Peek** | FROZEN | ORCHESTRATION_CALENDAR_CONTRACT.md |
| **Strategy Panel** | FROZEN | COMMAND-CENTER-UI.md |
| **Golden Flow** | FROZEN | COMMAND_CENTER_GOLDEN_FLOW.md |
| **HoverCard Micro-Brief** | FROZEN | COMMAND-CENTER-UI.md |
| **Action Modal** | FROZEN | COMMAND-CENTER-UI.md |

### 2.2 What V1 Excludes (Deferred to V2)

| Feature | Reason | V2 Priority |
|---------|--------|-------------|
| Full Calendar Page | CalendarPeek sufficient for V1 | Medium |
| Entity Map Temporal Navigation | Complexity | Low |
| Multi-Action Selection | Single-action focus for V1 | Medium |
| Custom Node Types | 6 types sufficient | Low |
| Drag-and-Drop Scheduling | Not a planner | None |

---

## 3. Component Integration Contract

### 3.1 Tri-Pane Layout (FROZEN)

```
┌─────────────────────────────────────────────────────────────────┐
│                      Command Center                              │
├──────────────────┬────────────────────────┬─────────────────────┤
│                  │                        │                     │
│   Action Stream  │  Intelligence Canvas   │   Strategy Panel    │
│                  │                        │                     │
│   • Cards        │  ┌──────────────────┐  │   • EVI Hero       │
│   • CTAs         │  │   Entity Map     │  │   • Driver Rows    │
│   • HoverCard    │  │                  │  │   • Narratives     │
│                  │  │                  │  │                     │
│                  │  └──────────────────┘  │                     │
│                  │                        │                     │
│                  │  ┌──────────────────┐  │                     │
│                  │  │  Calendar Peek   │  │                     │
│                  │  │  (h-[280px])     │  │                     │
│                  │  └──────────────────┘  │                     │
│                  │                        │                     │
└──────────────────┴────────────────────────┴─────────────────────┘
```

### 3.2 Component Width Distribution (FROZEN)

| Viewport | Action Stream | Intelligence | Strategy |
|----------|---------------|--------------|----------|
| Desktop (≥1280px) | 360px fixed | Flex | 320px fixed |
| Tablet (768-1279px) | 320px fixed | Flex | Hidden (drawer) |
| Mobile (<768px) | Full width | Tab-based | Tab-based |

---

## 4. State Coordination Contract

### 4.1 Shared State (FROZEN)

| State | Owner | Consumers | Purpose |
|-------|-------|-----------|---------|
| `hoveredActionId` | Command Center Page | Entity Map | Hover highlighting |
| `executingActionId` | Command Center Page | Entity Map | Pulse animation |
| `selectedAction` | Command Center Page | Action Modal | Modal content |
| `executionStates` | Command Center Page | Action Stream, Modal | Execution feedback |
| `eviFilter` | Command Center Page | Action Stream | Filter by EVI driver |

### 4.2 State Flow Diagram

```
Action Stream                    Entity Map
     │                               │
     │ onHoverActionChange ──────────│──▶ hoveredActionId
     │                               │         │
     │ onPrimaryAction ──────────────│──▶ executingActionId
     │                               │         │
     │                               ◀─────────┘
     │                               highlight/pulse
     │
Strategy Panel                   Calendar Peek
     │                               │
     │ onDriverFilter ───────────────│  (no shared state)
     │         │                     │
     ◀─────────┘                     │
     eviFilter                       │
```

---

## 5. Behavioral Invariants (FROZEN)

### 5.1 Action Stream Invariants

| Invariant | Enforcement |
|-----------|-------------|
| Cards sorted by priority, then confidence | CI check |
| Comfortable mode is default for ≤8 cards | CI check |
| Primary CTA always visible | CI check |
| Hover triggers HoverCard | Manual QA |
| Hover broadcasts `hoveredActionId` | Unit test |

### 5.2 Entity Map Invariants

| Invariant | Enforcement |
|-----------|-------------|
| Zone layout matches SAGE dimensions | CI check |
| Hover highlights affected entities | Unit test |
| Execute triggers pulse animation | Unit test |
| Layout is deterministic (same seed = same positions) | Unit test |
| No navigation on entity click | CI check |

### 5.3 Calendar Invariants

| Invariant | Enforcement |
|-----------|-------------|
| Container height fixed at `h-[280px]` | CI check |
| Click opens modal, not navigation | CI check |
| All items have required fields | Schema validation |
| Status/Mode/Risk display correctly | Manual QA |

### 5.4 Strategy Panel Invariants

| Invariant | Enforcement |
|-----------|-------------|
| EVI is the ONLY top-level KPI | CI check |
| NO action buttons | CI check |
| Driver breakdown sums to 100% | Schema validation |
| Diagnostic only | CI check |

### 5.5 Golden Flow Invariants

| Invariant | Enforcement |
|-----------|-------------|
| Hover → Entity Map highlight coordination | Integration test |
| Execute → Entity Map pulse coordination | Integration test |
| Modal opens on card click | Manual QA |
| No navigation during flow | CI check |

---

## 6. Known Deviations

### 6.1 Calendar: Drawer vs Modal

| Specification | Implementation | Disposition |
|---------------|----------------|-------------|
| Click opens Action Modal | Click opens Drawer | **V1 ACCEPTED** |

**Rationale:** Drawer provides sufficient functionality. Modal migration deferred to V2.

### 6.2 Entity Map: Entity States

| Specification | Implementation | Disposition |
|---------------|----------------|-------------|
| 5-state progression (Invisible → Dominant) | States not fully visualized | **V1 ACCEPTED** |

**Rationale:** Hover/execute highlighting is primary V1 value. Full state visualization is V2.

---

## 7. CI Guardrails

### 7.1 Required Checks

| Check | File | Purpose |
|-------|------|---------|
| `check-command-center-kpis.mjs` | Strategy Panel | No duplicate top-level KPIs |
| `check-entity-map-zones.mjs` | Entity Map | Zone layout matches SAGE |
| `check-calendar-height.mjs` | Calendar | Fixed height enforced |
| `check-strategy-panel-buttons.mjs` | Strategy Panel | No action buttons |
| `check-golden-flow-integration.mjs` | Page | State coordination exists |

### 7.2 Check Implementation

```bash
# Run all Command Center checks
pnpm --filter @pravado/dashboard check:command-center

# Individual checks
node scripts/check-command-center-kpis.mjs
node scripts/check-entity-map-zones.mjs
node scripts/check-calendar-height.mjs
node scripts/check-strategy-panel-buttons.mjs
node scripts/check-golden-flow-integration.mjs
```

### 7.3 CI Enforcement

```yaml
# .github/workflows/command-center-guard.yml
name: Command Center Contract Guard

on:
  pull_request:
    paths:
      - 'apps/dashboard/src/components/command-center/**'
      - 'apps/dashboard/src/app/app/command-center/**'

jobs:
  contract-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm --filter @pravado/dashboard check:command-center
```

---

## 8. File Inventory (V1 Frozen)

### 8.1 Page

| File | Purpose | Frozen |
|------|---------|--------|
| `app/app/command-center/page.tsx` | Main page, state coordination | Yes |

### 8.2 Components

| File | Purpose | Frozen |
|------|---------|--------|
| `components/command-center/TriPaneShell.tsx` | Layout | Yes |
| `components/command-center/ActionStreamPane.tsx` | Left pane | Yes |
| `components/command-center/ActionCard.tsx` | Action cards | Yes |
| `components/command-center/ActionHoverBrief.tsx` | HoverCard content | Yes |
| `components/command-center/IntelligenceCanvasPane.tsx` | Center pane | Yes |
| `components/command-center/EntityMap.tsx` | Graph visualization | Yes |
| `components/command-center/CalendarPeek.tsx` | Calendar widget | Yes |
| `components/command-center/StrategyPanelPane.tsx` | Right pane | Yes |
| `components/command-center/ActionModal.tsx` | Action modal | Yes |

### 8.3 Types

| File | Purpose | Frozen |
|------|---------|--------|
| `components/command-center/types.ts` | TypeScript definitions | Yes |

### 8.4 Contracts

| File | Purpose | Frozen |
|------|---------|--------|
| `contracts/examples/action-stream.json` | Action Stream schema | Yes |
| `contracts/examples/entity-map.json` | Entity Map schema | Yes |
| `contracts/examples/orchestration-calendar.json` | Calendar schema | Yes |
| `contracts/examples/strategy-panel.json` | Strategy Panel schema | Yes |
| `contracts/examples/intelligence-canvas.json` | Intelligence Canvas schema | Yes |

---

## 9. Change Control

### 9.1 V1 Modification Requirements

Any change to frozen files requires:

1. **Breaking Change Assessment** — Does this change the contract?
2. **Canon Update** — Update relevant contract documents
3. **CI Gate Update** — Update or add checks
4. **Release Notes** — Document in CHANGELOG

### 9.2 Allowed V1 Changes

| Change Type | Allowed | Example |
|-------------|---------|---------|
| Bug fixes | Yes | Fix rendering glitch |
| Performance improvements | Yes | Optimize re-renders |
| Accessibility improvements | Yes | Add ARIA labels |
| New optional props | Yes | Add logging callback |
| Behavior changes | NO | Change hover timing |
| Layout changes | NO | Move Strategy Panel |
| State changes | NO | Add new shared state |

### 9.3 V2 Scope

V2 may add (not change V1):

- Full Calendar page
- Additional Entity states visualization
- Multi-action selection
- Enhanced temporal navigation
- Custom node type support

---

## 10. Testing Requirements

### 10.1 Unit Tests

| Component | Test File | Coverage Target |
|-----------|-----------|-----------------|
| EntityMap | `EntityMap.test.tsx` | 80% |
| ActionCard | `ActionCard.test.tsx` | 80% |
| CalendarPeek | `CalendarPeek.test.tsx` | 70% |
| StrategyPanelPane | `StrategyPanelPane.test.tsx` | 70% |

### 10.2 Integration Tests

| Flow | Test File | Coverage |
|------|-----------|----------|
| Golden Flow | `golden-flow.test.tsx` | Hover → Highlight → Execute → Pulse |
| EVI Filter | `evi-filter.test.tsx` | Panel → URL → Stream |

### 10.3 E2E Tests

| Scenario | Coverage |
|----------|----------|
| Load Command Center | Page renders without error |
| Execute Action | Card → CTA → Toast |
| Hover Action | Card → HoverCard → Entity Map highlight |

---

## 11. Compliance Checklist

V1 release MUST satisfy:

**Action Stream:**
- [ ] Cards sorted by priority, then confidence
- [ ] Comfortable mode default for ≤8 cards
- [ ] HoverCard appears on hover with correct content
- [ ] Primary CTA visible and functional
- [ ] Hover broadcasts `hoveredActionId`

**Entity Map:**
- [ ] Zone layout matches SAGE (Authority/Signal/Growth/Exposure)
- [ ] Hover highlighting works via `hoveredActionId`
- [ ] Execute pulse works via `executingActionId`
- [ ] Deterministic layout (same seed = same positions)
- [ ] No navigation on entity click

**Calendar:**
- [ ] Container height fixed at `h-[280px]`
- [ ] Click opens detail view (drawer or modal)
- [ ] All items have required fields
- [ ] Status/Mode badges display correctly

**Strategy Panel:**
- [ ] EVI is the ONLY top-level KPI
- [ ] NO action buttons present
- [ ] Driver breakdown visible and expandable
- [ ] Diagnostic-only (no mutations)

**Golden Flow:**
- [ ] Hover → Entity Map highlight coordination works
- [ ] Execute → Entity Map pulse coordination works
- [ ] Modal/drawer opens on card click
- [ ] No navigation during flow

---

## 12. Revision History

| Date | Version | Change |
|------|---------|--------|
| 2026-01-13 | 1.0 | V1 freeze — Command Center locked for release |

