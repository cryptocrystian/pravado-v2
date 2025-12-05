/**
 * Press Release Generation Playbook Template (Sprint S38)
 * 3-step system playbook for AI-generated press releases
 */

import type { PRGenerationInput } from '@pravado/types';

// ============================================================================
// Playbook Definition
// ============================================================================

export interface PressReleasePlaybookConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: PressReleasePlaybookStep[];
  metadata: {
    category: string;
    tags: string[];
    estimatedDuration: string;
    requiredInputs: string[];
  };
}

export interface PressReleasePlaybookStep {
  id: string;
  name: string;
  description: string;
  type: 'gather_context' | 'generate_draft' | 'optimize_format';
  order: number;
  config: PressReleaseStepConfig;
}

export interface PressReleaseStepConfig {
  timeout?: number;
  retries?: number;
  required?: boolean;
  outputSchema?: Record<string, unknown>;
}

// ============================================================================
// Playbook Template
// ============================================================================

export const pressReleasePlaybookTemplate: PressReleasePlaybookConfig = {
  id: 'pr-release-generator-v1',
  name: 'Press Release Generator',
  description: 'AI-powered press release generation with SEO optimization and narrative angle finding',
  version: '1.0.0',
  steps: [
    {
      id: 'step-1-gather-context',
      name: 'GATHER_CONTEXT',
      description: 'Assemble context from SEO intelligence, content, personality, memory, and brand info',
      type: 'gather_context',
      order: 1,
      config: {
        timeout: 30000,
        retries: 2,
        required: true,
        outputSchema: {
          type: 'object',
          properties: {
            seoKeywords: { type: 'array', items: { type: 'string' } },
            seoOpportunities: { type: 'array' },
            companyFootprint: { type: 'object' },
            personality: { type: 'object', nullable: true },
            industryTrends: { type: 'array', items: { type: 'string' } },
          },
        },
      },
    },
    {
      id: 'step-2-generate-draft',
      name: 'GENERATE_DRAFT',
      description: 'Find narrative angles, generate headlines, and create full press release draft',
      type: 'generate_draft',
      order: 2,
      config: {
        timeout: 60000,
        retries: 1,
        required: true,
        outputSchema: {
          type: 'object',
          properties: {
            angles: { type: 'array' },
            selectedAngle: { type: 'object' },
            headlines: { type: 'array' },
            selectedHeadline: { type: 'object' },
            draft: {
              type: 'object',
              properties: {
                headline: { type: 'string' },
                subheadline: { type: 'string' },
                dateline: { type: 'string' },
                body: { type: 'string' },
                quote1: { type: 'string' },
                quote2: { type: 'string' },
                boilerplate: { type: 'string' },
              },
            },
          },
        },
      },
    },
    {
      id: 'step-3-optimize-format',
      name: 'OPTIMIZE_AND_FORMAT',
      description: 'Apply SEO optimization, readability improvements, tone alignment, and final formatting',
      type: 'optimize_format',
      order: 3,
      config: {
        timeout: 30000,
        retries: 2,
        required: true,
        outputSchema: {
          type: 'object',
          properties: {
            optimizedDraft: { type: 'object' },
            seoSummary: {
              type: 'object',
              properties: {
                primaryKeyword: { type: 'string', nullable: true },
                keywordDensity: { type: 'object' },
                readabilityScore: { type: 'number' },
                suggestions: { type: 'array' },
              },
            },
            embeddings: { type: 'array', items: { type: 'number' }, nullable: true },
          },
        },
      },
    },
  ],
  metadata: {
    category: 'pr-intelligence',
    tags: ['press-release', 'pr', 'media', 'seo', 'content-generation'],
    estimatedDuration: '2-5 minutes',
    requiredInputs: [
      'newsType',
      'announcement',
      'companyName',
    ],
  },
};

// ============================================================================
// Step Handlers
// ============================================================================

export interface StepHandlerContext {
  orgId: string;
  userId: string;
  releaseId: string;
  input: PRGenerationInput;
}

export interface StepResult {
  success: boolean;
  data?: unknown;
  error?: string;
  duration?: number;
}

/**
 * Step 1: Gather Context
 * Assembles all necessary context for PR generation
 */
export async function executeGatherContext(
  context: StepHandlerContext,
  service: { assembleContext: (orgId: string, input: PRGenerationInput) => Promise<unknown> }
): Promise<StepResult> {
  const startTime = Date.now();

  try {
    const generationContext = await service.assembleContext(context.orgId, context.input);

    return {
      success: true,
      data: generationContext,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to gather context',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Step 2: Generate Draft
 * Finds angles, generates headlines, and creates the draft
 */
export async function executeGenerateDraft(
  context: StepHandlerContext,
  generationContext: unknown,
  service: {
    findAngles: (ctx: unknown) => Promise<{ angles: unknown[]; selectedAngle: unknown }>;
    generateHeadlines: (ctx: unknown, angle: unknown) => Promise<{ variants: unknown[]; selectedHeadline: unknown }>;
    generateDraft: (ctx: unknown, angle: unknown, headline: unknown) => Promise<unknown>;
  }
): Promise<StepResult> {
  const startTime = Date.now();

  try {
    // Find narrative angles
    const angleResult = await service.findAngles(generationContext);

    // Generate headline variants
    const headlineResult = await service.generateHeadlines(generationContext, angleResult.selectedAngle);

    // Generate full draft
    const draft = await service.generateDraft(
      generationContext,
      angleResult.selectedAngle,
      headlineResult.selectedHeadline
    );

    return {
      success: true,
      data: {
        angles: angleResult.angles,
        selectedAngle: angleResult.selectedAngle,
        headlines: headlineResult.variants,
        selectedHeadline: headlineResult.selectedHeadline,
        draft,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate draft',
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Step 3: Optimize and Format
 * Applies SEO optimization and final formatting
 */
export async function executeOptimizeFormat(
  context: StepHandlerContext,
  draft: unknown,
  service: {
    calculateSEOSummary: (release: unknown) => unknown;
  }
): Promise<StepResult> {
  const startTime = Date.now();

  try {
    // Calculate SEO summary
    const seoSummary = service.calculateSEOSummary(draft);

    return {
      success: true,
      data: {
        optimizedDraft: draft,
        seoSummary,
      },
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to optimize draft',
      duration: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Playbook Runner
// ============================================================================

export interface PlaybookRunResult {
  playbook: string;
  version: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  status: 'success' | 'failed';
  steps: Array<{
    stepId: string;
    name: string;
    status: 'success' | 'failed' | 'skipped';
    duration: number;
    error?: string;
  }>;
  output?: unknown;
  error?: string;
}

/**
 * Default export for playbook registration
 */
export default pressReleasePlaybookTemplate;
