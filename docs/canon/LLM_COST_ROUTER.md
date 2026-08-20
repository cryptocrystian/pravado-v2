# LLM COST ROUTER

> **Status:** CANONICAL — **RATIFIED** (architect-approved 2026-08-18)
> **Layer:** Product Canon (governs LLM model selection + inference cost)
> **Classification:** RESTRICTED (cost/margin mechanism)
> **Created:** 2026-08-18 — fills a canon gap: model/cost routing was ad-hoc with no governing spec.

## Why this exists

Inference is a real, variable COGS. Gross margin (canonical floor **70%**, per pricing model) is protected primarily by **routing each LLM task to the least-cost model that still meets its quality bar** — not by raising price. Today this is done ad-hoc: CiteMind hardcodes Haiku, everything else defaults to Sonnet, and model IDs are scattered literals (which caused repeated retired-model-ID incidents — DECISIONS_LOG D-808/826). This canon replaces that with one governed policy.

Supersedes the cost-optimization intent of the non-canon `docs/product/llm_router_v1.md` (which specifies only the _provider_ abstraction and is mislabeled "implemented" for cost routing).

## Non-negotiable principles

1. **One policy, zero hardcoded model IDs in feature code.** All model selection flows through the router's task→tier policy. No `'claude-...'` literals outside the router's env-driven config. (Kills the drift class in D-826.)
2. **Env-driven model IDs.** Every tier's concrete model is read from env at call time (extends the existing `getAnthropicModel()` pattern), so a retired model never strands a callsite.
3. **Least-cost-suitable.** Pick the cheapest tier that clears the task's quality bar — never a bigger model "to be safe."
4. **Quality guardrail via escalation.** If the economy model returns low-confidence/malformed output (per existing confidence signals), escalate once to the next tier. Capped.
5. **Observable.** Every call logs model tier, token counts (incl. cached), and estimated cost → real COGS per feature and per plan tier.
6. **Unified-limit compatible.** The router controls _cost_, not entitlement. Usage limits remain the single per-tier token budget (no per-subsystem quotas).

## Model tiers (env-driven; IDs are examples, not literals)

| Tier                   | Model class  | Env var               | Used for                                                                                                                                                                                |
| ---------------------- | ------------ | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ECONOMY**            | Haiku-class  | `LLM_MODEL_ECONOMY`   | High-volume, low-complexity: CiteMind citation scans, brand-mention detection, classification, extraction, auto-responder detection, entity tagging, routine summarization, field-fills |
| **STANDARD** (default) | Sonnet-class | `LLM_ANTHROPIC_MODEL` | Content generation, pitch composition, SAGE strategy reasoning, briefs, rewrites                                                                                                        |
| **PREMIUM**            | Opus-class   | `LLM_MODEL_PREMIUM`   | Rare, opt-in: complex multi-step reasoning, high-stakes synthesis                                                                                                                       |

## Mechanism

- **Task taxonomy → tier map.** A central `TASK_MODEL_TIER` map (`taskType → tier`) lives in the router. Callers pass a `taskType` on `LlmRequest`; the router resolves tier → env model ID. Default tier = STANDARD if `taskType` unset (safe).
- **Escalation.** Economy failure/low-confidence → one retry at STANDARD; log the escalation.
- **Prompt caching.** Callers mark stable context blocks (system prompts, entity graph, brand voice, engine prompts) cacheable → ~90% off cached input on repeat calls.
- **Batch.** Latency-tolerant task types (overnight content, bulk scans) route to the Batch API (~50% off) when the caller declares non-urgency.
- **Telemetry.** Per call: `{taskType, tier, model, inputTokens, outputTokens, cachedTokens, estCostUsd, orgId, planTier}` → aggregates to real COGS. This validates the margin model and informs the RunPod decision.

## Future-compatible: self-hosting (RunPod) — not now

Once telemetry shows where the volume concentrates, the ECONOMY tier's heaviest tasks (citation scans, classification) can point `LLM_MODEL_ECONOMY` at a self-hosted small/fine-tuned model on RunPod. Because selection is env-driven behind the tier abstraction, this is a **config change, not a rewrite.** Gate on measured cost — do not self-host before the data justifies the ops overhead.

## Non-goals

- Not a provider-router redesign (keep the existing `LlmRouter` provider abstraction + fallback).
- Not multi-provider load balancing.
- Not an entitlement/limit mechanism (that stays the unified token budget).

## Known drift to reconcile on implementation

- Migrate hardcoded model IDs to the policy: `citationMonitor.ts`, `brandMentionDetector.ts`, `siloTaxAudit/index.ts` (Haiku), and fix the **stale** `'claude-3-haiku'` in `insightConflictService.ts`.
- Annotate/retire `docs/product/llm_router_v1.md`'s "implemented" cost claims; point to this canon.
- Add a CI preflight grep forbidding raw `claude-*` model literals in feature code (standing rule from D-826).

## Revision History

| Date       | Version     | Change                                                                       |
| ---------- | ----------- | ---------------------------------------------------------------------------- |
| 2026-08-18 | 0.1 (DRAFT) | Initial spec — fills the model/cost-routing canon gap. Pending ratification. |
| 2026-08-18 | 1.0         | Ratified by architect. Implementation authorized.                            |
