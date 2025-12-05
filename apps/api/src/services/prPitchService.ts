/**
 * PR Pitch Service (Sprint S39)
 * Personalized PR pitch and outreach sequence engine
 *
 * Features:
 * - Context assembly from press release, journalist profile, memory
 * - Personalized pitch generation with journalist-specific hooks
 * - Multi-step sequence management
 * - Contact status tracking with event logging
 * - LLM-powered personalization with fallback templates
 */

import { EventEmitter } from 'events';

import type {
  CreatePRPitchSequenceInput,
  CreatePRPitchStepInput,
  GeneratedPitchPreview,
  GeneratePitchPreviewInput,
  ListPRPitchContactsQuery,
  ListPRPitchSequencesQuery,
  PitchSuggestion,
  PRPitchContact,
  PRPitchContactRecord,
  PRPitchContactStatus,
  PRPitchContactWithJournalist,
  PRPitchContext,
  PRPitchEvent,
  PRPitchEventRecord,
  PRPitchEventType,
  PRPitchSequence,
  PRPitchSequenceRecord,
  PRPitchSequenceSettings,
  PRPitchSequenceStats,
  PRPitchSequenceWithSteps,
  PRPitchStep,
  PRPitchStepRecord,
  UpdatePRPitchSequenceInput,
  UpdatePRPitchStepInput,
} from '@pravado/types';
import {
  transformPRPitchContactRecord,
  transformPRPitchEventRecord,
  transformPRPitchSequenceRecord,
  transformPRPitchStepRecord,
} from '@pravado/types';
import type { LlmRouter } from '@pravado/utils';
import type { SupabaseClient } from '@supabase/supabase-js';

// Event emitter for pitch generation progress
export const prPitchEmitter = new EventEmitter();

// ============================================================================
// Service Options
// ============================================================================

interface PRPitchServiceOptions {
  debugMode?: boolean;
}

// ============================================================================
// Default Settings
// ============================================================================

const DEFAULT_SEQUENCE_SETTINGS: PRPitchSequenceSettings = {
  sendWindow: { startHour: 9, endHour: 17, timezone: 'America/New_York' },
  followUpDelayDays: 3,
  maxAttempts: 3,
  excludeWeekends: true,
};

// ============================================================================
// Main Service Class
// ============================================================================

export class PRPitchService {
  private supabase: SupabaseClient;
  private llmRouter: LlmRouter | null;
  private debugMode: boolean;

  constructor(
    supabase: SupabaseClient,
    llmRouter?: LlmRouter,
    options: PRPitchServiceOptions = {}
  ) {
    this.supabase = supabase;
    this.llmRouter = llmRouter || null;
    this.debugMode = options.debugMode || false;
  }

  // ==========================================================================
  // A. Context Assembly
  // ==========================================================================

  /**
   * Assemble pitch context from press release + journalist profile
   */
  async assemblePitchContext(
    orgId: string,
    pressReleaseId: string | null,
    journalistId: string
  ): Promise<PRPitchContext> {
    // Gather context from multiple sources in parallel
    const [pressReleaseData, journalistData, orgData, personalityData, interactionsData] =
      await Promise.all([
        pressReleaseId ? this.fetchPressRelease(orgId, pressReleaseId) : null,
        this.fetchJournalistProfile(orgId, journalistId),
        this.fetchOrganizationContext(orgId),
        this.fetchPersonality(orgId),
        this.fetchRecentInteractions(orgId, journalistId),
      ]);

    return {
      pressRelease: pressReleaseData,
      journalist: journalistData,
      organization: orgData,
      personality: personalityData,
      recentInteractions: interactionsData,
    };
  }

