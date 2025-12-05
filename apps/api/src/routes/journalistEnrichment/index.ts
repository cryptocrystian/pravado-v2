/**
 * Journalist Enrichment API Routes (Sprint S50)
 * RESTful endpoints for Smart Media Contact Enrichment Engine
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createClient } from '@supabase/supabase-js';
import { validateEnv, apiEnvSchema } from '@pravado/validators';
import {
  BatchEnrichmentRequestSchema,
  CreateEnrichmentJobInputSchema,
  CreateEnrichmentRecordInputSchema,
  EnrichmentJobsQuerySchema,
  EnrichmentLinksQuerySchema,
  EnrichmentRecordsQuerySchema,
  MergeEnrichmentInputSchema,
  UpdateEnrichmentRecordInputSchema,
} from '@pravado/validators';
import { JournalistEnrichmentService } from '../../services/journalistEnrichmentService';

// Helper to get org ID from request
function getOrgId(request: FastifyRequest): string {
  const orgId = request.headers['x-org-id'] as string;
  if (!orgId) {
    throw new Error('Organization ID is required');
  }
  return orgId;
}

// Helper to get user ID from request
function getUserId(request: FastifyRequest): string | undefined {
  return request.headers['x-user-id'] as string | undefined;
}

export default async function journalistEnrichmentRoutes(server: FastifyInstance) {
  const env = validateEnv(apiEnvSchema);
  const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const service = new JournalistEnrichmentService(supabase);

  // ========================================
  // POST /api/v1/journalist-enrichment/generate
  // Generate enrichment for single contact
  // ========================================

  server.post('/generate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);

      const input = CreateEnrichmentRecordInputSchema.parse(request.body);

      const record = await service.createRecord(orgId, input as Parameters<typeof service.createRecord>[1], userId);

      return reply.status(201).send(record);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to generate enrichment');
      const message = error instanceof Error ? error.message : 'Failed to generate enrichment';
      return reply.status(message.includes('required') ? 400 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // POST /api/v1/journalist-enrichment/batch
  // Batch enrichment processing
  // ========================================

  server.post('/batch', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);

      const input = BatchEnrichmentRequestSchema.parse(request.body);

      const result = await service.batchEnrich(orgId, input, userId);

      return reply.status(202).send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to start batch enrichment');
      const message = error instanceof Error ? error.message : 'Failed to start batch enrichment';
      return reply.status(message.includes('required') ? 400 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // GET /api/v1/journalist-enrichment/records
  // List enrichment records with filtering
  // ========================================

  server.get('/records', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      // Parse query parameters
      const query = EnrichmentRecordsQuerySchema.parse({
        sourceTypes: queryParams.sourceTypes ? (Array.isArray(queryParams.sourceTypes) ? queryParams.sourceTypes : [queryParams.sourceTypes]) : undefined,
        status: queryParams.status ? (Array.isArray(queryParams.status) ? queryParams.status : [queryParams.status]) : undefined,
        minConfidenceScore: queryParams.minConfidenceScore ? Number(queryParams.minConfidenceScore) : undefined,
        maxConfidenceScore: queryParams.maxConfidenceScore ? Number(queryParams.maxConfidenceScore) : undefined,
        minCompletenessScore: queryParams.minCompletenessScore ? Number(queryParams.minCompletenessScore) : undefined,
        emailVerified: queryParams.emailVerified === 'true' ? true : queryParams.emailVerified === 'false' ? false : undefined,
        hasEmail: queryParams.hasEmail === 'true' ? true : queryParams.hasEmail === 'false' ? false : undefined,
        hasPhone: queryParams.hasPhone === 'true' ? true : queryParams.hasPhone === 'false' ? false : undefined,
        hasSocialProfiles: queryParams.hasSocialProfiles === 'true' ? true : queryParams.hasSocialProfiles === 'false' ? false : undefined,
        outlet: queryParams.outlet as string | undefined,
        qualityFlags: queryParams.qualityFlags ? (Array.isArray(queryParams.qualityFlags) ? queryParams.qualityFlags : [queryParams.qualityFlags]) : undefined,
        hasPotentialDuplicates: queryParams.hasPotentialDuplicates === 'true' ? true : queryParams.hasPotentialDuplicates === 'false' ? false : undefined,
        searchQuery: queryParams.searchQuery as string | undefined,
        sortBy: queryParams.sortBy as string | undefined,
        sortOrder: queryParams.sortOrder as string | undefined,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      });

      const result = await service.listRecords(orgId, query);

      return reply.send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to list enrichment records');
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to list enrichment records',
      });
    }
  });

  // ========================================
  // GET /api/v1/journalist-enrichment/records/:id
  // Get single enrichment record
  // ========================================

  server.get('/records/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };

      const record = await service.getRecord(orgId, id);

      return reply.send(record);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to get enrichment record');
      const message = error instanceof Error ? error.message : 'Failed to get enrichment record';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // PATCH /api/v1/journalist-enrichment/records/:id
  // Update enrichment record
  // ========================================

  server.patch('/records/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };

      const input = UpdateEnrichmentRecordInputSchema.parse(request.body);

      const record = await service.updateRecord(orgId, id, input as Parameters<typeof service.updateRecord>[2]);

      return reply.send(record);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to update enrichment record');
      const message = error instanceof Error ? error.message : 'Failed to update enrichment record';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // DELETE /api/v1/journalist-enrichment/records/:id
  // Delete enrichment record
  // ========================================

  server.delete('/records/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };

      await service.deleteRecord(orgId, id);

      return reply.send({ success: true });
    } catch (error) {
      server.log.error({ err: error }, 'Failed to delete enrichment record');
      const message = error instanceof Error ? error.message : 'Failed to delete enrichment record';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // GET /api/v1/journalist-enrichment/jobs
  // List enrichment jobs
  // ========================================

  server.get('/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const query = EnrichmentJobsQuerySchema.parse({
        jobType: queryParams.jobType ? (Array.isArray(queryParams.jobType) ? queryParams.jobType : [queryParams.jobType]) : undefined,
        status: queryParams.status ? (Array.isArray(queryParams.status) ? queryParams.status : [queryParams.status]) : undefined,
        createdBy: queryParams.createdBy as string | undefined,
        minProgressPercentage: queryParams.minProgressPercentage ? Number(queryParams.minProgressPercentage) : undefined,
        sortBy: queryParams.sortBy as string | undefined,
        sortOrder: queryParams.sortOrder as string | undefined,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      });

      const result = await service.listJobs(orgId, query);

      return reply.send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to list enrichment jobs');
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to list enrichment jobs',
      });
    }
  });

  // ========================================
  // GET /api/v1/journalist-enrichment/suggestions/:id
  // Get merge suggestions for record
  // ========================================

  server.get('/suggestions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const { id } = request.params as { id: string };

      const suggestions = await service.generateMergeSuggestions(orgId, id);

      return reply.send(suggestions);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to get merge suggestions');
      const message = error instanceof Error ? error.message : 'Failed to get merge suggestions';
      return reply.status(message.includes('not found') ? 404 : 500).send({
        error: message,
      });
    }
  });

  // ========================================
  // POST /api/v1/journalist-enrichment/merge
  // Merge enrichment into journalist profile
  // ========================================

  server.post('/merge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);

      const input = MergeEnrichmentInputSchema.parse(request.body);

      await service.mergeEnrichment(orgId, input, userId);

      return reply.send({ success: true });
    } catch (error) {
      server.log.error({ err: error }, 'Failed to merge enrichment');
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to merge enrichment',
      });
    }
  });

  // ========================================
  // POST /api/v1/journalist-enrichment/jobs
  // Create enrichment job
  // ========================================

  server.post('/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const userId = getUserId(request);

      const input = CreateEnrichmentJobInputSchema.parse(request.body);

      const job = await service.createJob(orgId, input, userId);

      return reply.status(201).send(job);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to create enrichment job');
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to create enrichment job',
      });
    }
  });

  // ========================================
  // GET /api/v1/journalist-enrichment/links
  // List enrichment links
  // ========================================

  server.get('/links', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const orgId = getOrgId(request);
      const queryParams = request.query as Record<string, unknown>;

      const query = EnrichmentLinksQuerySchema.parse({
        journalistId: queryParams.journalistId as string | undefined,
        enrichmentRecordId: queryParams.enrichmentRecordId as string | undefined,
        linkType: queryParams.linkType ? (Array.isArray(queryParams.linkType) ? queryParams.linkType : [queryParams.linkType]) : undefined,
        isMerged: queryParams.isMerged === 'true' ? true : queryParams.isMerged === 'false' ? false : undefined,
        sortBy: queryParams.sortBy as string | undefined,
        sortOrder: queryParams.sortOrder as string | undefined,
        limit: queryParams.limit ? Number(queryParams.limit) : undefined,
        offset: queryParams.offset ? Number(queryParams.offset) : undefined,
      });

      const result = await service.listLinks(orgId, query);

      return reply.send(result);
    } catch (error) {
      server.log.error({ err: error }, 'Failed to list enrichment links');
      return reply.status(500).send({
        error: error instanceof Error ? error.message : 'Failed to list enrichment links',
      });
    }
  });
}
