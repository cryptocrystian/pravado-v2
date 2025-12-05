/**
 * Playbook Runs API Routes (Sprint S19)
 * Read-only endpoints for live execution viewer
 * Enhanced with SSE streaming (Sprint S21)
 */

import type { PlaybookRunView, StepRunView } from '@pravado/types';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import { createClient } from '@supabase/supabase-js';
import { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: any): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('user_orgs')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return userOrgs?.org_id || null;
}

export async function playbookRunsRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  /**
   * GET /api/v1/playbook-runs/:id
   * Get aggregated run + all step runs with memory, collaboration, personality
   */
  server.get<{
    Params: { id: string };
  }>(
    '/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Fetch run
        const { data: run, error: runError } = await supabase
          .from('playbook_runs')
          .select('*')
          .eq('id', request.params.id)
          .eq('org_id', orgId)
          .single();

        if (runError || !run) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook run not found',
            },
          });
        }

        // Fetch playbook details
        const { data: playbook } = await supabase
          .from('playbooks')
          .select('name, version')
          .eq('id', run.playbook_id)
          .single();

        // Fetch all step runs
        const { data: stepRuns, error: stepsError } = await supabase
          .from('playbook_step_runs')
          .select('*')
          .eq('run_id', request.params.id)
          .order('created_at', { ascending: true });

        if (stepsError) {
          throw new Error(`Failed to fetch step runs: ${stepsError.message}`);
        }

        // Fetch step details for each step run
        const stepIds = stepRuns?.map((sr) => sr.step_id) || [];
        const { data: steps } = await supabase
          .from('playbook_steps')
          .select('id, key, name, type, config')
          .in('id', stepIds);

        const stepMap = new Map(steps?.map((s) => [s.id, s]) || []);

        // Fetch episodic traces for this run
        const { data: episodicTraces } = await supabase
          .from('episodic_traces')
          .select('*')
          .eq('run_id', request.params.id);

        const tracesByStepKey = new Map<string, any[]>();
        episodicTraces?.forEach((trace) => {
          const existing = tracesByStepKey.get(trace.step_key) || [];
          existing.push(trace);
          tracesByStepKey.set(trace.step_key, existing);
        });

        // Fetch personality assignments for AGENT steps
        const agentStepIds = steps?.filter((s) => s.type === 'AGENT').map((s) => s.id) || [];
        const { data: personalities } = await supabase
          .from('personality_assignments')
          .select(`
            agent_id,
            personality:agent_personalities!inner (
              id,
              slug,
              name,
              description,
              configuration
            )
          `)
          .in('agent_id', agentStepIds);

        const personalityMap = new Map(
          personalities?.map((p: any) => [
            p.agent_id,
            Array.isArray(p.personality) ? p.personality[0] : p.personality
          ]) || []
        );

        // Build enriched step runs
        const enrichedSteps: StepRunView[] = (stepRuns || []).map((stepRun) => {
          const step = stepMap.get(stepRun.step_id);
          const traces = tracesByStepKey.get(stepRun.step_key) || [];
          const personality = step?.type === 'AGENT' ? personalityMap.get(step.id) : null;

          return {
            id: stepRun.id,
            key: stepRun.step_key,
            name: step?.name || stepRun.step_key,
            type: step?.type || 'AGENT',
            state: stepRun.state || 'queued',
            status: stepRun.status,
            attempt: stepRun.attempt || 0,
            maxAttempts: stepRun.max_attempts || 3,
            input: stepRun.input,
            output: stepRun.output,
            error: stepRun.error,
            logs: stepRun.logs || [],
            workerInfo: stepRun.worker_info || null,
            collaborationContext: stepRun.collaboration_context || null,
            episodicTraces: traces,
            personality: personality || null,
            startedAt: stepRun.started_at,
            completedAt: stepRun.completed_at,
            createdAt: stepRun.created_at,
          };
        });

        // Build run view
        const runView: PlaybookRunView = {
          id: run.id,
          playbookId: run.playbook_id,
          playbookName: playbook?.name || 'Unknown Playbook',
          playbookVersion: playbook?.version || 1,
          orgId: run.org_id,
          state: run.state || 'queued',
          status: run.status,
          triggeredBy: run.triggered_by,
          input: run.input,
          output: run.output,
          error: run.error,
          webhookUrl: run.webhook_url,
          workerInfo: run.worker_info || null,
          startedAt: run.started_at,
          completedAt: run.completed_at,
          createdAt: run.created_at,
          updatedAt: run.updated_at,
          steps: enrichedSteps,
          progress: {
            total: enrichedSteps.length,
            completed: enrichedSteps.filter((s) => s.state === 'success').length,
            failed: enrichedSteps.filter((s) => s.state === 'failed').length,
            running: enrichedSteps.filter((s) => s.state === 'running').length,
            pending: enrichedSteps.filter((s) =>
              ['queued', 'waiting_for_dependencies'].includes(s.state || '')
            ).length,
          },
        };

        return {
          success: true,
          data: runView,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch playbook run',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbook-runs/:id/steps/:stepKey
   * Get detailed step run view
   */
  server.get<{
    Params: { id: string; stepKey: string };
  }>(
    '/:id/steps/:stepKey',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const orgId = await getUserOrgId(request.user!.id!, supabase);
        if (!orgId) {
          return reply.code(403).send({
            success: false,
            error: {
              code: 'NO_ORG_ACCESS',
              message: 'User is not a member of any organization',
            },
          });
        }

        // Verify run belongs to org
        const { data: run } = await supabase
          .from('playbook_runs')
          .select('org_id, playbook_id')
          .eq('id', request.params.id)
          .single();

        if (!run || run.org_id !== orgId) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Playbook run not found',
            },
          });
        }

        // Fetch step run
        const { data: stepRun, error: stepError } = await supabase
          .from('playbook_step_runs')
          .select('*')
          .eq('run_id', request.params.id)
          .eq('step_key', request.params.stepKey)
          .single();

        if (stepError || !stepRun) {
          return reply.code(404).send({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Step run not found',
            },
          });
        }

        // Fetch step details
        const { data: step } = await supabase
          .from('playbook_steps')
          .select('*')
          .eq('id', stepRun.step_id)
          .single();

        // Fetch episodic traces
        const { data: traces } = await supabase
          .from('episodic_traces')
          .select('*')
          .eq('run_id', request.params.id)
          .eq('step_key', request.params.stepKey);

        // Fetch personality if AGENT step
        let personality = null;
        if (step?.type === 'AGENT') {
          const { data: personalityAssignment } = await supabase
            .from('personality_assignments')
            .select(`
              personality:agent_personalities!inner (
                id,
                slug,
                name,
                description,
                configuration
              )
            `)
            .eq('agent_id', step.id)
            .single();

          if (personalityAssignment) {
            const pers: any = personalityAssignment.personality;
            personality = Array.isArray(pers) ? pers[0] : pers;
          }
        }

        const stepView: StepRunView = {
          id: stepRun.id,
          key: stepRun.step_key,
          name: step?.name || stepRun.step_key,
          type: step?.type || 'AGENT',
          state: stepRun.state || 'queued',
          status: stepRun.status,
          attempt: stepRun.attempt || 0,
          maxAttempts: stepRun.max_attempts || 3,
          input: stepRun.input,
          output: stepRun.output,
          error: stepRun.error,
          logs: stepRun.logs || [],
          workerInfo: stepRun.worker_info || null,
          collaborationContext: stepRun.collaboration_context || null,
          episodicTraces: traces || [],
          personality,
          startedAt: stepRun.started_at,
          completedAt: stepRun.completed_at,
          createdAt: stepRun.created_at,
        };

        return {
          success: true,
          data: stepView,
        };
      } catch (error: any) {
        return reply.code(500).send({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: error.message || 'Failed to fetch step run',
          },
        });
      }
    }
  );

  /**
   * GET /api/v1/playbook-runs/:id/stream
   * STUB: Redirects to main run endpoint (Sprint S19)
   * TODO: Implement SSE streaming in Sprint S21
   */
  server.get<{
    Params: { id: string };
  }>(
    '/:id/stream',
    async (request, reply) => {
      const runId = request.params.id;

      // Stub: Redirect to main run view endpoint
      // In Sprint S21, this will become a real-time SSE/WebSocket endpoint
      return reply.redirect(303, `/api/v1/playbook-runs/${runId}`);
    }
  );
}
