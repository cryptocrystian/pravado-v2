/**
 * Governance Routes (Sprint S59)
 * REST endpoints for governance, compliance & audit intelligence engine
 *
 * Endpoints:
 * - Policies: CRUD for governance policies
 * - Rules: CRUD for governance rules
 * - Findings: CRUD and lifecycle management
 * - Risk Scores: Risk score management
 * - Insights: Audit insights generation
 * - Dashboard: Summary and analytics
 * - Evaluation: Rule evaluation engine
 */

import { FLAGS } from '@pravado/feature-flags';
import {
  createGovernancePolicyInputSchema,
  updateGovernancePolicyInputSchema,
  createGovernanceRuleInputSchema,
  updateGovernanceRuleInputSchema,
  createGovernanceFindingInputSchema,
  updateGovernanceFindingInputSchema,
  upsertGovernanceRiskScoreInputSchema,
  governancePoliciesQuerySchema,
  governanceRulesQuerySchema,
  governanceFindingsQuerySchema,
  governanceRiskScoresQuerySchema,
  governanceAuditInsightsQuerySchema,
  governancePolicyIdParamSchema,
  governanceRuleIdParamSchema,
  governanceFindingIdParamSchema,
  governanceInsightIdParamSchema,
  acknowledgeFindingRequestSchema,
  resolveFindingRequestSchema,
  dismissFindingRequestSchema,
  escalateFindingRequestSchema,
  generateGovernanceInsightRequestSchema,
  batchEvaluationRequestSchema,
  recalculateRiskScoreRequestSchema,
  apiEnvSchema,
  validateEnv,
} from '@pravado/validators';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import type { FastifyInstance } from 'fastify';

import { requireUser } from '../../middleware/requireUser';
import { GovernanceService } from '../../services/governanceService';

/**
 * Helper to get user's org ID
 */
async function getUserOrgId(userId: string, supabase: SupabaseClient): Promise<string | null> {
  const { data: userOrgs } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  return userOrgs?.org_id || null;
}

/**
 * Helper to convert null values to undefined for type compatibility
 * Validator schemas use .nullable().optional() producing T | null | undefined,
 * but service types expect T | undefined
 */
function stripNulls<T extends Record<string, unknown>>(obj: T): { [K in keyof T]: Exclude<T[K], null> } {
  const result = {} as { [K in keyof T]: Exclude<T[K], null> };
  for (const key in obj) {
    const value = obj[key];
    result[key] = (value === null ? undefined : value) as Exclude<T[typeof key], null>;
  }
  return result;
}

/**
 * Register governance routes
 */
