# SAGE Proposal Evaluation Rubric

## Purpose

Human evaluation rubric for assessing the quality of SAGE-generated action proposals. Used during beta to track proposal quality trends as data grows and the system matures.

## Evaluation Dimensions

### 1. Relevance (1-5)

Does the proposal address a real opportunity or problem for this org?

| Score | Definition |
|-------|-----------|
| 1 | Completely irrelevant — proposes action on a topic/journalist/keyword the org has no connection to |
| 2 | Tangentially related — connected to the org's industry but not their specific strategy or competitive position |
| 3 | Relevant — addresses a real area of the org's business, but may not be timely or urgent |
| 4 | Highly relevant — targets a clear gap or opportunity aligned with the org's current priorities |
| 5 | Precisely targeted — identifies a time-sensitive opportunity that directly impacts the org's competitive position |

### 2. Specificity (1-5)

Is the proposal actionable without additional research?

| Score | Definition |
|-------|-----------|
| 1 | Completely vague — "improve your content strategy" with no specifics |
| 2 | Direction only — identifies the area but not the specific action ("you should pitch more journalists") |
| 3 | Partially specific — names the what but not the how ("pitch TechCrunch about your AI feature") |
| 4 | Actionable — includes who/what/when/why, a human could execute within 1 hour |
| 5 | Execution-ready — includes specific journalist, angle, timing rationale, and draft content or talking points |

### 3. Prioritization (1-5)

Is the priority level (critical/high/medium/low) and EVI impact estimate accurate?

| Score | Definition |
|-------|-----------|
| 1 | Wildly miscalibrated — marks routine tasks as critical, or ignores urgent opportunities |
| 2 | Noticeably off — priority is 1-2 levels away from what a human would assign |
| 3 | Reasonable — priority is defensible even if a human might adjust it slightly |
| 4 | Well-calibrated — priority and EVI impact estimate align with human judgment |
| 5 | Expert-level — priority accounts for timing, competitive dynamics, and cross-pillar compounding effects |

### 4. Novelty (1-5)

Does SAGE surface insights a human wouldn't find on their own?

| Score | Definition |
|-------|-----------|
| 1 | Obvious — any marketer would see this without a tool ("your blog hasn't been updated in 3 months") |
| 2 | Low novelty — surfaces known information in a slightly more organized way |
| 3 | Moderate — connects two data points that might take a human 30+ minutes to correlate |
| 4 | High — identifies a cross-pillar opportunity (e.g., journalist covering topic where org has content gap + declining keyword) |
| 5 | Breakthrough — surfaces a non-obvious competitive insight that changes the org's strategy |

## Scoring Process

1. Pull the latest 10 proposals for a test org: `GET /api/command-center/action-stream`
2. For each proposal, rate all 4 dimensions using the rubric above
3. Record scores in the weekly log table below
4. Calculate averages per dimension and overall

## Passing Threshold

- **Per-dimension minimum**: 2.5 average (anything below indicates a systematic problem)
- **Overall average minimum**: 3.0 (sum of all dimension averages / 4)
- **Target for production exit**: 3.5 overall average sustained over 4 consecutive weeks

## Weekly Log Table

Copy this template for each weekly evaluation session:

```
## Week of YYYY-MM-DD
Evaluator: [name]
Org: [test org name]
Data age: [days since onboarding]

| Proposal ID | Pillar | Relevance | Specificity | Prioritization | Novelty | Notes |
|-------------|--------|-----------|-------------|----------------|---------|-------|
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |

**Dimension Averages:**
- Relevance: X.X
- Specificity: X.X
- Prioritization: X.X
- Novelty: X.X
- **Overall: X.X**

**Observations:**
- [What improved since last week?]
- [What degraded?]
- [Any systematic patterns?]
```

## Trend Tracking

After 4+ weeks of data, look for:
- **Improving Relevance**: Indicates signal ingestors are capturing better data
- **Improving Specificity**: Indicates prompt engineering improvements are working
- **Improving Novelty**: Indicates cross-pillar signal correlation is improving
- **Declining any dimension**: Investigate immediately — check for data quality issues, prompt drift, or signal source changes
