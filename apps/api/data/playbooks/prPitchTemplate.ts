/**
 * PR Pitch Playbook Template (Sprint S39)
 *
 * System playbook for personalized PR pitch generation
 *
 * This playbook generates personalized pitches for journalists
 * using context from press releases, journalist profiles, and memory.
 */

import type { PlaybookDefinition, PlaybookStep } from '@pravado/types';

/**
 * Playbook ID for PR pitch generation
 */
export const PR_PITCH_PLAYBOOK_ID = 'PR_PITCH_V1';

/**
 * Step 1: GATHER_PITCH_CONTEXT
 *
 * Purpose: Assemble context from multiple sources
 *
 * Inputs:
 * - pressReleaseId: UUID of source press release (optional)
 * - journalistId: UUID of target journalist
 * - sequenceId: UUID of pitch sequence
 * - stepPosition: Position in sequence (1 = initial, 2+ = follow-up)
 *
 * Outputs:
 * - pressRelease: Press release content and metadata
 * - journalist: Journalist profile (name, beat, outlet, tier, bio)
 * - organization: Org context (name, industry)
 * - personality: Brand voice and tone settings
 * - recentInteractions: Previous pitch events with this journalist
 * - sequenceSettings: Sequence configuration
 *
 * Handler:
 * Calls PRPitchService.assemblePitchContext()
 */
export const GATHER_PITCH_CONTEXT_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: PR_PITCH_PLAYBOOK_ID,
  key: 'GATHER_PITCH_CONTEXT',
  name: 'Gather Pitch Context',
  type: 'DATA',
  config: {
    operation: 'fetch',
    sources: [
      'pr_generated_releases',
      'journalists',
      'organizations',
      'agent_personalities',
      'pr_pitch_events',
    ],
    service: 'PRPitchService',
    method: 'assemblePitchContext',
  },
  position: 0,
  nextStepKey: 'GENERATE_PERSONALIZED_PITCH',
  createdAt: '',
  updatedAt: '',
};

/**
 * Step 2: GENERATE_PERSONALIZED_PITCH
 *
 * Purpose: Generate personalized pitch using LLM
 *
 * Inputs:
 * - context: Full pitch context from GATHER_PITCH_CONTEXT
 * - stepTemplate: Subject/body templates for this step
 * - customContext: Optional user-provided context
 *
 * Outputs:
 * - subject: Personalized email subject line
 * - body: Personalized email body
 * - personalizationScore: Score 0-100 for personalization quality
 * - suggestions: Improvement suggestions
 *
 * Handler:
 * Calls PRPitchService.generatePitchPreview()
 *
 * LLM Prompt Template:
 * ```
 * You are an expert PR pitch writer generating a personalized pitch.
 *
 * ## Journalist Profile
 * Name: {{journalist.name}}
 * Beat: {{journalist.beat}}
 * Outlet: {{journalist.outlet}} ({{journalist.outletTier}} tier)
 * Bio: {{journalist.bio}}
 *
 * ## Press Release
 * Headline: {{pressRelease.headline}}
 * Angle: {{pressRelease.angle}}
 * Key Points:
 * {{pressRelease.keyPoints}}
 *
 * ## Company
 * Name: {{organization.name}}
 * Industry: {{organization.industry}}
 *
 * ## Tone
 * {{personality.tone}}
 * Voice: {{personality.voiceAttributes}}
 *
 * ## Previous Interactions
 * {{recentInteractions}}
 *
 * Generate a pitch with:
 * - Subject line (max 60 chars, personalized)
 * - Opening hook that references journalist's beat
 * - Clear value proposition
 * - Social proof or credibility markers
 * - Specific call-to-action
 * - Personalized details
 *
 * Return JSON:
 * {
 *   "subject": "...",
 *   "body": "...",
 *   "personalizationScore": 0-100,
 *   "suggestions": [...]
 * }
 * ```
 */