export async function governanceRoutes(server: FastifyInstance): Promise<void> {
  // Check if governance feature is enabled
  if (!FLAGS.ENABLE_GOVERNANCE) {
    server.get('/', { preHandler: requireUser }, async (_request, reply) => {
      return reply.code(503).send({
        success: false,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Governance feature is not enabled',
        },
      });
    });
    return;
  }

  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const governanceService = new GovernanceService(supabase);

  // ========================================
  // Policy Routes
  // ========================================

  /**
   * GET /api/v1/governance/policies
   * List governance policies
   */
  server.get(
    '/policies',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governancePoliciesQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parseResult.error.errors },
          });
        }

        const result = await governanceService.listPolicies(orgId, parseResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to list policies', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/policies
   * Create a new governance policy
   */
  server.post(
    '/policies',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = createGovernancePolicyInputSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        const policy = await governanceService.createPolicy(orgId, parseResult.data, userId);
        return reply.code(201).send({ success: true, data: policy });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to create policy', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/governance/policies/:id
   * Get a policy by ID with detail
   */
  server.get<{ Params: { id: string } }>(
    '/policies/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governancePolicyIdParamSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid policy ID' },
          });
        }

        const result = await governanceService.getPolicyDetail(orgId, parseResult.data.id);
        if (!result) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Policy not found' },
          });
        }

        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get policy', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/governance/policies/:id
   * Update a policy
   */
  server.patch<{ Params: { id: string } }>(
    '/policies/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramsResult = governancePolicyIdParamSchema.safeParse(request.params);
        if (!paramsResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid policy ID' },
          });
        }

        const bodyResult = updateGovernancePolicyInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const policy = await governanceService.updatePolicy(orgId, paramsResult.data.id, stripNulls(bodyResult.data), userId);
        return reply.send({ success: true, data: policy });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to update policy', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * DELETE /api/v1/governance/policies/:id
   * Delete a policy
   */
  server.delete<{ Params: { id: string } }>(
    '/policies/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governancePolicyIdParamSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid policy ID' },
          });
        }

        await governanceService.deletePolicy(orgId, parseResult.data.id);
        return reply.code(204).send();
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to delete policy', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/governance/policies/:id/versions
   * Get policy version history
   */
  server.get<{ Params: { id: string } }>(
    '/policies/:id/versions',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governancePolicyIdParamSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid policy ID' },
          });
        }

        const result = await governanceService.getPolicyVersions(orgId, parseResult.data.id);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get policy versions', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Rule Routes
  // ========================================

  /**
   * GET /api/v1/governance/rules
   * List governance rules
   */
  server.get(
    '/rules',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceRulesQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parseResult.error.errors },
          });
        }

        const result = await governanceService.listRules(orgId, parseResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to list rules', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/rules
   * Create a new governance rule
   */
  server.post(
    '/rules',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = createGovernanceRuleInputSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        const rule = await governanceService.createRule(orgId, parseResult.data, userId);
        return reply.code(201).send({ success: true, data: rule });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to create rule', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/governance/rules/:id
   * Get a rule by ID
   */
  server.get<{ Params: { id: string } }>(
    '/rules/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceRuleIdParamSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid rule ID' },
          });
        }

        const rule = await governanceService.getRule(orgId, parseResult.data.id);
        if (!rule) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Rule not found' },
          });
        }

        return reply.send({ success: true, data: rule });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get rule', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/governance/rules/:id
   * Update a rule
   */
  server.patch<{ Params: { id: string } }>(
    '/rules/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramsResult = governanceRuleIdParamSchema.safeParse(request.params);
        if (!paramsResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid rule ID' },
          });
        }

        const bodyResult = updateGovernanceRuleInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const rule = await governanceService.updateRule(orgId, paramsResult.data.id, stripNulls(bodyResult.data), userId);
        return reply.send({ success: true, data: rule });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to update rule', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * DELETE /api/v1/governance/rules/:id
   * Delete a rule
   */
  server.delete<{ Params: { id: string } }>(
    '/rules/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceRuleIdParamSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid rule ID' },
          });
        }

        await governanceService.deleteRule(orgId, parseResult.data.id);
        return reply.code(204).send();
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to delete rule', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Finding Routes
  // ========================================

  /**
   * GET /api/v1/governance/findings
   * List governance findings
   */
  server.get(
    '/findings',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceFindingsQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parseResult.error.errors },
          });
        }

        const result = await governanceService.listFindings(orgId, parseResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to list findings', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/findings
   * Create a new finding (typically done by rule evaluation)
   */
  server.post(
    '/findings',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = createGovernanceFindingInputSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        const finding = await governanceService.createFinding(orgId, parseResult.data);
        return reply.code(201).send({ success: true, data: finding });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to create finding', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/governance/findings/:id
   * Get a finding by ID with detail
   */
  server.get<{ Params: { id: string } }>(
    '/findings/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceFindingIdParamSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid finding ID' },
          });
        }

        const result = await governanceService.getFindingDetail(orgId, parseResult.data.id);
        if (!result) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Finding not found' },
          });
        }

        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get finding', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * PATCH /api/v1/governance/findings/:id
   * Update a finding
   */
  server.patch<{ Params: { id: string } }>(
    '/findings/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramsResult = governanceFindingIdParamSchema.safeParse(request.params);
        if (!paramsResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid finding ID' },
          });
        }

        const bodyResult = updateGovernanceFindingInputSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: bodyResult.error.errors },
          });
        }

        const finding = await governanceService.updateFinding(orgId, paramsResult.data.id, stripNulls(bodyResult.data), userId);
        return reply.send({ success: true, data: finding });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to update finding', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/findings/:id/acknowledge
   * Acknowledge a finding
   */
  server.post<{ Params: { id: string } }>(
    '/findings/:id/acknowledge',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramsResult = governanceFindingIdParamSchema.safeParse(request.params);
        if (!paramsResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid finding ID' },
          });
        }

        const bodyResult = acknowledgeFindingRequestSchema.safeParse(request.body || {});
        const finding = await governanceService.acknowledgeFinding(
          orgId,
          paramsResult.data.id,
          bodyResult.success ? bodyResult.data.notes : undefined
        );
        return reply.send({ success: true, data: finding });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to acknowledge finding', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/findings/:id/resolve
   * Resolve a finding
   */
  server.post<{ Params: { id: string } }>(
    '/findings/:id/resolve',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramsResult = governanceFindingIdParamSchema.safeParse(request.params);
        if (!paramsResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid finding ID' },
          });
        }

        const bodyResult = resolveFindingRequestSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Resolution notes are required' },
          });
        }

        const finding = await governanceService.resolveFinding(
          orgId,
          paramsResult.data.id,
          bodyResult.data.resolutionNotes,
          userId
        );
        return reply.send({ success: true, data: finding });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to resolve finding', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/findings/:id/dismiss
   * Dismiss a finding
   */
  server.post<{ Params: { id: string } }>(
    '/findings/:id/dismiss',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramsResult = governanceFindingIdParamSchema.safeParse(request.params);
        if (!paramsResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid finding ID' },
          });
        }

        const bodyResult = dismissFindingRequestSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Dismissal reason is required' },
          });
        }

        const finding = await governanceService.dismissFinding(
          orgId,
          paramsResult.data.id,
          bodyResult.data.reason
        );
        return reply.send({ success: true, data: finding });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to dismiss finding', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/findings/:id/escalate
   * Escalate a finding
   */
  server.post<{ Params: { id: string } }>(
    '/findings/:id/escalate',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const paramsResult = governanceFindingIdParamSchema.safeParse(request.params);
        if (!paramsResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid finding ID' },
          });
        }

        const bodyResult = escalateFindingRequestSchema.safeParse(request.body);
        if (!bodyResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Escalation target is required' },
          });
        }

        const finding = await governanceService.escalateFinding(
          orgId,
          paramsResult.data.id,
          bodyResult.data.escalateTo,
          bodyResult.data.notes
        );
        return reply.send({ success: true, data: finding });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to escalate finding', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Risk Score Routes
  // ========================================

  /**
   * GET /api/v1/governance/risk-scores
   * List risk scores
   */
  server.get(
    '/risk-scores',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceRiskScoresQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parseResult.error.errors },
          });
        }

        const result = await governanceService.listRiskScores(orgId, parseResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to list risk scores', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * PUT /api/v1/governance/risk-scores
   * Upsert a risk score
   */
  server.put(
    '/risk-scores',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = upsertGovernanceRiskScoreInputSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        const riskScore = await governanceService.upsertRiskScore(orgId, parseResult.data);
        return reply.send({ success: true, data: riskScore });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to upsert risk score', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/risk-scores/recalculate
   * Recalculate a risk score
   */
  server.post(
    '/risk-scores/recalculate',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = recalculateRiskScoreRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        // Get existing risk score
        const existing = await governanceService.getRiskScore(
          orgId,
          parseResult.data.entityType,
          parseResult.data.entityId
        );

        if (!existing && !parseResult.data.force) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Risk score not found' },
          });
        }

        // Recalculate (for now, just mark as non-stale)
        // In a full implementation, this would aggregate findings and compute dimensional scores
        const riskScore = await governanceService.upsertRiskScore(orgId, {
          entityType: parseResult.data.entityType,
          entityId: parseResult.data.entityId,
          entityName: existing?.entityName,
          overallScore: existing?.overallScore || 50,
          riskLevel: existing?.riskLevel || 'medium',
          contentRisk: existing?.contentRisk,
          reputationRisk: existing?.reputationRisk,
          crisisRisk: existing?.crisisRisk,
          legalRisk: existing?.legalRisk,
          relationshipRisk: existing?.relationshipRisk,
          competitiveRisk: existing?.competitiveRisk,
        });

        return reply.send({ success: true, data: riskScore });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to recalculate risk score', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Audit Insight Routes
  // ========================================

  /**
   * GET /api/v1/governance/insights
   * List audit insights
   */
  server.get(
    '/insights',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceAuditInsightsQuerySchema.safeParse(request.query);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters', details: parseResult.error.errors },
          });
        }

        const result = await governanceService.listAuditInsights(orgId, parseResult.data);
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to list insights', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * POST /api/v1/governance/insights/generate
   * Generate a new audit insight
   */
  server.post(
    '/insights/generate',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = generateGovernanceInsightRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        // Get dashboard summary for the period
        const summary = await governanceService.getDashboardSummary(orgId);

        // Create insight
        const insight = await governanceService.createAuditInsight(orgId, {
          timeWindowStart: parseResult.data.timeWindowStart,
          timeWindowEnd: parseResult.data.timeWindowEnd,
          scope: parseResult.data.scope,
          insightType: parseResult.data.insightType,
          title: `Governance Report: ${parseResult.data.timeWindowStart.toISOString().split('T')[0]} - ${parseResult.data.timeWindowEnd.toISOString().split('T')[0]}`,
          summary: `Total findings: ${summary.totalFindings}, Open: ${summary.openFindings}, High risk entities: ${summary.highRiskEntities}`,
          topRisks: summary.topRisks,
          metricsSnapshot: {
            totalPolicies: summary.totalPolicies,
            activePolicies: summary.activePolicies,
            totalRules: summary.totalRules,
            activeRules: summary.activeRules,
            totalFindings: summary.totalFindings,
            openFindings: summary.openFindings,
            avgRiskScore: summary.avgRiskScore,
          },
          generatedBy: parseResult.data.useLlm ? 'llm_assisted' : 'rule_based',
          llmModel: parseResult.data.llmModel,
        }, userId);

        return reply.code(201).send({ success: true, data: insight });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to generate insight', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/governance/insights/:id
   * Get an insight by ID
   */
  server.get<{ Params: { id: string } }>(
    '/insights/:id',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = governanceInsightIdParamSchema.safeParse(request.params);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid insight ID' },
          });
        }

        const insight = await governanceService.getAuditInsight(orgId, parseResult.data.id);
        if (!insight) {
          return reply.code(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Insight not found' },
          });
        }

        return reply.send({ success: true, data: insight });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get insight', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Dashboard & Analytics Routes
  // ========================================

  /**
   * GET /api/v1/governance/dashboard
   * Get governance dashboard summary
   */
  server.get(
    '/dashboard',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const summary = await governanceService.getDashboardSummary(orgId);
        return reply.send({ success: true, data: summary });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get dashboard', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/governance/compliance-metrics
   * Get compliance metrics
   */
  server.get<{ Querystring: { days?: string } }>(
    '/compliance-metrics',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const days = request.query.days ? parseInt(request.query.days, 10) : 30;
        const metrics = await governanceService.getComplianceMetrics(orgId, days);
        return reply.send({ success: true, data: metrics });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get compliance metrics', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  /**
   * GET /api/v1/governance/risk-heatmap
   * Get risk heatmap data
   */
  server.get(
    '/risk-heatmap',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const heatmap = await governanceService.getRiskHeatmap(orgId);
        return reply.send({ success: true, data: heatmap });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to get risk heatmap', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );

  // ========================================
  // Rule Evaluation Routes
  // ========================================

  /**
   * POST /api/v1/governance/evaluate
   * Evaluate governance rules against an event
   */
  server.post(
    '/evaluate',
    { preHandler: requireUser },
    async (request, reply) => {
      try {
        const userId = request.user!.id;
        const orgId = await getUserOrgId(userId, supabase);

        if (!orgId) {
          return reply.code(404).send({
            success: false,
            error: { code: 'ORG_NOT_FOUND', message: 'Organization not found' },
          });
        }

        const parseResult = batchEvaluationRequestSchema.safeParse(request.body);
        if (!parseResult.success) {
          return reply.code(400).send({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'Invalid request body', details: parseResult.error.errors },
          });
        }

        const result = await governanceService.evaluateRules(
          orgId,
          parseResult.data.context,
          parseResult.data.ruleIds
        );
        return reply.send({ success: true, data: result });
      } catch (err) {
        const error = err as Error;
        console.error('[Governance] Failed to evaluate rules', { error });
        return reply.code(500).send({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: error.message },
        });
      }
    }
  );
}
