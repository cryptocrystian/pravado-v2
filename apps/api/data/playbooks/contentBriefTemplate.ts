/**
 * Content Brief Generation Playbook Template (Sprint S13)
 *
 * System playbook for AI-assisted content brief generation
 *
 * NOTE: In S13, this is a documentation template. Actual execution
 * is simulated in briefGeneratorService with stub outputs.
 * In future sprints (S16+), this will integrate with real LLM APIs.
 */

import type { PlaybookDefinition, PlaybookStep } from '@pravado/types';

/**
 * Playbook ID for brief generation
 */
export const CONTENT_BRIEF_GENERATION_PLAYBOOK_ID = 'CONTENT_BRIEF_GENERATION_V1';

/**
 * Step 1: GATHER_CONTEXT
 *
 * Purpose: Collect and merge all relevant context for brief generation
 *
 * Inputs:
 * - targetKeyword: string
 * - targetIntent: string
 * - contentItem: ContentItem (optional)
 * - seoContext: SEO signals (keywords, opportunities)
 * - memoryContext: Recent interactions and preferences
 * - contentContext: Recent content, clusters, gaps
 * - personality: Personality profile for tone/style
 *
 * Outputs:
 * - mergedContext: Combined context object
 * - seoSignals: Relevant SEO data
 * - contentSignals: Content patterns
 * - memorySignals: User preferences
 *
 * Handler (S13 Stub):
 * Returns merged context object without LLM processing
 */
export const GATHER_CONTEXT_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: CONTENT_BRIEF_GENERATION_PLAYBOOK_ID,
  key: 'GATHER_CONTEXT',
  name: 'Gather Context',
  type: 'DATA',
  config: {
    operation: 'merge',
    sources: ['seoContext', 'memoryContext', 'contentContext'],
  },
  position: 0,
  nextStepKey: 'GENERATE_OUTLINE',
  createdAt: '',
  updatedAt: '',
};

/**
 * Step 2: GENERATE_OUTLINE
 *
 * Purpose: Generate structured outline based on context
 *
 * Inputs:
 * - mergedContext: From GATHER_CONTEXT step
 * - targetKeyword: Primary keyword
 * - targetIntent: Search intent
 * - personality: Tone and style preferences
 *
 * Outputs:
 * - outline: Structured outline object
 *   - title: string
 *   - sections: Array<{heading, description, wordCount}>
 *   - estimatedWordCount: number
 *
 * Handler (S13 Stub):
 * Returns deterministic outline based on keyword and intent
 * Future: Will use LLM with prompt template for outline generation
 */
export const GENERATE_OUTLINE_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: CONTENT_BRIEF_GENERATION_PLAYBOOK_ID,
  key: 'GENERATE_OUTLINE',
  name: 'Generate Outline',
  type: 'AGENT',
  config: {
    agentId: 'outline-generator',
    prompt: `Generate a detailed content outline for: {{targetKeyword}}
Intent: {{targetIntent}}
Tone: {{personality.tone}}

Include:
- Compelling title
- 4-6 main sections with descriptions
- Estimated word counts per section
- Total estimated word count

Context:
{{mergedContext}}`,
  },
  position: 1,
  nextStepKey: 'GENERATE_BRIEF',
  createdAt: '',
  updatedAt: '',
};

/**
 * Step 3: GENERATE_BRIEF
 *
 * Purpose: Generate complete content brief with all details
 *
 * Inputs:
 * - outline: From GENERATE_OUTLINE step
 * - mergedContext: From GATHER_CONTEXT step
 * - targetKeyword: Primary keyword
 * - targetIntent: Search intent
 * - personality: Tone and style preferences
 * - seoContext: SEO signals for optimization
 *
 * Outputs:
 * - brief: Complete brief object
 *   - title: string
 *   - targetKeyword: string
 *   - targetIntent: string
 *   - targetAudience: string
 *   - tone: string
 *   - minWordCount: number
 *   - maxWordCount: number
 *   - outline: Detailed outline object
 *   - seoGuidelines: SEO optimization guidelines
 *   - createdBy: string
 *   - createdAt: string
 *
 * Handler (S13 Stub):
 * Returns comprehensive brief based on outline and context
 * Future: Will use LLM with structured output for full brief generation
 */
export const GENERATE_BRIEF_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: CONTENT_BRIEF_GENERATION_PLAYBOOK_ID,
  key: 'GENERATE_BRIEF',
  name: 'Generate Brief',
  type: 'AGENT',
  config: {
    agentId: 'brief-generator',
    prompt: `Generate a comprehensive content brief for: {{targetKeyword}}

Intent: {{targetIntent}}
Tone: {{personality.tone}}
Style: {{personality.style}}

Outline:
{{outline}}

SEO Context:
{{seoContext}}

Requirements:
- Define target audience
- Specify word count range ({{outline.estimatedWordCount}} +/- 500)
- Include detailed outline with key points per section
- Provide SEO guidelines (primary/secondary keywords, meta description)
- Ensure tone matches personality profile

Memory Context (user preferences):
{{memoryContext}}

Content Context (recent patterns):
{{contentContext}}`,
  },
  position: 2,
  nextStepKey: null,
  createdAt: '',
  updatedAt: '',
};

/**
 * Complete playbook definition
 */
export const CONTENT_BRIEF_GENERATION_PLAYBOOK: PlaybookDefinition = {
  id: CONTENT_BRIEF_GENERATION_PLAYBOOK_ID,
  orgId: 'system', // System playbook
  name: 'Content Brief Generation V1',
  version: 1,
  status: 'ACTIVE',
  steps: [GATHER_CONTEXT_STEP, GENERATE_OUTLINE_STEP, GENERATE_BRIEF_STEP],
  inputSchema: {
    type: 'object',
    properties: {
      targetKeyword: { type: 'string' },
      targetIntent: {
        type: 'string',
        enum: ['informational', 'navigational', 'commercial', 'transactional'],
      },
      contentItem: { type: 'object', nullable: true },
      seoContext: { type: 'object' },
      memoryContext: { type: 'object' },
      contentContext: { type: 'object' },
      personality: { type: 'object', nullable: true },
    },
    required: ['targetKeyword'],
  },
  outputSchema: {
    type: 'object',
    properties: {
      steps: {
        type: 'object',
        properties: {
          GATHER_CONTEXT: { type: 'object' },
          GENERATE_OUTLINE: { type: 'object' },
          GENERATE_BRIEF: { type: 'object' },
        },
      },
    },
  },
  timeoutSeconds: 300,
  maxRetries: 1,
  tags: ['content', 'brief-generation', 'ai-assisted', 'system'],
  createdBy: 'system',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * S13 Implementation Notes:
 *
 * - This playbook is currently executed via simulation in briefGeneratorService
 * - Step handlers return stub/deterministic outputs
 * - No real LLM calls are made in S13
 * - Future sprints will:
 *   - Integrate real LLM APIs (S16)
 *   - Add semantic scoring (S15)
 *   - Support custom playbook templates
 *   - Enable user-defined brief structures
 */
