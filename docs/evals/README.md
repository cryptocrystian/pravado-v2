# PRAVADO Evaluation Framework

## Overview

Pravado uses two evaluation tracks to ensure production quality:

| Track | Purpose | Type | Frequency |
|-------|---------|------|-----------|
| **Track 1 — QA Functional** | Verify CRUD, auth, routing, and integrations work correctly | Automated (unit + integration + E2E) | Every commit / PR |
| **Track 2 — Intelligence Quality** | Verify that SAGE, CiteMind, and EVI produce meaningful, accurate outputs | Semi-automated benchmarks + human rubrics | Every deploy + weekly human review |

## Track 1 — QA Functional

Standard software testing. Run with:

```bash
pnpm test                              # All unit tests
pnpm --filter @pravado/api test        # API tests only
pnpm --filter @pravado/dashboard test  # Dashboard tests only
```

**Passing** means: zero test failures, zero TypeScript errors (`pnpm typecheck`), zero lint errors (`pnpm lint`).

## Track 2 — Intelligence Quality

Intelligence outputs are non-deterministic. We evaluate them with:

### 2a. CiteMind Benchmark (`CITEMIND_BENCHMARK.md`)
A regression suite of 10 test URLs with expected scores. Run against every deploy to catch scoring drift. Automated — compare actual scores against expected thresholds.

### 2b. SAGE Eval Rubric (`SAGE_EVAL_RUBRIC.md`)
Human evaluation of SAGE proposal quality across 4 dimensions. Rated weekly during beta. Semi-automated — proposals are generated automatically, ratings are human.

### 2c. EVI Baseline Protocol (`EVI_BASELINE_PROTOCOL.md`)
Establishes an EVI baseline at org creation and measures delta at 2-week intervals. Automated measurement, human interpretation of trends.

## How to Run Track 2

### CiteMind Benchmark
1. Ensure `ENABLE_CITEMIND=true` in feature flags
2. POST each benchmark URL to `/api/content/items/:id/citeMind-score`
3. Compare returned `overall_score` and `gate_status` against expected values in `CITEMIND_BENCHMARK.md`
4. **Passing**: all 10 URLs match their expected gate status (pass/warn/block)

### SAGE Eval
1. Generate proposals for a test org: `GET /api/command-center/action-stream`
2. Rate each proposal using the rubric in `SAGE_EVAL_RUBRIC.md`
3. Log ratings in the weekly log table
4. **Passing**: average score across all dimensions >= 3.0 / 5.0

### EVI Baseline
1. Follow the protocol in `EVI_BASELINE_PROTOCOL.md` to establish a baseline
2. Re-measure at 2-week intervals
3. **Passing**: delta is within expected thresholds or explainable by user actions

## When "Passing" Means Ship

A deploy is cleared when:
- Track 1: All automated tests pass, zero TS errors, zero lint errors
- Track 2a: CiteMind benchmark scores match expected gate statuses
- Track 2b: Latest SAGE eval average >= 3.0 (weekly check, not per-deploy)
- Track 2c: EVI delta is within thresholds (bi-weekly check, not per-deploy)
