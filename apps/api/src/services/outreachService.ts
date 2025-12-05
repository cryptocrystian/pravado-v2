/**
 * Outreach Service (Sprint S44)
 * Automated journalist outreach engine
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  CreateOutreachEventInput,
  CreateOutreachRunInput,
  CreateOutreachSequenceInput,
  CreateOutreachStepInput,
  GeneratedEmail,
  ListOutreachEventsQuery,
  ListOutreachRunsQuery,
  ListOutreachSequencesQuery,
  OutreachEvent,
  OutreachEventListResponse,
  OutreachEventType,
  OutreachRun,
  OutreachRunListResponse,
  OutreachRunStatus,
  OutreachRunWithDetails,
  OutreachSequence,
  OutreachSequenceListResponse,
  OutreachSequenceStep,
  OutreachSequenceWithSteps,
  OutreachStats,
  OutreachStopReason,
  StartSequenceRunsInput,
  TargetingPreview,
  UpdateOutreachRunInput,
  UpdateOutreachSequenceInput,
  UpdateOutreachStepInput,
} from '@pravado/types';
import type { OutreachDeliverabilityService } from './outreachDeliverabilityService';

/**
 * Service configuration
 */
export interface OutreachServiceConfig {
  supabase: SupabaseClient;
  debugMode?: boolean;
  deliverabilityService?: OutreachDeliverabilityService; // S45: Optional deliverability tracking
}

/**
 * Outreach Service implementation
 */
export class OutreachService {
  private supabase: SupabaseClient;
  private debugMode: boolean;
  private deliverabilityService?: OutreachDeliverabilityService;

  constructor(config: OutreachServiceConfig) {
    this.supabase = config.supabase;
    this.debugMode = config.debugMode || false;
    this.deliverabilityService = config.deliverabilityService;
  }

  // =============================================
  // Sequence Management
  // =============================================

  /**
   * Create a new outreach sequence
   */
  async createSequence(
    orgId: string,
    input: CreateOutreachSequenceInput
  ): Promise<OutreachSequence> {
    const { data, error } = await this.supabase
      .from('pr_outreach_sequences')
      .insert({
        org_id: orgId,
        name: input.name,
        description: input.description || null,
        journalist_ids: input.journalistIds || [],
        outlet_ids: input.outletIds || [],
        beat_filter: input.beatFilter || null,
        tier_filter: input.tierFilter || null,
        max_runs_per_day: input.maxRunsPerDay || 50,
        stop_on_reply: input.stopOnReply !== undefined ? input.stopOnReply : true,
        pitch_id: input.pitchId || null,
        press_release_id: input.pressReleaseId || null,
        is_active: true,
        total_runs: 0,
        completed_runs: 0,
        active_runs: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create outreach sequence: ${error.message}`);
    }

    return this.mapSequenceFromDb(data);
  }

  /**
   * List outreach sequences
   */
  async listSequences(
    orgId: string,
    query?: ListOutreachSequencesQuery
  ): Promise<OutreachSequenceListResponse> {
    let queryBuilder = this.supabase
      .from('pr_outreach_sequences')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (query?.isActive !== undefined) {
      queryBuilder = queryBuilder.eq('is_active', query.isActive);
    }

    if (query?.pitchId) {
      queryBuilder = queryBuilder.eq('pitch_id', query.pitchId);
    }

    if (query?.pressReleaseId) {
      queryBuilder = queryBuilder.eq('press_release_id', query.pressReleaseId);
    }

    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(query?.offset || 0, (query?.offset || 0) + (query?.limit || 20) - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list outreach sequences: ${error.message}`);
    }

    return {
      sequences: (data || []).map((s) => this.mapSequenceFromDb(s)),
      total: count || 0,
    };
  }

  /**
   * Get a single sequence by ID
   */
  async getSequence(sequenceId: string, orgId: string): Promise<OutreachSequence> {
    const { data, error } = await this.supabase
      .from('pr_outreach_sequences')
      .select('*')
      .eq('id', sequenceId)
      .eq('org_id', orgId)
      .single();

    if (error || !data) {
      throw new Error(`Sequence not found: ${sequenceId}`);
    }

    return this.mapSequenceFromDb(data);
  }

