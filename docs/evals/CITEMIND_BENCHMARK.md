# CiteMind Benchmark Dataset

## Purpose

A regression suite of 10 representative B2B SaaS content URLs with expected CiteMind scores. Run against every deploy to detect scoring drift or regressions in the quality scoring engine.

## Scoring Rubric

CiteMind evaluates content across 6 factors:

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| Entity Density | 20% | Named entities per 1000 words (companies, people, products, standards) |
| Claim Verifiability | 20% | Presence of statistics, studies, specific dates, attributable claims |
| Structural Clarity | 15% | Headers, lists, answer-first paragraphs, scannable format |
| Topical Authority | 20% | Semantic coverage of the target topic cluster |
| Schema Markup | 10% | JSON-LD structured data presence and completeness |
| Citation Pattern Matching | 15% | Matches patterns LLMs prefer to cite (definition-style, stat-rich, authoritative) |

## Gate Thresholds

| Score Range | Gate Status | Meaning |
|-------------|-------------|---------|
| >= 75 | `passed` | Content is citation-ready. Cleared for publish. |
| 55 - 74 | `warning` | Content needs improvement. Publish allowed with acknowledgment. |
| < 55 | `blocked` | Content is not citation-worthy. Publish blocked until remediated. |

## Benchmark Dataset

| # | Content Description | Type | Expected Score | Expected Gate | Key Factors |
|---|-------------------|------|---------------|---------------|-------------|
| 1 | Comprehensive guide to B2B SaaS pricing models with 15+ named companies, statistical benchmarks, and structured comparison tables | article | 82 | passed | High entity density, strong claims, excellent structure |
| 2 | Thought leadership piece on AI in marketing automation with specific vendor comparisons and ROI figures | article | 78 | passed | Strong authority, good citation patterns, verified claims |
| 3 | Technical deep-dive on API rate limiting strategies with code examples, benchmark data, and architecture diagrams | article | 85 | passed | Exceptional structure, high entity density, specific technical claims |
| 4 | Case study: How Acme Corp increased pipeline by 340% using integrated PR+Content strategy with timeline and metrics | article | 76 | passed | Strong claims with attribution, good narrative structure |
| 5 | Industry report on B2B content marketing trends with survey data from 500+ respondents | article | 80 | passed | Statistical depth, entity-rich, authoritative source |
| 6 | Brief blog post on "5 tips for better email subject lines" with generic advice and no data | article | 48 | blocked | Low entity density, unverifiable claims, thin authority |
| 7 | Product announcement for a new feature with marketing language but no comparative data | landing_page | 42 | blocked | Promotional tone, no citations, no verifiable claims |
| 8 | Well-structured FAQ page covering SaaS security compliance (SOC 2, ISO 27001, GDPR) with specific requirements | article | 72 | warning | Good structure and entities, but thin on original claims |
| 9 | Listicle of "10 best project management tools" with brief descriptions and no methodology | article | 52 | blocked | Some entities but no authority, unverifiable rankings |
| 10 | Original research report on developer productivity with controlled study, N=200, specific methodology | article | 88 | passed | Exceptional across all factors — ideal citation target |

## Running the Benchmark

```bash
# For each benchmark item:
# 1. Create or retrieve a content item matching the description
# 2. Trigger scoring
curl -X POST /api/content/items/{item_id}/citeMind-score \
  -H "Authorization: Bearer $TOKEN"

# 3. Retrieve score
curl /api/content/items/{item_id}/citeMind-score \
  -H "Authorization: Bearer $TOKEN"

# 4. Compare overall_score and gate_status against expected values
```

## Tolerance

- Score tolerance: +/- 8 points from expected score
- Gate status: must match exactly (no tolerance)
- If 2+ items change gate status between deploys, investigate before shipping

## Failure Protocol

If the benchmark fails:
1. Identify which factor scores shifted
2. Check for changes in `qualityScoringService.ts` or factor weights
3. If weights were intentionally changed, update this benchmark's expected scores
4. If unintentional, revert and investigate