  /**
   * Fetch press release content
   */
  private async fetchPressRelease(
    orgId: string,
    pressReleaseId: string
  ): Promise<PRPitchContext['pressRelease']> {
    try {
      const { data } = await this.supabase
        .from('pr_generated_releases')
        .select('id, headline, angle, body, input_json')
        .eq('id', pressReleaseId)
        .eq('org_id', orgId)
        .single();

      if (!data) return null;

      const inputJson = data.input_json || {};

      return {
        id: data.id,
        headline: data.headline || '',
        angle: data.angle,
        body: data.body,
        keyPoints: this.extractKeyPoints(data.body || ''),
        newsType: inputJson.newsType || null,
      };
    } catch {
      return null;
    }
  }

  /**
   * Extract key points from press release body
   */
  private extractKeyPoints(body: string): string[] {
    if (!body) return [];

    // Simple extraction: look for bullet points or split by paragraphs
    const paragraphs = body.split(/\n\n+/).filter((p) => p.trim().length > 50);
    return paragraphs.slice(0, 3).map((p) => p.substring(0, 200).trim());
  }

  /**
   * Fetch journalist profile
   */
  private async fetchJournalistProfile(
    orgId: string,
    journalistId: string
  ): Promise<PRPitchContext['journalist']> {
    const { data } = await this.supabase
      .from('journalists')
      .select(
        `
        id, name, email, beat, bio, location,
        media_outlets!media_outlet_id(name, tier)
      `
      )
      .eq('id', journalistId)
      .eq('org_id', orgId)
      .single();

    if (!data) {
      throw new Error(`Journalist not found: ${journalistId}`);
    }

    // Handle both single object and array from Supabase join
    const outletData = data.media_outlets;
    const outlet = Array.isArray(outletData) ? outletData[0] : outletData;
    const typedOutlet = outlet as { name: string; tier: string } | null | undefined;

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      beat: data.beat,
      outlet: typedOutlet?.name || null,
      outletTier: typedOutlet?.tier || null,
      location: data.location,
      bio: data.bio,
      recentTopics: [], // Could be enriched from memory in future
    };
  }

  /**
   * Fetch organization context
   */
  private async fetchOrganizationContext(
    orgId: string
  ): Promise<PRPitchContext['organization']> {
    const { data } = await this.supabase
      .from('organizations')
      .select('id, name, metadata')
      .eq('id', orgId)
      .single();

    if (!data) {
      return { id: orgId, name: 'Unknown', industry: null, description: null };
    }

    const metadata = (data.metadata || {}) as { industry?: string; description?: string };

    return {
      id: data.id,
      name: data.name,
      industry: metadata.industry || null,
      description: metadata.description || null,
    };
  }

  /**
   * Fetch organization personality (from S11)
   */
  private async fetchPersonality(
    orgId: string
  ): Promise<PRPitchContext['personality']> {
    try {
      const { data } = await this.supabase
        .from('agent_personalities')
        .select('tone, voice_attributes')
        .eq('org_id', orgId)
        .eq('is_default', true)
        .single();

      if (!data) return null;

      return {
        tone: data.tone || 'professional',
        voiceAttributes: data.voice_attributes || [],
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch recent interactions with journalist (from memory)
   */
  private async fetchRecentInteractions(
    orgId: string,
    journalistId: string
  ): Promise<PRPitchContext['recentInteractions']> {
    try {
      // Check if we have any pitch events for this journalist
      const { data } = await this.supabase
        .from('pr_pitch_events')
        .select(
          `
          event_type, created_at,
          pr_pitch_contacts!contact_id(journalist_id)
        `
        )
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!data) return [];

      return data
        .filter((event) => {
          const contactData = event.pr_pitch_contacts;
          const contact = Array.isArray(contactData) ? contactData[0] : contactData;
          const typedContact = contact as { journalist_id: string } | null | undefined;
          return typedContact?.journalist_id === journalistId;
        })
        .map((event) => ({
          type: event.event_type,
          date: event.created_at,
          summary: `Pitch ${event.event_type}`,
        }));
    } catch {
      return [];
    }
  }

  // ==========================================================================
  // B. Pitch Personalization & Generation
  // ==========================================================================

  /**
   * Generate personalized pitch for a journalist
   */
  async generatePitchPreview(
    orgId: string,
    userId: string,
    input: GeneratePitchPreviewInput
  ): Promise<GeneratedPitchPreview> {
    // Fetch sequence and step
    const sequence = await this.getSequenceWithSteps(input.sequenceId, orgId);
    if (!sequence) {
      throw new Error('Sequence not found');
    }

    const step = sequence.steps.find((s) => s.position === (input.stepPosition || 1));
    if (!step) {
      throw new Error('Step not found');
    }

    // Assemble context
    const context = await this.assemblePitchContext(
      orgId,
      sequence.pressReleaseId,
      input.journalistId
    );

    // Generate personalized pitch
    let subject: string;
    let body: string;
    let personalizationScore: number;
    let suggestions: PitchSuggestion[];

    if (this.llmRouter) {
      const result = await this.generatePersonalizedPitchWithLLM(
        context,
        step,
        sequence,
        input.customContext
      );
      subject = result.subject;
      body = result.body;
      personalizationScore = result.personalizationScore;
      suggestions = result.suggestions;
    } else {
      const result = this.generateFallbackPitch(context, step, sequence);
      subject = result.subject;
      body = result.body;
      personalizationScore = result.personalizationScore;
      suggestions = [];
    }

    // Emit progress event
    prPitchEmitter.emit('pitchGenerated', {
      sequenceId: input.sequenceId,
      journalistId: input.journalistId,
      userId,
    });

    return {
      sequenceId: input.sequenceId,
      journalistId: input.journalistId,
      stepPosition: input.stepPosition || 1,
      subject,
      body,
      personalizationScore,
      suggestions,
      generatedAt: new Date(),
    };
  }

  /**
   * Generate personalized pitch using LLM
   */
  private async generatePersonalizedPitchWithLLM(
    context: PRPitchContext,
    step: PRPitchStep,
    sequence: PRPitchSequenceWithSteps,
    customContext?: string
  ): Promise<{
    subject: string;
    body: string;
    personalizationScore: number;
    suggestions: PitchSuggestion[];
  }> {
    const prompt = this.buildPitchPrompt(context, step, sequence, customContext);

    try {
      const response = await this.llmRouter!.generate({
        systemPrompt: `You are an expert PR pitch writer. Generate highly personalized pitches that grab attention and get responses. Focus on relevance to the journalist's beat and recent coverage.`,
        userPrompt: prompt,
        temperature: 0.7,
        maxTokens: 1500,
      });

      const content = response.completion;
      return this.parseLLMPitchResponse(content, context, step);
    } catch (error) {
      if (this.debugMode) {
        console.error('LLM pitch generation failed:', error);
      }
      return this.generateFallbackPitch(context, step, sequence);
    }
  }

  /**
   * Build prompt for pitch generation
   */
  private buildPitchPrompt(
    context: PRPitchContext,
    step: PRPitchStep,
    sequence: PRPitchSequenceWithSteps,
    customContext?: string
  ): string {
    const parts: string[] = [];

    // Journalist context
    parts.push(`## Journalist Profile
Name: ${context.journalist.name}
Beat: ${context.journalist.beat || 'General'}
Outlet: ${context.journalist.outlet || 'Unknown'} (${context.journalist.outletTier || 'Unknown tier'})
Location: ${context.journalist.location || 'Unknown'}
${context.journalist.bio ? `Bio: ${context.journalist.bio}` : ''}`);

    // Press release context
    if (context.pressRelease) {
      parts.push(`## Press Release
Headline: ${context.pressRelease.headline}
Angle: ${context.pressRelease.angle || 'Not specified'}
News Type: ${context.pressRelease.newsType || 'General'}
Key Points:
${context.pressRelease.keyPoints.map((p) => `- ${p}`).join('\n')}`);
    }

    // Organization context
    parts.push(`## Company
Name: ${context.organization.name}
Industry: ${context.organization.industry || 'Not specified'}`);

    // Tone guidance
    if (context.personality) {
      parts.push(`## Tone Guidance
Tone: ${context.personality.tone}
Voice: ${context.personality.voiceAttributes.join(', ')}`);
    }

    // Recent interactions
    if (context.recentInteractions.length > 0) {
      parts.push(`## Previous Interactions
${context.recentInteractions.map((i) => `- ${i.date}: ${i.summary}`).join('\n')}`);
    }

    // Step-specific templates
    if (step.subjectTemplate || step.bodyTemplate) {
      parts.push(`## Template Guidelines
Subject Template: ${step.subjectTemplate || sequence.defaultSubject || 'Craft a compelling subject'}
Body Template Structure: ${step.bodyTemplate.substring(0, 500)}...`);
    }

    // Custom context
    if (customContext) {
      parts.push(`## Additional Context
${customContext}`);
    }

    // Instructions
    parts.push(`## Task
Generate a personalized pitch email for this journalist.

Return JSON:
{
  "subject": "Email subject line (max 60 chars, personalized)",
  "body": "Full email body with greeting, hook, value prop, CTA",
  "personalizationScore": 0-100,
  "suggestions": [
    {"type": "subject|opening|hook|cta|personalization", "original": "", "suggested": "", "reason": ""}
  ]
}

Make the pitch feel personal - reference the journalist's beat or recent coverage.
Keep it concise (200-300 words for initial pitch, shorter for follow-ups).
Include a clear call-to-action.`);

    return parts.join('\n\n');
  }

  /**
   * Parse LLM response into structured pitch
   */
  private parseLLMPitchResponse(
    content: string,
    context: PRPitchContext,
    step: PRPitchStep
  ): {
    subject: string;
    body: string;
    personalizationScore: number;
    suggestions: PitchSuggestion[];
  } {
    try {
      // Try to extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          subject: parsed.subject || this.generateFallbackSubject(context, step),
          body: parsed.body || this.generateFallbackBody(context, step),
          personalizationScore: parsed.personalizationScore || 50,
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        };
      }
    } catch {
      // Fall through to fallback
    }

    // If parsing fails, generate fallback
    return {
      subject: this.generateFallbackSubject(context, step),
      body: this.generateFallbackBody(context, step),
      personalizationScore: 30,
      suggestions: [],
    };
  }

  /**
   * Generate fallback pitch (deterministic template)
   */
  private generateFallbackPitch(
    context: PRPitchContext,
    step: PRPitchStep,
    sequence: PRPitchSequenceWithSteps
  ): {
    subject: string;
    body: string;
    personalizationScore: number;
    suggestions: PitchSuggestion[];
  } {
    const subject = this.interpolateTemplate(
      step.subjectTemplate || sequence.defaultSubject || 'Story Idea for {{journalist.name}}',
      context
    );

    const body = this.interpolateTemplate(step.bodyTemplate, context);

    return {
      subject,
      body,
      personalizationScore: 30, // Lower score for template-based
      suggestions: [],
    };
  }

  /**
   * Generate fallback subject line
   */
  private generateFallbackSubject(context: PRPitchContext, _step: PRPitchStep): string {
    if (context.pressRelease) {
      return `Story Idea: ${context.pressRelease.headline.substring(0, 50)}`;
    }
    return `Story opportunity from ${context.organization.name}`;
  }

  /**
   * Generate fallback body
   */
  private generateFallbackBody(context: PRPitchContext, _step: PRPitchStep): string {
    const parts: string[] = [];

    // Greeting
    const firstName = context.journalist.name.split(' ')[0];
    parts.push(`Hi ${firstName},`);

    // Hook
    if (context.journalist.beat) {
      parts.push(
        `\nI've been following your coverage of ${context.journalist.beat} and thought this might be of interest.`
      );
    } else {
      parts.push(`\nI have a story idea that I think would resonate with your audience.`);
    }

    // Value proposition
    if (context.pressRelease) {
      parts.push(`\n${context.pressRelease.headline}`);
      if (context.pressRelease.angle) {
        parts.push(`\n${context.pressRelease.angle}`);
      }
    }

    // CTA
    parts.push(`\nWould you be interested in learning more? Happy to provide additional details or arrange an interview.`);

    // Sign-off
    parts.push(`\nBest regards,\n${context.organization.name}`);

    return parts.join('\n');
  }

  /**
   * Interpolate template variables
   */
  private interpolateTemplate(template: string, context: PRPitchContext): string {
    return template
      .replace(/\{\{journalist\.name\}\}/g, context.journalist.name)
      .replace(/\{\{journalist\.firstName\}\}/g, context.journalist.name.split(' ')[0])
      .replace(/\{\{journalist\.beat\}\}/g, context.journalist.beat || 'your coverage area')
      .replace(/\{\{journalist\.outlet\}\}/g, context.journalist.outlet || 'your outlet')
      .replace(/\{\{organization\.name\}\}/g, context.organization.name)
      .replace(/\{\{pressRelease\.headline\}\}/g, context.pressRelease?.headline || '')
      .replace(/\{\{pressRelease\.angle\}\}/g, context.pressRelease?.angle || '');
  }

  // ==========================================================================
  // C. Sequence Management
  // ==========================================================================

  /**
   * Create a new pitch sequence
   */
  async createSequence(
    orgId: string,
    userId: string,
    input: CreatePRPitchSequenceInput
  ): Promise<PRPitchSequenceWithSteps> {
    // Merge settings with defaults
    const settings: PRPitchSequenceSettings = {
      ...DEFAULT_SEQUENCE_SETTINGS,
      ...input.settings,
    };

    // Create sequence
    const { data: sequenceData, error: sequenceError } = await this.supabase
      .from('pr_pitch_sequences')
      .insert({
        org_id: orgId,
        user_id: userId,
        name: input.name,
        press_release_id: input.pressReleaseId || null,
        default_subject: input.defaultSubject || null,
        default_preview_text: input.defaultPreviewText || null,
        settings,
        status: 'draft',
      })
      .select()
      .single();

    if (sequenceError || !sequenceData) {
      throw new Error(`Failed to create sequence: ${sequenceError?.message}`);
    }

    const sequence = transformPRPitchSequenceRecord(sequenceData as PRPitchSequenceRecord);

    // Create steps if provided
    const steps: PRPitchStep[] = [];
    if (input.steps && input.steps.length > 0) {
      const stepRecords = await this.createSteps(orgId, sequence.id, input.steps);
      steps.push(...stepRecords);
    }

    return { ...sequence, steps };
  }

  /**
   * Create steps for a sequence
   */
  private async createSteps(
    orgId: string,
    sequenceId: string,
    steps: CreatePRPitchStepInput[]
  ): Promise<PRPitchStep[]> {
    const stepData = steps.map((step) => ({
      org_id: orgId,
      sequence_id: sequenceId,
      position: step.position,
      step_type: step.stepType || 'email',
      subject_template: step.subjectTemplate || null,
      body_template: step.bodyTemplate,
      wait_days: step.waitDays ?? 3,
    }));

    const { data, error } = await this.supabase
      .from('pr_pitch_steps')
      .insert(stepData)
      .select();

    if (error) {
      throw new Error(`Failed to create steps: ${error.message}`);
    }

    return (data || []).map((record) =>
      transformPRPitchStepRecord(record as PRPitchStepRecord)
    );
  }

  /**
   * Update sequence and steps
   */
  async updateSequence(
    sequenceId: string,
    orgId: string,
    input: UpdatePRPitchSequenceInput
  ): Promise<PRPitchSequenceWithSteps> {
    // Build update object
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.pressReleaseId !== undefined)
      updateData.press_release_id = input.pressReleaseId;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.defaultSubject !== undefined)
      updateData.default_subject = input.defaultSubject;
    if (input.defaultPreviewText !== undefined)
      updateData.default_preview_text = input.defaultPreviewText;

    if (input.settings) {
      // Merge with existing settings
      const existing = await this.getSequenceWithSteps(sequenceId, orgId);
      if (existing) {
        updateData.settings = { ...existing.settings, ...input.settings };
      }
    }

    // Update sequence
    if (Object.keys(updateData).length > 0) {
      const { error } = await this.supabase
        .from('pr_pitch_sequences')
        .update(updateData)
        .eq('id', sequenceId)
        .eq('org_id', orgId);

      if (error) {
        throw new Error(`Failed to update sequence: ${error.message}`);
      }
    }

    // Update steps if provided
    if (input.steps) {
      await this.updateSteps(orgId, sequenceId, input.steps);
    }

    // Return updated sequence
    const updated = await this.getSequenceWithSteps(sequenceId, orgId);
    if (!updated) {
      throw new Error('Sequence not found after update');
    }

    return updated;
  }

  /**
   * Update steps (upsert pattern)
   */
  private async updateSteps(
    orgId: string,
    sequenceId: string,
    steps: UpdatePRPitchStepInput[]
  ): Promise<void> {
    // Delete existing steps
    await this.supabase
      .from('pr_pitch_steps')
      .delete()
      .eq('sequence_id', sequenceId)
      .eq('org_id', orgId);

    // Create new steps
    if (steps.length > 0) {
      const stepData = steps.map((step) => ({
        org_id: orgId,
        sequence_id: sequenceId,
        position: step.position,
        step_type: step.stepType || 'email',
        subject_template: step.subjectTemplate || null,
        body_template: step.bodyTemplate,
        wait_days: step.waitDays ?? 3,
      }));

      const { error } = await this.supabase.from('pr_pitch_steps').insert(stepData);

      if (error) {
        throw new Error(`Failed to update steps: ${error.message}`);
      }
    }
  }

  /**
   * List sequences with filters
   */
  async listSequences(
    orgId: string,
    query: ListPRPitchSequencesQuery = {}
  ): Promise<{ sequences: PRPitchSequence[]; total: number }> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    let builder = this.supabase
      .from('pr_pitch_sequences')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    // Apply filters
    if (query.status) {
      if (Array.isArray(query.status)) {
        builder = builder.in('status', query.status);
      } else {
        builder = builder.eq('status', query.status);
      }
    }

    if (query.pressReleaseId) {
      builder = builder.eq('press_release_id', query.pressReleaseId);
    }

    if (query.search) {
      builder = builder.ilike('name', `%${query.search}%`);
    }

    // Apply sorting
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy === 'updatedAt' ? 'updated_at' : 'name';
    builder = builder.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    builder = builder.range(offset, offset + limit - 1);

    const { data, count, error } = await builder;

    if (error) {
      throw new Error(`Failed to list sequences: ${error.message}`);
    }

    const sequences = (data || []).map((record) =>
      transformPRPitchSequenceRecord(record as PRPitchSequenceRecord)
    );

    return { sequences, total: count || 0 };
  }

  /**
   * Get sequence with steps and stats
   */
  async getSequenceWithSteps(
    sequenceId: string,
    orgId: string
  ): Promise<PRPitchSequenceWithSteps | null> {
    // Fetch sequence
    const { data: sequenceData } = await this.supabase
      .from('pr_pitch_sequences')
      .select('*')
      .eq('id', sequenceId)
      .eq('org_id', orgId)
      .single();

    if (!sequenceData) return null;

    const sequence = transformPRPitchSequenceRecord(
      sequenceData as PRPitchSequenceRecord
    );

    // Fetch steps
    const { data: stepsData } = await this.supabase
      .from('pr_pitch_steps')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('position', { ascending: true });

    const steps = (stepsData || []).map((record) =>
      transformPRPitchStepRecord(record as PRPitchStepRecord)
    );

    // Fetch stats
    const stats = await this.getSequenceStats(sequenceId);

    return { ...sequence, steps, stats };
  }

  /**
   * Get sequence statistics
   */
  async getSequenceStats(sequenceId: string): Promise<PRPitchSequenceStats> {
    const { data } = await this.supabase.rpc('get_pr_pitch_sequence_stats', {
      p_sequence_id: sequenceId,
    });

    if (data && data[0]) {
      return {
        totalContacts: Number(data[0].total_contacts) || 0,
        queuedCount: Number(data[0].queued_count) || 0,
        sentCount: Number(data[0].sent_count) || 0,
        openedCount: Number(data[0].opened_count) || 0,
        repliedCount: Number(data[0].replied_count) || 0,
        bouncedCount: Number(data[0].bounced_count) || 0,
        failedCount: Number(data[0].failed_count) || 0,
      };
    }

    return {
      totalContacts: 0,
      queuedCount: 0,
      sentCount: 0,
      openedCount: 0,
      repliedCount: 0,
      bouncedCount: 0,
      failedCount: 0,
    };
  }

  /**
   * Delete (archive) a sequence
   */
  async deleteSequence(sequenceId: string, orgId: string): Promise<void> {
    const { error } = await this.supabase
      .from('pr_pitch_sequences')
      .update({ status: 'archived' })
      .eq('id', sequenceId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to archive sequence: ${error.message}`);
    }
  }

  // ==========================================================================
  // D. Contact Management
  // ==========================================================================

  /**
   * Attach journalists to a sequence
   */
  async attachContactsToSequence(
    sequenceId: string,
    orgId: string,
    journalistIds: string[]
  ): Promise<PRPitchContact[]> {
    // Verify sequence exists
    const sequence = await this.getSequenceWithSteps(sequenceId, orgId);
    if (!sequence) {
      throw new Error('Sequence not found');
    }

    // Create contacts (upsert to handle duplicates)
    const contactData = journalistIds.map((journalistId) => ({
      org_id: orgId,
      sequence_id: sequenceId,
      journalist_id: journalistId,
      status: 'queued' as PRPitchContactStatus,
      current_step_position: 1,
    }));

    const { data, error } = await this.supabase
      .from('pr_pitch_contacts')
      .upsert(contactData, {
        onConflict: 'sequence_id,journalist_id',
        ignoreDuplicates: true,
      })
      .select();

    if (error) {
      throw new Error(`Failed to attach contacts: ${error.message}`);
    }

    return (data || []).map((record) =>
      transformPRPitchContactRecord(record as PRPitchContactRecord)
    );
  }

  /**
   * List contacts for a sequence
   */
  async listContacts(
    sequenceId: string,
    orgId: string,
    query: ListPRPitchContactsQuery = {}
  ): Promise<{ contacts: PRPitchContactWithJournalist[]; total: number }> {
    const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    let builder = this.supabase
      .from('pr_pitch_contacts')
      .select(
        `
        *,
        journalists!journalist_id(id, name, email, beat, media_outlets!media_outlet_id(name, tier))
      `,
        { count: 'exact' }
      )
      .eq('sequence_id', sequenceId)
      .eq('org_id', orgId);

    // Apply filters
    if (query.status) {
      if (Array.isArray(query.status)) {
        builder = builder.in('status', query.status);
      } else {
        builder = builder.eq('status', query.status);
      }
    }

    // Apply sorting
    const sortColumn =
      sortBy === 'createdAt'
        ? 'created_at'
        : sortBy === 'lastEventAt'
        ? 'last_event_at'
        : 'status';
    builder = builder.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    builder = builder.range(offset, offset + limit - 1);

    const { data, count, error } = await builder;

    if (error) {
      throw new Error(`Failed to list contacts: ${error.message}`);
    }

    const contacts: PRPitchContactWithJournalist[] = (data || []).map((record) => {
      const base = transformPRPitchContactRecord(record as PRPitchContactRecord);
      const journalist = record.journalists as {
        id: string;
        name: string;
        email: string | null;
        beat: string | null;
        media_outlets: { name: string; tier: string } | null;
      };

      return {
        ...base,
        journalist: {
          id: journalist.id,
          name: journalist.name,
          email: journalist.email,
          beat: journalist.beat,
          outlet: journalist.media_outlets?.name || null,
          tier: journalist.media_outlets?.tier || null,
        },
      };
    });

    return { contacts, total: count || 0 };
  }

  /**
   * Get contact with events
   */
  async getContactWithEvents(
    contactId: string,
    orgId: string
  ): Promise<PRPitchContactWithJournalist | null> {
    const { data: contactData } = await this.supabase
      .from('pr_pitch_contacts')
      .select(
        `
        *,
        journalists!journalist_id(id, name, email, beat, media_outlets!media_outlet_id(name, tier))
      `
      )
      .eq('id', contactId)
      .eq('org_id', orgId)
      .single();

    if (!contactData) return null;

    const base = transformPRPitchContactRecord(contactData as PRPitchContactRecord);
    const journalist = contactData.journalists as {
      id: string;
      name: string;
      email: string | null;
      beat: string | null;
      media_outlets: { name: string; tier: string } | null;
    };

    // Fetch events
    const { data: eventsData } = await this.supabase
      .from('pr_pitch_events')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });

    const events = (eventsData || []).map((record) =>
      transformPRPitchEventRecord(record as PRPitchEventRecord)
    );

    return {
      ...base,
      journalist: {
        id: journalist.id,
        name: journalist.name,
        email: journalist.email,
        beat: journalist.beat,
        outlet: journalist.media_outlets?.name || null,
        tier: journalist.media_outlets?.tier || null,
      },
      events,
    };
  }

  // ==========================================================================
  // E. Event & Status Handling
  // ==========================================================================

  /**
   * Queue initial pitch for a contact
   */
  async queuePitchForContact(
    contactId: string,
    orgId: string
  ): Promise<PRPitchContact> {
    // Update contact status
    const { data, error } = await this.supabase
      .from('pr_pitch_contacts')
      .update({
        status: 'queued',
        last_event_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to queue pitch: ${error?.message}`);
    }

    // Record event
    await this.recordEvent(contactId, orgId, 1, 'queued');

    return transformPRPitchContactRecord(data as PRPitchContactRecord);
  }

  /**
   * Record a pitch event
   */
  async recordEvent(
    contactId: string,
    orgId: string,
    stepPosition: number,
    eventType: PRPitchEventType,
    payload: Record<string, unknown> = {}
  ): Promise<PRPitchEvent> {
    const { data, error } = await this.supabase
      .from('pr_pitch_events')
      .insert({
        org_id: orgId,
        contact_id: contactId,
        step_position: stepPosition,
        event_type: eventType,
        payload,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to record event: ${error?.message}`);
    }

    // Update contact last_event_at
    await this.supabase
      .from('pr_pitch_contacts')
      .update({ last_event_at: new Date().toISOString() })
      .eq('id', contactId);

    // Emit event
    prPitchEmitter.emit('pitchEvent', {
      contactId,
      stepPosition,
      eventType,
    });

    return transformPRPitchEventRecord(data as PRPitchEventRecord);
  }

  /**
   * Update contact status (stub for future ESP integration)
   */
  async updateContactStatus(
    contactId: string,
    orgId: string,
    status: PRPitchContactStatus
  ): Promise<PRPitchContact> {
    const { data, error } = await this.supabase
      .from('pr_pitch_contacts')
      .update({
        status,
        last_event_at: new Date().toISOString(),
      })
      .eq('id', contactId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update contact status: ${error?.message}`);
    }

    return transformPRPitchContactRecord(data as PRPitchContactRecord);
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createPRPitchService(
  supabase: SupabaseClient,
  llmRouter?: LlmRouter,
  options?: PRPitchServiceOptions
): PRPitchService {
  return new PRPitchService(supabase, llmRouter, options);
}