  /**
   * Get sequence with all steps
   */
  async getSequenceWithSteps(
    sequenceId: string,
    orgId: string
  ): Promise<OutreachSequenceWithSteps> {
    const sequence = await this.getSequence(sequenceId, orgId);

    const { data: stepsData, error: stepsError } = await this.supabase
      .from('pr_outreach_sequence_steps')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('step_number', { ascending: true });

    if (stepsError) {
      throw new Error(`Failed to get sequence steps: ${stepsError.message}`);
    }

    return {
      ...sequence,
      steps: (stepsData || []).map((s) => this.mapStepFromDb(s)),
    };
  }

  /**
   * Update a sequence
   */
  async updateSequence(
    sequenceId: string,
    orgId: string,
    input: UpdateOutreachSequenceInput
  ): Promise<OutreachSequence> {
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.journalistIds !== undefined) updateData.journalist_ids = input.journalistIds;
    if (input.outletIds !== undefined) updateData.outlet_ids = input.outletIds;
    if (input.beatFilter !== undefined) updateData.beat_filter = input.beatFilter;
    if (input.tierFilter !== undefined) updateData.tier_filter = input.tierFilter;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;
    if (input.maxRunsPerDay !== undefined) updateData.max_runs_per_day = input.maxRunsPerDay;
    if (input.stopOnReply !== undefined) updateData.stop_on_reply = input.stopOnReply;
    if (input.pitchId !== undefined) updateData.pitch_id = input.pitchId;
    if (input.pressReleaseId !== undefined) updateData.press_release_id = input.pressReleaseId;

