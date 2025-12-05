/**
 * Content Rewrite Playbook Template (Sprint S15)
 *
 * System playbook for semantic content rewriting
 *
 * NOTE: In S15, this uses deterministic stub logic for rewriting.
 * In S16+, this will integrate with real LLM APIs for intelligent rewriting.
 */

import type { PlaybookDefinition, PlaybookStep } from '@pravado/types';

/**
 * Playbook ID for content rewriting
 */
export const CONTENT_REWRITE_PLAYBOOK_ID = 'CONTENT_REWRITE_V1';

/**
 * Step 1: LOAD_CONTENT
 *
 * Purpose: Load content item and gather rewrite context
 *
 * Inputs:
 * - contentItemId: UUID of content to rewrite
 * - personalityId: UUID of personality (optional)
 * - targetKeyword: Target keyword for optimization (optional)
 * - targetIntent: Search intent (optional)
 *
 * Outputs:
 * - contentItem: Full content item record
 * - personality: Personality profile (if provided)
 * - originalText: Content body text
 *
 * Handler (S15):
 * Fetches content item and personality from database
 */
export const LOAD_CONTENT_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: CONTENT_REWRITE_PLAYBOOK_ID,
  key: 'LOAD_CONTENT',
  name: 'Load Content',
  type: 'DATA',
  config: {
    operation: 'fetch',
    sources: ['content_items', 'personality_profiles'],
  },
  position: 0,
  nextStepKey: 'ANALYZE_QUALITY',
  createdAt: '',
  updatedAt: '',
};

/**
 * Step 2: ANALYZE_QUALITY
 *
 * Purpose: Analyze content quality using S14 quality scoring engine
 *
 * Inputs:
 * - contentItem: From LOAD_CONTENT step
 * - originalText: Content body
 *
 * Outputs:
 * - qualityScore: Overall quality score (0-100)
 * - readabilityScore: Flesch-Kincaid readability score
 * - keywordAlignment: Keyword presence score
 * - topicAlignment: Topic relevance score
 * - qualityAnalysis: Full S14 analysis result
 *
 * Handler (S15):
 * Calls ContentQualityService.analyzeQuality()
 * Uses S14 quality metrics as baseline for improvement tracking
 */
export const ANALYZE_QUALITY_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: CONTENT_REWRITE_PLAYBOOK_ID,
  key: 'ANALYZE_QUALITY',
  name: 'Analyze Quality',
  type: 'AGENT',
  config: {
    agentId: 'quality-analyzer',
    service: 'ContentQualityService',
    method: 'analyzeQuality',
  },
  position: 1,
  nextStepKey: 'REWRITE_CONTENT',
  createdAt: '',
  updatedAt: '',
};

/**
 * Step 3: REWRITE_CONTENT
 *
 * Purpose: Generate rewritten version of content
 *
 * Inputs:
 * - originalText: Content body
 * - qualityAnalysis: From ANALYZE_QUALITY step
 * - personality: Personality profile (optional)
 * - targetKeyword: Target keyword (optional)
 * - targetIntent: Search intent (optional)
 *
 * Outputs:
 * - rewrittenText: Improved content version
 * - appliedImprovements: List of improvements applied
 * - reasoning: Why changes were made
 *
 * Handler (S15 Stub):
 * Deterministic rewrite logic:
 * - Split long sentences (>20 words)
 * - Inject target keyword if missing
 * - Add subheadings for structure
 * - Add transition sentences
 * - Expand thin content (<300 words)
 * - Remove duplicate sentences
 * - Apply personality tone adjustments
 *
 * Future (S16+):
 * Will use LLM with prompt template:
 * ```
 * Rewrite the following content to improve quality and readability.
 *
 * Original Content:
 * {{originalText}}
 *
 * Quality Analysis:
 * - Current Score: {{qualityScore}}
 * - Readability: {{readabilityScore}}
 * - Issues: {{qualityIssues}}
 *
 * Requirements:
 * - Target Keyword: {{targetKeyword}}
 * - Search Intent: {{targetIntent}}
 * - Tone: {{personality.tone}}
 * - Style: {{personality.style}}
 *
 * Apply these improvements:
 * {{suggestedImprovements}}
 *
 * Maintain:
 * - Original meaning and key information
 * - Factual accuracy
 * - Brand voice consistency
 * ```
 */
export const REWRITE_CONTENT_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: CONTENT_REWRITE_PLAYBOOK_ID,
  key: 'REWRITE_CONTENT',
  name: 'Rewrite Content',
  type: 'AGENT',
  config: {
    agentId: 'content-rewriter',
    service: 'ContentRewriteService',
    method: 'stubRewrite',
    prompt: `Rewrite the following content to improve quality and readability.

Original Content:
{{originalText}}

Quality Analysis:
- Current Score: {{qualityAnalysis.score.score}}
- Readability: {{qualityAnalysis.score.readability}}

Requirements:
- Target Keyword: {{targetKeyword}}
- Search Intent: {{targetIntent}}
- Tone: {{personality.profile.tone}}

Apply improvements:
{{qualityAnalysis.suggestedImprovements}}`,
  },
  position: 2,
  nextStepKey: 'ASSEMBLE_RESULT',
  createdAt: '',
  updatedAt: '',
};

/**
 * Step 4: ASSEMBLE_RESULT
 *
 * Purpose: Compute diff, analyze improvements, and assemble final result
 *
 * Inputs:
 * - originalText: Original content
 * - rewrittenText: From REWRITE_CONTENT step
 * - qualityAnalysis: Original quality metrics
 * - appliedImprovements: List of improvements
 *
 * Outputs:
 * - diff: Semantic diff between original and rewritten
 * - improvements: Final improvements list
 * - reasoning: Rewrite reasoning metadata
 * - readabilityBefore: Original readability score
 * - readabilityAfter: New readability score
 * - qualityBefore: Original quality score
 * - qualityAfter: New quality score
 * - rewriteResult: Complete RewriteResult object
 *
 * Handler (S15):
 * - Computes semantic diff using sentence-level comparison
 * - Calculates readability improvement
 * - Estimates quality improvement (stub: +10 points)
 * - Generates reasoning metadata
 * - Assembles final result object
 */
export const ASSEMBLE_RESULT_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: CONTENT_REWRITE_PLAYBOOK_ID,
  key: 'ASSEMBLE_RESULT',
  name: 'Assemble Result',
  type: 'DATA',
  config: {
    operation: 'assemble',
    computeDiff: true,
    computeMetrics: true,
  },
  position: 3,
  nextStepKey: null, // Terminal step
  createdAt: '',
  updatedAt: '',
};

/**
 * Complete playbook definition
 */
export const CONTENT_REWRITE_PLAYBOOK: PlaybookDefinition = {
  id: CONTENT_REWRITE_PLAYBOOK_ID,
  name: 'Content Rewrite V1',
  description: 'Semantic content rewriting with quality improvement tracking',
  version: '1.0.0',
  category: 'content',
  isSystem: true,
  steps: [
    LOAD_CONTENT_STEP,
    ANALYZE_QUALITY_STEP,
    REWRITE_CONTENT_STEP,
    ASSEMBLE_RESULT_STEP,
  ],
  metadata: {
    sprint: 'S15',
    note: 'Uses deterministic stub logic. S16 will add LLM integration.',
    integrations: ['S14_ContentQuality', 'S11_Personality'],
  },
};

/**
 * Export playbook template for registration
 */
export default CONTENT_REWRITE_PLAYBOOK;
