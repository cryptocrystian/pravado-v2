# Golden Path #2: Crisis, Scenarios, Reality Maps & Insight Conflicts

This guide walks through the **Crisis Intelligence to Conflict Resolution** flow using the demo organization data.

---

## Prerequisites

1. **Migrations applied**: All migrations 0-76 are applied to your Supabase database.
2. **Environment configured**: `.env` file is set up per `DEPLOYMENT_GUIDE.md`.
3. **Demo data seeded**: Run the seed script:
   ```bash
   pnpm --filter @pravado/api seed:demo
   ```
4. **Services running**:
   - API: `pnpm --filter @pravado/api dev` (http://localhost:3001)
   - Dashboard: `pnpm --filter @pravado/dashboard dev` (http://localhost:3000)

---

## Flow Overview

```
Crisis Detection → Scenario Simulations → Orchestration Suites
                                                   ↓
Insight Conflicts ← Reality Maps ← Outcome Analysis
```

This flow demonstrates how Pravado helps organizations prepare for and respond to crises through AI-powered scenario planning and conflict detection.

---

## Step 1: Log In as Demo User

1. Open the dashboard: http://localhost:3000
2. **Login credentials**:
   - Email: `demo-exec@demo.local`
   - Password: (use your Supabase auth setup or bypass for local dev)
3. You should land on the main dashboard.

**What to verify:**
- Dashboard loads without errors
- Organization shows as "Pravado Demo Org"

---

## Step 2: Crisis Dashboard

### 2.1 View Active Incidents

1. Navigate to **Crisis** → **Dashboard** (or **Incidents**)
2. You should see two crisis incidents:

| Incident | Severity | Status | Type |
|----------|----------|--------|------|
| Data Breach Alert - Third Party Vendor | High | Active | Security |
| Negative Social Media Campaign | Medium | Monitoring | Reputation |

### 2.2 Explore the Active Incident

1. Click on **"Data Breach Alert - Third Party Vendor"**
2. View the incident details:
   - **Severity**: High (red indicator)
   - **Status**: Active
   - **Description**: "Potential customer data exposure through vendor compromise."
   - **Detected At**: Recent timestamp

**What to verify:**
- Both incidents appear in the list
- Severity badges display correctly (High = red, Medium = yellow)
- Status indicators show Active/Monitoring states
- Click into incident shows full details

---

## Step 3: Scenario Simulations

Scenario simulations allow the platform to explore "what if" responses to various situations.

### 3.1 View Scenarios

1. Navigate to **Scenarios** → **Simulations** (or **AI Scenarios**)
2. You should see three scenarios:

| Scenario | Type | Status |
|----------|------|--------|
| Market Downturn Response | Crisis | Completed |
| Competitor Product Launch | Competitive | Completed |
| Regulatory Change Impact | Regulatory | Running |

### 3.2 Explore a Completed Scenario

1. Click on **"Market Downturn Response"**
2. View simulation details:
   - **Description**: "Simulates response to 20% market correction"
   - **Status**: Completed
   - **Scenario Run**: Started and completed within 2 hours

### 3.3 Observe a Running Scenario

1. Click on **"Regulatory Change Impact"**
2. Note the in-progress state:
   - **Status**: Running
   - **Scenario Run**: In Progress
   - Description: "Assesses impact of new privacy regulations"

**What to verify:**
- All three scenarios are visible
- Completed scenarios show completion timestamps
- Running scenario shows active/in-progress indicator
- Scenario type badges display correctly

---

## Step 4: Scenario Orchestration Suites

Orchestration suites coordinate multiple scenarios to run together, providing comprehensive analysis.

### 4.1 View Suites

1. Navigate to **Scenarios** → **Orchestration** (or **Suites**)
2. You should see two suites:

| Suite | Status | Description |
|-------|--------|-------------|
| Q4 Crisis Simulation Suite | Completed | Multi-scenario suite for crisis preparedness |
| Product Launch Scenarios | Running | Suite exploring various launch outcomes |

### 4.2 Explore Completed Suite

1. Click on **"Q4 Crisis Simulation Suite"**
2. View suite details:
   - **Status**: Completed
   - **Suite Run**: Shows execution timeline
   - Contains multiple linked scenarios

### 4.3 Observe Running Suite

1. Click on **"Product Launch Scenarios"**
2. Note:
   - **Status**: Running (In Progress)
   - Suite is actively executing its linked scenarios

**What to verify:**
- Both suites appear in the list
- Status indicators show Completed vs Running
- Clicking a suite shows its linked scenarios
- Suite runs display execution timeline

---

## Step 5: Reality Maps

Reality Maps visualize branching outcome possibilities with probabilities, helping decision-makers understand potential futures.

### 5.1 View Reality Maps

1. Navigate to **Reality Maps** (or **Scenarios** → **Reality Maps**)
2. You should see two maps:

| Map | Status | Stats |
|-----|--------|-------|
| Crisis Outcome Tree | Completed | 15 nodes, 14 edges, 8 paths |
| Market Response Scenarios | Generated | 15 nodes, 14 edges, 8 paths |

### 5.2 Explore Crisis Outcome Tree

1. Click on **"Crisis Outcome Tree"**
2. View the reality map visualization:
   - **Root Node**: "Current State" (probability: 1.0)
   - **Child Nodes**: 3 outcome paths
     - Outcome Path 1 (probability: 0.33)
     - Outcome Path 2 (probability: 0.33)
     - Outcome Path 3 (probability: 0.33)
   - **Edges**: Transition arrows with probability labels

### 5.3 Map Parameters

Each map was generated with:
- **Max Depth**: 5 levels
- **Branching Factor**: 3 branches per node
- **Probability Threshold**: 0.1 (minimum probability to include)

**What to verify:**
- Both maps appear in the list
- Node count and edge count are displayed
- Clicking a map shows the tree/graph visualization
- Root node is clearly identified
- Child nodes show probability values
- Edges show transition probabilities

---

## Step 6: Insight Conflicts

The Insight Conflict engine detects when different systems produce contradictory recommendations.

### 6.1 View Conflicts

1. Navigate to **Conflicts** → **Insight Conflicts** (or **Intelligence** → **Conflicts**)
2. You should see two conflicts:

| Conflict | Type | Severity | Status |
|----------|------|----------|--------|
| Conflicting Crisis Severity Assessments | Contradiction | High | Detected |
| Divergent Market Response Recommendations | Divergence | Medium | Analyzing |

### 6.2 Explore High-Severity Conflict

1. Click on **"Conflicting Crisis Severity Assessments"**
2. View conflict details:
   - **Type**: Contradiction
   - **Severity**: High
   - **Status**: Detected
   - **Summary**: "Risk Radar indicates critical severity while Crisis Engine shows medium severity for the same incident."
   - **Source Entities**:
     - Risk Radar (entity: rr-001)
     - Crisis Engine (entity: ce-001)
   - **Affected Systems**: Crisis, Strategy, Executive

### 6.3 Explore Analyzing Conflict

1. Click on **"Divergent Market Response Recommendations"**
2. View:
   - **Type**: Divergence
   - **Severity**: Medium
   - **Status**: Analyzing
   - **Summary**: "Strategic Intelligence recommends aggressive expansion while Scenario Simulations suggest cautious approach."

**What to verify:**
- Both conflicts appear in the list
- Severity indicators show High (red) vs Medium (yellow)
- Status badges show Detected vs Analyzing
- Source entities are listed with system attribution
- Affected systems are identified
- Conflict summaries explain the contradiction clearly

---

## Step 7: End-to-End Flow Verification

The demo data tells a coherent crisis intelligence story:

| System | Data Point | Story Element |
|--------|-----------|---------------|
| Crisis | Data Breach (Active) | Current incident requiring response |
| Crisis | Social Media Campaign (Monitoring) | Secondary concern being tracked |
| Scenarios | Market Downturn Response | Completed "what if" analysis |
| Scenarios | Regulatory Change Impact | Active simulation running |
| Suites | Q4 Crisis Simulation Suite | Comprehensive crisis preparedness completed |
| Suites | Product Launch Scenarios | Ongoing suite execution |
| Reality Maps | Crisis Outcome Tree | Visualized decision paths |
| Conflicts | Severity Assessment Contradiction | System disagreement requiring resolution |
| Conflicts | Market Response Divergence | Competing recommendations to reconcile |

---

## Step 8: Cross-Reference with Golden Path #1

The crisis and scenario data connects to the executive intelligence flow:

1. **Crisis incidents** feed into the **Command Center** (GP#1 Step 3)
2. **Scenario outcomes** inform **Unified Narratives** (GP#1 Step 4)
3. **Insight conflicts** require attention from **Executive Digests** (GP#1 Step 5)
4. **Reality Map insights** shape **Strategic Intelligence** (GP#1 Step 7)

Navigate back to the Exec Command Center and observe:
- Crisis Status indicator shows the active incident
- Recent Activity shows scenario completions
- Health Score may be affected by conflicts

---

## Simulation Test (Optional)

To verify AI generation works:

1. Navigate to **Scenarios** → create a **New Scenario**
2. Enter:
   - Name: "Test Scenario"
   - Description: "Testing AI simulation"
   - Type: Crisis
3. Click **Run Simulation**
4. Observe:
   - Loading state appears
   - Simulation starts (if LLM is configured)
   - Or stub response if LLM_PROVIDER=stub

---

## Reality Map Generation Test (Optional)

1. Navigate to **Reality Maps** → click **Generate New Map**
2. Configure:
   - Link to a completed scenario
   - Set depth and branching parameters
3. Click **Generate**
4. Observe:
   - Map generates with nodes and edges
   - Probabilities are assigned
   - Visualization renders

---

## Success Criteria

- [ ] All crisis pages load without errors
- [ ] Both incidents visible with correct severity/status
- [ ] Scenarios show running and completed states
- [ ] Orchestration suites display linked scenarios
- [ ] Reality maps render with node/edge visualization
- [ ] Insight conflicts show source attribution
- [ ] Cross-references to Exec flow are valid
- [ ] No console errors in browser dev tools

---

## Troubleshooting

**No crisis data showing:**
- Verify seed script ran successfully
- Check API logs for database errors
- Confirm org_id matches in the database

**Scenarios not loading:**
- Check `ai_scenario_simulations` table in Supabase
- Verify `ai_scenario_runs` are linked correctly

**Reality maps not rendering:**
- Check `reality_map_nodes` and `reality_map_edges` tables
- Verify parent-child relationships are correct

**Conflicts missing:**
- Check `insight_conflicts` table
- Verify `source_entities` JSON is valid

---

## Next Steps

After completing this flow:
1. Review both Golden Paths for complete coverage
2. Complete the **UAT Checklist** in `docs/UAT_CHECKLIST_V1.md`
3. Run through both paths with a fresh seed to verify repeatability