export const GENERATE_PERSONALIZED_PITCH_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: PR_PITCH_PLAYBOOK_ID,
  key: 'GENERATE_PERSONALIZED_PITCH',
  name: 'Generate Personalized Pitch',
  type: 'AGENT',
  config: {
    agentId: 'pr-pitch-generator',
    service: 'PRPitchService',
    method: 'generatePersonalizedPitchWithLLM',
    prompt: `You are an expert PR pitch writer. Generate a highly personalized pitch email.

## Journalist Profile
Name: {{journalist.name}}
Beat: {{journalist.beat}}
Outlet: {{journalist.outlet}} ({{journalist.outletTier}} tier)
Location: {{journalist.location}}
Bio: {{journalist.bio}}

## Press Release Context
Headline: {{pressRelease.headline}}
Angle: {{pressRelease.angle}}
News Type: {{pressRelease.newsType}}
Key Points:
{{pressRelease.keyPoints}}

## Company Context
Name: {{organization.name}}
Industry: {{organization.industry}}

## Tone Guidance
Tone: {{personality.tone}}
Voice Attributes: {{personality.voiceAttributes}}

## Previous Interactions
{{recentInteractions}}

## Template Guidelines
Subject Template: {{stepTemplate.subject}}
Body Guidelines: {{stepTemplate.body}}

## Task
Generate a personalized pitch with:
1. Subject line (max 60 chars) - reference journalist's beat or outlet
2. Personalized greeting using first name
3. Opening hook that connects to their coverage area
4. Clear value proposition - why this matters to their audience
5. 1-2 social proof points or credibility markers
6. Specific, low-friction call-to-action
7. Professional sign-off

Keep it concise: 150-250 words for initial pitch, 50-100 for follow-ups.

Return valid JSON:
{
  "subject": "...",
  "body": "...",
  "personalizationScore": 0-100,
  "suggestions": [
    {"type": "subject|opening|hook|cta|personalization", "original": "", "suggested": "", "reason": ""}
  ]
}`,
    fallbackEnabled: true,
    temperature: 0.7,
    maxTokens: 1500,
  },
  position: 1,
  nextStepKey: 'STRUCTURE_PITCH_OUTPUT',
  createdAt: '',
  updatedAt: '',
};

/**
 * Step 3: STRUCTURE_PITCH_OUTPUT
 *
 * Purpose: Finalize and structure pitch output
 *
 * Inputs:
 * - subject: Generated subject line
 * - body: Generated body
 * - personalizationScore: Quality score
 * - suggestions: Improvement suggestions
 * - context: Original context
 *
 * Outputs:
 * - pitchPreview: Final GeneratedPitchPreview object
 * - metadata: Generation metadata (timestamps, versions)
 *
 * Handler:
 * Assembles final output structure with all required fields
 */
export const STRUCTURE_PITCH_OUTPUT_STEP: PlaybookStep = {
  id: '',
  orgId: '',
  playbookId: PR_PITCH_PLAYBOOK_ID,
  key: 'STRUCTURE_PITCH_OUTPUT',
  name: 'Structure Pitch Output',
  type: 'DATA',
  config: {
    operation: 'assemble',
    outputSchema: {
      sequenceId: 'string',
      journalistId: 'string',
      stepPosition: 'number',
      subject: 'string',
      body: 'string',
      personalizationScore: 'number',
      suggestions: 'array',
      generatedAt: 'datetime',
    },
  },
  position: 2,
  nextStepKey: null, // Terminal step
  createdAt: '',
  updatedAt: '',
};

/**
 * Complete playbook definition
 */
export const PR_PITCH_PLAYBOOK: PlaybookDefinition = {
  id: PR_PITCH_PLAYBOOK_ID,
  name: 'PR Pitch Generator V1',
  description: 'Personalized PR pitch generation with journalist context',
  version: '1.0.0',
  category: 'pr',
  isSystem: true,
  steps: [
    GATHER_PITCH_CONTEXT_STEP,
    GENERATE_PERSONALIZED_PITCH_STEP,
    STRUCTURE_PITCH_OUTPUT_STEP,
  ],
  metadata: {
    sprint: 'S39',
    note: 'Uses LLM Router with deterministic fallback for pitch generation.',
    integrations: [
      'S38_PressReleaseGenerator',
      'S11_Personality',
      'S10_Memory',
      'S6_MediaGraph',
      'S16_LLMRouter',
    ],
  },
};

/**
 * Export playbook template for registration
 */
export default PR_PITCH_PLAYBOOK;