    const { data, error } = await this.supabase
      .from('pr_outreach_sequences')
      .update(updateData)
      .eq('id', sequenceId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update sequence: ${error?.message || 'Not found'}`);
    }

    return this.mapSequenceFromDb(data);
  }

  /**
   * Delete a sequence
   */
  async deleteSequence(sequenceId: string, orgId: string): Promise<void> {
    // Stop all active runs first
    const { data: activeRuns } = await this.supabase
      .from('pr_outreach_runs')
      .select('id')
      .eq('sequence_id', sequenceId)
      .eq('org_id', orgId)
      .eq('status', 'running');

    if (activeRuns && activeRuns.length > 0) {
      await this.supabase
        .from('pr_outreach_runs')
        .update({
          status: 'stopped',
          stopped_at: new Date().toISOString(),
          stop_reason: 'sequence_deleted',
        })
        .in('id', activeRuns.map((r) => r.id));
    }

    const { error } = await this.supabase
      .from('pr_outreach_sequences')
      .delete()
      .eq('id', sequenceId)
      .eq('org_id', orgId);

    if (error) {
      throw new Error(`Failed to delete sequence: ${error.message}`);
    }
  }

  // =============================================
  // Step Management
  // =============================================

  /**
   * Create a new sequence step
   */
  async createStep(sequenceId: string, input: CreateOutreachStepInput): Promise<OutreachSequenceStep> {
    const { data, error } = await this.supabase
      .from('pr_outreach_sequence_steps')
      .insert({
        sequence_id: sequenceId,
        step_number: input.stepNumber,
        delay_hours: input.delayHours,
        subject_template: input.subjectTemplate,
        body_template: input.bodyTemplate,
        template_variables: input.templateVariables || {},
        use_llm_generation: input.useLlmGeneration || false,
        llm_prompt: input.llmPrompt || null,
        llm_model: input.llmModel || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sequence step: ${error.message}`);
    }

    return this.mapStepFromDb(data);
  }

  /**
   * Update a sequence step
   */
  async updateStep(
    stepId: string,
    input: UpdateOutreachStepInput
  ): Promise<OutreachSequenceStep> {
    const updateData: Record<string, unknown> = {};

    if (input.stepNumber !== undefined) updateData.step_number = input.stepNumber;
    if (input.delayHours !== undefined) updateData.delay_hours = input.delayHours;
    if (input.subjectTemplate !== undefined) updateData.subject_template = input.subjectTemplate;
    if (input.bodyTemplate !== undefined) updateData.body_template = input.bodyTemplate;
    if (input.templateVariables !== undefined)
      updateData.template_variables = input.templateVariables;
    if (input.useLlmGeneration !== undefined)
      updateData.use_llm_generation = input.useLlmGeneration;
    if (input.llmPrompt !== undefined) updateData.llm_prompt = input.llmPrompt;
    if (input.llmModel !== undefined) updateData.llm_model = input.llmModel;

    const { data, error } = await this.supabase
      .from('pr_outreach_sequence_steps')
      .update(updateData)
      .eq('id', stepId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update step: ${error?.message || 'Not found'}`);
    }

    return this.mapStepFromDb(data);
  }

  /**
   * Delete a sequence step
   */
  async deleteStep(stepId: string): Promise<void> {
    const { error } = await this.supabase
      .from('pr_outreach_sequence_steps')
      .delete()
      .eq('id', stepId);

    if (error) {
      throw new Error(`Failed to delete step: ${error.message}`);
    }
  }

  // =============================================
  // Run Management
  // =============================================

  /**
   * Start sequence runs
   */
  async startSequenceRuns(orgId: string, input: StartSequenceRunsInput): Promise<{
    runsCreated: number;
    runs: OutreachRun[];
    skippedJournalists: string[];
  }> {
    const sequence = await this.getSequence(input.sequenceId, orgId);

    if (!sequence.isActive) {
      throw new Error('Cannot start runs for inactive sequence');
    }

    // Get steps to ensure sequence has at least one step
    const { data: steps, error: stepsError } = await this.supabase
      .from('pr_outreach_sequence_steps')
      .select('*')
      .eq('sequence_id', input.sequenceId)
      .order('step_number', { ascending: true });

    if (stepsError || !steps || steps.length === 0) {
      throw new Error('Sequence must have at least one step');
    }

    // Determine target journalists
    let journalistIds: string[] = [];

    if (input.journalistIds && input.journalistIds.length > 0) {
      journalistIds = input.journalistIds;
    } else {
      // Use sequence targeting
      const preview = await this.previewTargeting(input.sequenceId, orgId);
      journalistIds = preview.journalistIds;
    }

    if (journalistIds.length === 0) {
      return {
        runsCreated: 0,
        runs: [],
        skippedJournalists: [],
      };
    }

    // Check for existing runs
    const { data: existingRuns } = await this.supabase
      .from('pr_outreach_runs')
      .select('journalist_id')
      .eq('sequence_id', input.sequenceId)
      .in('journalist_id', journalistIds);

    const existingJournalistIds = new Set(
      (existingRuns || []).map((r) => r.journalist_id)
    );

    const newJournalistIds = journalistIds.filter((jid) => !existingJournalistIds.has(jid));

    if (input.dryRun) {
      return {
        runsCreated: newJournalistIds.length,
        runs: [],
        skippedJournalists: Array.from(existingJournalistIds),
      };
    }

    // Create runs
    const runs: OutreachRun[] = [];

    for (const journalistId of newJournalistIds) {
      const run = await this.createRun(orgId, {
        sequenceId: input.sequenceId,
        journalistId,
      });

      runs.push(run);

      // Schedule first step immediately
      await this.advanceRun(run.id, orgId, true);
    }

    // Update sequence stats
    await this.supabase
      .from('pr_outreach_sequences')
      .update({
        total_runs: sequence.totalRuns + runs.length,
        active_runs: sequence.activeRuns + runs.length,
      })
      .eq('id', input.sequenceId);

    return {
      runsCreated: runs.length,
      runs,
      skippedJournalists: Array.from(existingJournalistIds),
    };
  }

  /**
   * Create a run
   */
  async createRun(orgId: string, input: CreateOutreachRunInput): Promise<OutreachRun> {
    const { data, error } = await this.supabase
      .from('pr_outreach_runs')
      .insert({
        org_id: orgId,
        sequence_id: input.sequenceId,
        journalist_id: input.journalistId,
        status: 'running',
        current_step_number: 1,
        next_step_at: null,
        total_steps_sent: 0,
        retry_count: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create run: ${error.message}`);
    }

    return this.mapRunFromDb(data);
  }

  /**
   * List runs
   */
  async listRuns(
    orgId: string,
    query?: ListOutreachRunsQuery
  ): Promise<OutreachRunListResponse> {
    let queryBuilder = this.supabase
      .from('pr_outreach_runs')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (query?.sequenceId) {
      queryBuilder = queryBuilder.eq('sequence_id', query.sequenceId);
    }

    if (query?.journalistId) {
      queryBuilder = queryBuilder.eq('journalist_id', query.journalistId);
    }

    if (query?.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
    }

    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(query?.offset || 0, (query?.offset || 0) + (query?.limit || 20) - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list runs: ${error.message}`);
    }

    return {
      runs: (data || []).map((r) => this.mapRunFromDb(r)),
      total: count || 0,
    };
  }

  /**
   * Get run with details
   */
  async getRunWithDetails(runId: string, orgId: string): Promise<OutreachRunWithDetails> {
    const { data: runData, error: runError } = await this.supabase
      .from('pr_outreach_runs')
      .select('*')
      .eq('id', runId)
      .eq('org_id', orgId)
      .single();

    if (runError || !runData) {
      throw new Error(`Run not found: ${runId}`);
    }

    const run = this.mapRunFromDb(runData);

    // Get sequence
    const sequence = await this.getSequence(run.sequenceId, orgId);

    // Get journalist
    const { data: journalistData, error: journalistError } = await this.supabase
      .from('journalists')
      .select('id, name, email, outlet:outlets(name)')
      .eq('id', run.journalistId)
      .single();

    if (journalistError || !journalistData) {
      throw new Error(`Journalist not found: ${run.journalistId}`);
    }

    // Get events
    const { data: eventsData, error: eventsError } = await this.supabase
      .from('pr_outreach_events')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: true });

    if (eventsError) {
      throw new Error(`Failed to get events: ${eventsError.message}`);
    }

    const outlet = Array.isArray(journalistData.outlet)
      ? journalistData.outlet[0]?.name || null
      : (journalistData.outlet as any)?.name || null;

    return {
      ...run,
      sequence,
      journalist: {
        id: journalistData.id,
        name: journalistData.name,
        email: journalistData.email,
        outlet,
      },
      events: (eventsData || []).map((e) => this.mapEventFromDb(e)),
    };
  }

  /**
   * Update a run
   */
  async updateRun(
    runId: string,
    orgId: string,
    input: UpdateOutreachRunInput
  ): Promise<OutreachRun> {
    const updateData: Record<string, unknown> = {};

    if (input.status !== undefined) updateData.status = input.status;
    if (input.currentStepNumber !== undefined)
      updateData.current_step_number = input.currentStepNumber;
    if (input.nextStepAt !== undefined)
      updateData.next_step_at = input.nextStepAt?.toISOString();
    if (input.completedAt !== undefined)
      updateData.completed_at = input.completedAt?.toISOString();
    if (input.stoppedAt !== undefined) updateData.stopped_at = input.stoppedAt?.toISOString();
    if (input.stopReason !== undefined) updateData.stop_reason = input.stopReason;
    if (input.totalStepsSent !== undefined) updateData.total_steps_sent = input.totalStepsSent;
    if (input.lastSentAt !== undefined) updateData.last_sent_at = input.lastSentAt?.toISOString();
    if (input.repliedAt !== undefined) updateData.replied_at = input.repliedAt?.toISOString();
    if (input.replyStepNumber !== undefined)
      updateData.reply_step_number = input.replyStepNumber;
    if (input.lastError !== undefined) updateData.last_error = input.lastError;
    if (input.retryCount !== undefined) updateData.retry_count = input.retryCount;

    const { data, error } = await this.supabase
      .from('pr_outreach_runs')
      .update(updateData)
      .eq('id', runId)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update run: ${error?.message || 'Not found'}`);
    }

    return this.mapRunFromDb(data);
  }

  /**
   * Stop a run
   */
  async stopRun(runId: string, orgId: string, reason: OutreachStopReason): Promise<OutreachRun> {
    return this.updateRun(runId, orgId, {
      status: 'stopped',
      stoppedAt: new Date(),
      stopReason: reason,
    });
  }

  /**
   * Advance a run to next step
   */
  async advanceRun(
    runId: string,
    orgId: string,
    forceAdvance: boolean = false
  ): Promise<OutreachRun> {
    const run = await this.getRunWithDetails(runId, orgId);

    if (run.status !== 'running') {
      throw new Error(`Run is not in running state: ${run.status}`);
    }

    // Check if it's time to advance
    if (!forceAdvance && run.nextStepAt && run.nextStepAt > new Date()) {
      throw new Error('Not yet time to advance run');
    }

    // Get next step
    const { data: stepData, error: stepError } = await this.supabase
      .from('pr_outreach_sequence_steps')
      .select('*')
      .eq('sequence_id', run.sequenceId)
      .eq('step_number', run.currentStepNumber)
      .single();

    if (stepError || !stepData) {
      // No more steps - mark as completed
      await this.updateRun(runId, orgId, {
        status: 'completed',
        completedAt: new Date(),
      });

      // Update sequence stats
      await this.supabase.rpc('increment', {
        table_name: 'pr_outreach_sequences',
        row_id: run.sequenceId,
        column_name: 'completed_runs',
        increment_by: 1,
      });

      await this.supabase.rpc('decrement', {
        table_name: 'pr_outreach_sequences',
        row_id: run.sequenceId,
        column_name: 'active_runs',
        decrement_by: 1,
      });

      return this.getRunWithDetails(runId, orgId);
    }

    const step = this.mapStepFromDb(stepData);

    // Generate and send email
    try {
      const email = await this.generateEmail(step, run.journalist, run.sequence);

      let providerMessageId: string | null = null;

      // S45: Send email via deliverability service if configured
      if (this.deliverabilityService) {
        // Create email message record for tracking
        const emailMessage = await this.deliverabilityService.createEmailMessage(orgId, {
          runId,
          sequenceId: run.sequenceId,
          stepNumber: step.stepNumber,
          journalistId: run.journalist.id,
          subject: email.subject,
          bodyHtml: email.body, // Assuming body is HTML
          bodyText: email.body, // For now, use same content
          metadata: email.variables,
        });

        // Send the email
        const sendResult = await this.deliverabilityService.sendEmail({
          to: run.journalist.email,
          subject: email.subject,
          bodyHtml: email.body,
          bodyText: email.body,
          metadata: email.variables,
        });

        if (sendResult.success && sendResult.messageId) {
          providerMessageId = sendResult.messageId;

          // Update email message with provider message ID and sent status
          await this.deliverabilityService.updateEmailMessage(emailMessage.id, orgId, {
            providerMessageId: sendResult.messageId,
            sendStatus: 'sent',
            sentAt: new Date(),
          });
        } else {
          // Mark as failed
          await this.deliverabilityService.updateEmailMessage(emailMessage.id, orgId, {
            sendStatus: 'failed',
          });

          throw new Error(sendResult.error || 'Failed to send email');
        }
      }

      // Create sent event (legacy tracking for backwards compatibility)
      await this.createEvent(orgId, {
        runId,
        sequenceId: run.sequenceId,
        stepId: step.id,
        eventType: 'sent',
        stepNumber: step.stepNumber,
        emailSubject: email.subject,
        emailBody: email.body,
        recipientEmail: run.journalist.email,
        sentAt: new Date(),
        metadata: { ...email.variables, providerMessageId },
      });

      // Get next step
      const { data: nextStepData } = await this.supabase
        .from('pr_outreach_sequence_steps')
        .select('*')
        .eq('sequence_id', run.sequenceId)
        .eq('step_number', run.currentStepNumber + 1)
        .single();

      if (nextStepData) {
        const nextStep = this.mapStepFromDb(nextStepData);
        const nextStepAt = new Date(Date.now() + nextStep.delayHours * 60 * 60 * 1000);

        await this.updateRun(runId, orgId, {
          currentStepNumber: run.currentStepNumber + 1,
          nextStepAt,
          totalStepsSent: run.totalStepsSent + 1,
          lastSentAt: new Date(),
        });
      } else {
        // No more steps
        await this.updateRun(runId, orgId, {
          status: 'completed',
          completedAt: new Date(),
          totalStepsSent: run.totalStepsSent + 1,
          lastSentAt: new Date(),
        });
      }
    } catch (err) {
      // Log error event
      await this.createEvent(orgId, {
        runId,
        sequenceId: run.sequenceId,
        stepId: step.id,
        eventType: 'failed',
        stepNumber: step.stepNumber,
        recipientEmail: run.journalist.email,
        failedAt: new Date(),
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });

      await this.updateRun(runId, orgId, {
        lastError: err instanceof Error ? err.message : 'Unknown error',
        retryCount: run.retryCount + 1,
      });

      throw err;
    }

    return this.getRunWithDetails(runId, orgId);
  }

  // =============================================
  // Event Management
  // =============================================

  /**
   * Create an outreach event
   */
  async createEvent(orgId: string, input: CreateOutreachEventInput): Promise<OutreachEvent> {
    const { data, error } = await this.supabase
      .from('pr_outreach_events')
      .insert({
        org_id: orgId,
        run_id: input.runId,
        sequence_id: input.sequenceId,
        step_id: input.stepId,
        event_type: input.eventType,
        step_number: input.stepNumber,
        email_subject: input.emailSubject || null,
        email_body: input.emailBody || null,
        recipient_email: input.recipientEmail,
        sent_at: input.sentAt?.toISOString() || null,
        opened_at: input.openedAt?.toISOString() || null,
        clicked_at: input.clickedAt?.toISOString() || null,
        replied_at: input.repliedAt?.toISOString() || null,
        bounced_at: input.bouncedAt?.toISOString() || null,
        failed_at: input.failedAt?.toISOString() || null,
        metadata: input.metadata || {},
        error_message: input.errorMessage || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`);
    }

    return this.mapEventFromDb(data);
  }

  /**
   * List events
   */
  async listEvents(
    orgId: string,
    query?: ListOutreachEventsQuery
  ): Promise<OutreachEventListResponse> {
    let queryBuilder = this.supabase
      .from('pr_outreach_events')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (query?.runId) {
      queryBuilder = queryBuilder.eq('run_id', query.runId);
    }

    if (query?.sequenceId) {
      queryBuilder = queryBuilder.eq('sequence_id', query.sequenceId);
    }

    if (query?.eventType) {
      queryBuilder = queryBuilder.eq('event_type', query.eventType);
    }

    if (query?.startDate) {
      queryBuilder = queryBuilder.gte('created_at', query.startDate.toISOString());
    }

    if (query?.endDate) {
      queryBuilder = queryBuilder.lte('created_at', query.endDate.toISOString());
    }

    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(query?.offset || 0, (query?.offset || 0) + (query?.limit || 20) - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to list events: ${error.message}`);
    }

    return {
      events: (data || []).map((e) => this.mapEventFromDb(e)),
      total: count || 0,
    };
  }

  /**
   * Track email event (opened, clicked, replied, bounced)
   */
  async trackEmailEvent(
    eventId: string,
    eventType: OutreachEventType,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const updateData: Record<string, unknown> = {};

    switch (eventType) {
      case 'opened':
        updateData.opened_at = new Date().toISOString();
        break;
      case 'clicked':
        updateData.clicked_at = new Date().toISOString();
        break;
      case 'replied':
        updateData.replied_at = new Date().toISOString();
        break;
      case 'bounced':
        updateData.bounced_at = new Date().toISOString();
        break;
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    await this.supabase.from('pr_outreach_events').update(updateData).eq('id', eventId);

    // If replied, stop the run
    if (eventType === 'replied') {
      const { data: eventData } = await this.supabase
        .from('pr_outreach_events')
        .select('run_id, step_number, org_id')
        .eq('id', eventId)
        .single();

      if (eventData) {
        const { data: runData } = await this.supabase
          .from('pr_outreach_runs')
          .select('sequence_id')
          .eq('id', eventData.run_id)
          .single();

        if (runData) {
          const { data: sequenceData } = await this.supabase
            .from('pr_outreach_sequences')
            .select('stop_on_reply')
            .eq('id', runData.sequence_id)
            .single();

          if (sequenceData?.stop_on_reply) {
            await this.updateRun(eventData.run_id, eventData.org_id, {
              status: 'stopped',
              stoppedAt: new Date(),
              stopReason: 'journalist_replied',
              repliedAt: new Date(),
              replyStepNumber: eventData.step_number,
            });
          }
        }
      }
    }
  }

  // =============================================
  // Email Generation
  // =============================================

  /**
   * Generate email from template
   */
  async generateEmail(
    step: OutreachSequenceStep,
    journalist: { id: string; name: string; email: string; outlet: string | null },
    sequence: OutreachSequence
  ): Promise<GeneratedEmail> {
    // Build template variables
    const variables: Record<string, unknown> = {
      journalist_name: journalist.name,
      journalist_email: journalist.email,
      outlet: journalist.outlet,
      sequence_name: sequence.name,
      ...step.templateVariables,
    };

    let subject = step.subjectTemplate;
    let body = step.bodyTemplate;

    // Replace template variables
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      subject = subject.replace(new RegExp(placeholder, 'g'), String(value || ''));
      body = body.replace(new RegExp(placeholder, 'g'), String(value || ''));
    }

    // Use LLM if enabled (TODO: Implement LLM integration)
    if (step.useLlmGeneration && step.llmPrompt) {
      // Placeholder for LLM generation
      // In production, this would call the LLM router service
      // For now, we just use the templates as-is
      this.debugMode && console.log('LLM generation requested but not implemented yet');
    }

    return {
      subject,
      body,
      variables,
    };
  }

  // =============================================
  // Targeting & Preview
  // =============================================

  /**
   * Preview targeting - show how many journalists match
   */
  async previewTargeting(sequenceId: string, orgId: string): Promise<TargetingPreview> {
    const sequence = await this.getSequence(sequenceId, orgId);

    let queryBuilder = this.supabase.from('journalists').select('id', { count: 'exact' });

    // Apply filters
    if (sequence.journalistIds.length > 0) {
      queryBuilder = queryBuilder.in('id', sequence.journalistIds);
    }

    if (sequence.outletIds.length > 0) {
      queryBuilder = queryBuilder.in('outlet_id', sequence.outletIds);
    }

    if (sequence.beatFilter && sequence.beatFilter.length > 0) {
      queryBuilder = queryBuilder.overlaps('beats', sequence.beatFilter);
    }

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to preview targeting: ${error.message}`);
    }

    return {
      matchingJournalists: count || 0,
      journalistIds: (data || []).map((j) => j.id),
      summary: `${count || 0} journalists match targeting criteria`,
    };
  }

  // =============================================
  // Stats
  // =============================================

  /**
   * Get outreach stats
   */
  async getStats(orgId: string, sequenceId?: string): Promise<OutreachStats> {
    const { data, error } = await this.supabase.rpc('get_outreach_stats', {
      p_org_id: orgId,
      p_sequence_id: sequenceId || null,
    });

    if (error) {
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    return {
      totalSequences: data.total_sequences || 0,
      activeSequences: data.active_sequences || 0,
      totalRuns: data.total_runs || 0,
      activeRuns: data.active_runs || 0,
      completedRuns: data.completed_runs || 0,
      totalEmailsSent: data.total_emails_sent || 0,
      totalOpens: data.total_opens || 0,
      totalClicks: data.total_clicks || 0,
      totalReplies: data.total_replies || 0,
    };
  }

  // =============================================
  // Scheduler Integration
  // =============================================

  /**
   * Process runs that need advancement (called by scheduler)
   */
  async processScheduledRuns(): Promise<{ processed: number; errors: number }> {
    const now = new Date();

    const { data: dueRuns, error } = await this.supabase
      .from('pr_outreach_runs')
      .select('*')
      .eq('status', 'running')
      .lte('next_step_at', now.toISOString())
      .limit(100);

    if (error) {
      throw new Error(`Failed to get scheduled runs: ${error.message}`);
    }

    let processed = 0;
    let errors = 0;

    for (const runData of dueRuns || []) {
      try {
        await this.advanceRun(runData.id, runData.org_id, false);
        processed++;
      } catch (err) {
        errors++;
        if (this.debugMode) {
          console.error(`Failed to advance run ${runData.id}:`, err);
        }
      }
    }

    return { processed, errors };
  }

  // =============================================
  // Mappers
  // =============================================

  private mapSequenceFromDb(data: any): OutreachSequence {
    return {
      id: data.id,
      orgId: data.org_id,
      name: data.name,
      description: data.description,
      journalistIds: data.journalist_ids || [],
      outletIds: data.outlet_ids || [],
      beatFilter: data.beat_filter,
      tierFilter: data.tier_filter,
      isActive: data.is_active,
      maxRunsPerDay: data.max_runs_per_day,
      stopOnReply: data.stop_on_reply,
      pitchId: data.pitch_id,
      pressReleaseId: data.press_release_id,
      totalRuns: data.total_runs,
      completedRuns: data.completed_runs,
      activeRuns: data.active_runs,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapStepFromDb(data: any): OutreachSequenceStep {
    return {
      id: data.id,
      sequenceId: data.sequence_id,
      stepNumber: data.step_number,
      delayHours: data.delay_hours,
      subjectTemplate: data.subject_template,
      bodyTemplate: data.body_template,
      templateVariables: data.template_variables || {},
      useLlmGeneration: data.use_llm_generation,
      llmPrompt: data.llm_prompt,
      llmModel: data.llm_model,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapRunFromDb(data: any): OutreachRun {
    return {
      id: data.id,
      orgId: data.org_id,
      sequenceId: data.sequence_id,
      journalistId: data.journalist_id,
      status: data.status as OutreachRunStatus,
      currentStepNumber: data.current_step_number,
      nextStepAt: data.next_step_at ? new Date(data.next_step_at) : null,
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      stoppedAt: data.stopped_at ? new Date(data.stopped_at) : null,
      stopReason: data.stop_reason as OutreachStopReason | null,
      totalStepsSent: data.total_steps_sent,
      lastSentAt: data.last_sent_at ? new Date(data.last_sent_at) : null,
      repliedAt: data.replied_at ? new Date(data.replied_at) : null,
      replyStepNumber: data.reply_step_number,
      lastError: data.last_error,
      retryCount: data.retry_count,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  private mapEventFromDb(data: any): OutreachEvent {
    return {
      id: data.id,
      orgId: data.org_id,
      runId: data.run_id,
      sequenceId: data.sequence_id,
      stepId: data.step_id,
      eventType: data.event_type as OutreachEventType,
      stepNumber: data.step_number,
      emailSubject: data.email_subject,
      emailBody: data.email_body,
      recipientEmail: data.recipient_email,
      sentAt: data.sent_at ? new Date(data.sent_at) : null,
      openedAt: data.opened_at ? new Date(data.opened_at) : null,
      clickedAt: data.clicked_at ? new Date(data.clicked_at) : null,
      repliedAt: data.replied_at ? new Date(data.replied_at) : null,
      bouncedAt: data.bounced_at ? new Date(data.bounced_at) : null,
      failedAt: data.failed_at ? new Date(data.failed_at) : null,
      metadata: data.metadata || {},
      errorMessage: data.error_message,
      createdAt: new Date(data.created_at),
    };
  }
}

/**
 * Factory function to create service instance
 */
export function createOutreachService(config: OutreachServiceConfig): OutreachService {
  return new OutreachService(config);
}
