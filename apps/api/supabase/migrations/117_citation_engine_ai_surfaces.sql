-- 117_citation_engine_ai_surfaces.sql
--
-- Expand the citation_monitor_results.engine CHECK to admit the two AI
-- SEARCH-SURFACE engines that CiteMind Engine 3 now monitors via DataForSEO's
-- `ai_overview` element (SEO_AEO_PILLAR_CANON §4C / CITEMIND_SYSTEM Engine-3
-- surfaces): Bing Copilot and Google AI Overviews.
--
-- The chat engines (chatgpt/perplexity/claude/gemini) call the model APIs
-- directly; these two are SERP-surface answers fetched from DataForSEO on a
-- separate (configurable, default daily) cadence. Same result-row shape, new
-- engine tags. Idempotent.
--
-- APPLY BEFORE deploying the aiSurfaceMonitor code (migration-before-deploy).

ALTER TABLE citation_monitor_results
  DROP CONSTRAINT IF EXISTS citation_monitor_results_engine_check;

ALTER TABLE citation_monitor_results
  ADD CONSTRAINT citation_monitor_results_engine_check
  CHECK (
    engine IN (
      'chatgpt',
      'perplexity',
      'claude',
      'gemini',
      'bing_copilot',
      'google_ai_overview'
    )
  );
