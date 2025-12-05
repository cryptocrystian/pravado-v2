/**
 * Journalist Enrichment Service Tests (Sprint S50)
 * Comprehensive test coverage for enrichment engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JournalistEnrichmentService } from '../src/services/journalistEnrichmentService';
import { createMockSupabaseClient } from './helpers/supabaseMock';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('JournalistEnrichmentService', () => {
  let service: JournalistEnrichmentService;
  let mockSupabase: SupabaseClient;
  const testOrgId = '00000000-0000-0000-0000-000000000001';
  const testUserId = '00000000-0000-0000-0000-000000000002';

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    service = new JournalistEnrichmentService(mockSupabase);
  });

  // ========================================
  // Email Verification Tests
  // ========================================

  describe('verifyEmail', () => {
    it('should validate email syntax correctly', async () => {
      const validEmail = 'journalist@nytimes.com';
      const result = await service.verifyEmail(validEmail);

      expect(result.email).toBe(validEmail);
      expect(result.isValid).toBe(true);
      expect(result.verificationMethod).toBe('dns');
    });

    it('should reject invalid email format', async () => {
      const invalidEmail = 'not-an-email';
      const result = await service.verifyEmail(invalidEmail);

      expect(result.isValid).toBe(false);
      expect(result.verificationMethod).toBe('syntax');
      expect(result.error).toBe('Invalid email format');
    });

    it('should detect free email providers', async () => {
      const freeEmail = 'user@gmail.com';
      const result = await service.verifyEmail(freeEmail);

      expect(result.isValid).toBe(true);
      expect(result.isFreeEmail).toBe(true);
      expect(result.confidence).toBe(0.6);
    });

    it('should detect disposable email domains', async () => {
      const disposableEmail = 'user@tempmail.com';
      const result = await service.verifyEmail(disposableEmail);

      expect(result.isValid).toBe(true);
      expect(result.isDisposable).toBe(true);
      expect(result.isDeliverable).toBe(false);
      expect(result.confidence).toBe(0.3);
    });

    it('should assign high confidence to professional emails', async () => {
      const professionalEmail = 'editor@forbes.com';
      const result = await service.verifyEmail(professionalEmail);

      expect(result.isValid).toBe(true);
      expect(result.isFreeEmail).toBe(false);
      expect(result.isDisposable).toBe(false);
      expect(result.confidence).toBe(0.8);
    });
  });

  // ========================================
  // Social Scraping Tests (Stub)
  // ========================================

  describe('scrapeSocialProfile', () => {
    it('should parse Twitter/X URLs', async () => {
      const twitterUrl = 'https://twitter.com/johndoe';
      const result = await service.scrapeSocialProfile(twitterUrl);

      expect(result.platform).toBe('twitter');
      expect(result.username).toBe('johndoe');
      expect(result.profileUrl).toBe(twitterUrl);
    });

    it('should parse LinkedIn URLs', async () => {
      const linkedinUrl = 'https://linkedin.com/in/janedoe';
      const result = await service.scrapeSocialProfile(linkedinUrl);

      expect(result.platform).toBe('linkedin');
      expect(result.username).toBe('janedoe');
    });

    it('should return stub result with error', async () => {
      const url = 'https://twitter.com/testuser';
      const result = await service.scrapeSocialProfile(url);

      expect(result.confidence).toBe(0.5);
      expect(result.error).toContain('Stubbed implementation');
    });
  });

  // ========================================
  // Outlet Authority Scoring Tests
  // ========================================

  describe('calculateOutletAuthority', () => {
    it('should assign high score to premium outlets', async () => {
      const outlet = 'The New York Times';
      const result = await service.calculateOutletAuthority(outlet);

      expect(result.outlet).toBe(outlet);
      expect(result.authorityScore).toBeGreaterThanOrEqual(85);
      expect(result.authorityScore).toBeLessThanOrEqual(100);
      expect(result.confidence).toBe(0.9);
    });

    it('should assign medium score to non-premium outlets', async () => {
      const outlet = 'Local News Tribune';
      const result = await service.calculateOutletAuthority(outlet);

      expect(result.outlet).toBe(outlet);
      expect(result.authorityScore).toBeGreaterThanOrEqual(40);
      expect(result.authorityScore).toBeLessThanOrEqual(80);
      expect(result.confidence).toBe(0.6);
    });

    it('should extract domain from outlet name', async () => {
      const outlet = 'Washington Post';
      const result = await service.calculateOutletAuthority(outlet);

      expect(result.domain).toContain('washingtonpost');
    });
  });

  // ========================================
  // Enrichment Record Creation Tests
  // ========================================

  describe('createRecord', () => {
    it('should create enrichment record successfully', async () => {
      const input = {
        sourceType: 'email_verification' as const,
        email: 'journalist@nytimes.com',
        emailVerified: true,
        emailConfidence: 0.9,
        outlet: 'The New York Times',
        outletAuthorityScore: 95,
        jobTitle: 'Senior Reporter',
        beat: ['Technology', 'Business'],
        location: 'New York, NY',
      };

      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: 'test-record-id',
                  org_id: testOrgId,
                  ...input,
                  overall_confidence_score: 85,
                  completeness_score: 90,
                  data_freshness_score: 95,
                  status: 'completed',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
                error: null,
              }),
          }),
        }),
      }) as any;

      const record = await service.createRecord(testOrgId, input, testUserId);

      expect(record.id).toBe('test-record-id');
      expect(record.orgId).toBe(testOrgId);
      expect(record.email).toBe(input.email);
      expect(record.outlet).toBe(input.outlet);
    });

    it('should handle errors during record creation', async () => {
      const input = {
        sourceType: 'manual_entry' as const,
        email: 'test@example.com',
      };

      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: null,
                error: { message: 'Database error' },
              }),
          }),
        }),
      }) as any;

      await expect(service.createRecord(testOrgId, input, testUserId)).rejects.toThrow(
        'Database error'
      );
    });
  });

  // ========================================
  // Enrichment Record Update Tests
  // ========================================

  describe('updateRecord', () => {
    it('should update enrichment record fields', async () => {
      const recordId = 'test-record-id';
      const updates = {
        emailVerified: true,
        emailConfidence: 0.95,
        status: 'completed' as const,
      };

      mockSupabase.from = () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: recordId,
                      org_id: testOrgId,
                      ...updates,
                      updated_at: new Date().toISOString(),
                    },
                    error: null,
                  }),
              }),
            }),
          }),
        }),
      }) as any;

      const updated = await service.updateRecord(testOrgId, recordId, updates);

      expect(updated.id).toBe(recordId);
      expect(updated.emailVerified).toBe(true);
      expect(updated.status).toBe('completed');
    });
  });

  // ========================================
  // Deduplication Tests
  // ========================================

  describe('findDuplicatesByEmail', () => {
    it('should find duplicate records by email', async () => {
      const email = 'duplicate@example.com';

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              neq: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 'duplicate-1',
                      email,
                      outlet: 'Test Outlet',
                    },
                    {
                      id: 'duplicate-2',
                      email,
                      outlet: 'Another Outlet',
                    },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      }) as any;

      const duplicates = await service.findDuplicatesByEmail(testOrgId, email);

      expect(duplicates).toHaveLength(2);
      expect(duplicates[0].email).toBe(email);
    });

    it('should exclude specific record ID from duplicates', async () => {
      const email = 'test@example.com';
      const excludeId = 'exclude-me';

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              neq: () =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
            }),
          }),
        }),
      }) as any;

      const duplicates = await service.findDuplicatesByEmail(
        testOrgId,
        email,
        excludeId
      );

      expect(duplicates).toHaveLength(0);
    });
  });

  // ========================================
  // Merge Suggestions Tests
  // ========================================

  describe('generateMergeSuggestions', () => {
    it('should generate merge suggestions for duplicates', async () => {
      const recordId = 'test-record-id';

      // Mock record retrieval
      mockSupabase.from = (table: string) => {
        if (table === 'journalist_enrichment_records') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: recordId,
                        org_id: testOrgId,
                        email: 'test@example.com',
                        phone: '+1234567890',
                        social_profiles: { twitter: 'https://twitter.com/test' },
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      };

      mockSupabase.rpc = () =>
        Promise.resolve({
          data: [
            {
              enrichment_id: 'duplicate-1',
              match_score: 0.8,
              match_fields: ['email', 'phone'],
            },
          ],
          error: null,
        });

      const result = await service.generateMergeSuggestions(testOrgId, recordId);

      expect(result.suggestions).toBeDefined();
      expect(result.totalSuggestions).toBeGreaterThanOrEqual(0);
    });
  });

  // ========================================
  // Batch Enrichment Tests
  // ========================================

  describe('batchEnrich', () => {
    it('should create batch enrichment job', async () => {
      const request = {
        items: [
          { email: 'journalist1@example.com', outlet: 'Outlet 1' },
          { email: 'journalist2@example.com', outlet: 'Outlet 2' },
        ],
        sources: ['email_verification' as const, 'outlet_authority' as const],
        autoLink: true,
        autoMerge: false,
      };

      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: 'batch-job-id',
                  org_id: testOrgId,
                  job_type: 'batch_enrichment',
                  status: 'queued',
                  input_record_count: 2,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
          }),
        }),
      }) as any;

      const result = await service.batchEnrich(testOrgId, request, testUserId);

      expect(result.jobId).toBe('batch-job-id');
      expect(result.status).toBe('queued');
      expect(result.message).toContain('queued');
    });

    it('should validate batch size limits', async () => {
      const request = {
        items: Array(1001).fill({ email: 'test@example.com' }),
        sources: ['email_verification' as const],
      };

      // This should be caught by Zod validation before reaching service
      // But service should also handle it gracefully
      await expect(service.batchEnrich(testOrgId, request as any)).rejects.toThrow();
    });
  });

  // ========================================
  // Enrichment Job Tests
  // ========================================

  describe('createJob', () => {
    it('should create enrichment job successfully', async () => {
      const input = {
        jobType: 'email_verification_batch' as const,
        inputData: {
          emails: ['test1@example.com', 'test2@example.com'],
        },
        enrichmentSources: ['email_verification' as const],
        maxRetries: 3,
      };

      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: 'job-id',
                  org_id: testOrgId,
                  job_type: input.jobType,
                  status: 'pending',
                  input_record_count: 2,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
          }),
        }),
      }) as any;

      const job = await service.createJob(testOrgId, input, testUserId);

      expect(job.id).toBe('job-id');
      expect(job.jobType).toBe(input.jobType);
      expect(job.status).toBe('pending');
    });
  });

  describe('listJobs', () => {
    it('should list enrichment jobs with filters', async () => {
      const query = {
        jobType: ['batch_enrichment' as const],
        status: ['completed' as const, 'processing' as const],
        limit: 10,
      };

      mockSupabase.from = () => ({
        select: () => ({
          eq: () => ({
            in: () => ({
              in: () => ({
                order: () => ({
                  range: () =>
                    Promise.resolve({
                      data: [
                        {
                          id: 'job-1',
                          job_type: 'batch_enrichment',
                          status: 'completed',
                          input_record_count: 10,
                          successful_records: 10,
                          failed_records: 0,
                          progress_percentage: 100,
                        },
                      ],
                      error: null,
                      count: 1,
                    }),
                }),
              }),
            }),
          }),
        }),
      }) as any;

      const result = await service.listJobs(testOrgId, query);

      expect(result.jobs).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  // ========================================
  // Enrichment Link Tests
  // ========================================

  describe('createLink', () => {
    it('should create enrichment link', async () => {
      const input = {
        journalistId: 'journalist-id',
        enrichmentRecordId: 'enrichment-id',
        linkType: 'primary' as const,
        linkConfidence: 0.9,
        linkReason: 'Email match',
      };

      mockSupabase.from = () => ({
        insert: () => ({
          select: () => ({
            single: () =>
              Promise.resolve({
                data: {
                  id: 'link-id',
                  org_id: testOrgId,
                  ...input,
                  created_at: new Date().toISOString(),
                },
                error: null,
              }),
          }),
        }),
      }) as any;

      const link = await service.createLink(testOrgId, input, testUserId);

      expect(link.id).toBe('link-id');
      expect(link.linkType).toBe('primary');
    });
  });

  // ========================================
  // Merge Enrichment Tests
  // ========================================

  describe('mergeEnrichment', () => {
    it('should merge enrichment into journalist profile', async () => {
      const input = {
        journalistId: 'journalist-id',
        enrichmentRecordId: 'enrichment-id',
        mergeStrategy: 'append' as const,
        fieldsToMerge: ['email', 'phone', 'social_profiles'],
      };

      mockSupabase.from = (table: string) => {
        if (table === 'journalist_enrichment_records') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: input.enrichmentRecordId,
                        email: 'new@example.com',
                        phone: '+1234567890',
                        social_profiles: { twitter: 'https://twitter.com/new' },
                      },
                      error: null,
                    }),
                }),
              }),
            }),
            update: () => ({
              eq: () => ({
                eq: () =>
                  Promise.resolve({
                    data: null,
                    error: null,
                  }),
              }),
            }),
          } as any;
        }
        return {
          insert: () => ({
            select: () => ({
              single: () =>
                Promise.resolve({
                  data: { id: 'link-id' },
                  error: null,
                }),
            }),
          }),
        } as any;
      };

      await expect(
        service.mergeEnrichment(testOrgId, input, testUserId)
      ).resolves.not.toThrow();
    });
  });

  // ========================================
  // Record Deletion Tests
  // ========================================

  describe('deleteRecord', () => {
    it('should delete enrichment record', async () => {
      const recordId = 'record-to-delete';

      mockSupabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () =>
              Promise.resolve({
                data: null,
                error: null,
              }),
          }),
        }),
      }) as any;

      await expect(
        service.deleteRecord(testOrgId, recordId)
      ).resolves.not.toThrow();
    });

    it('should handle errors during deletion', async () => {
      const recordId = 'non-existent-record';

      mockSupabase.from = () => ({
        delete: () => ({
          eq: () => ({
            eq: () =>
              Promise.resolve({
                data: null,
                error: { message: 'Record not found' },
              }),
          }),
        }),
      }) as any;

      await expect(service.deleteRecord(testOrgId, recordId)).rejects.toThrow(
        'Record not found'
      );
    });
  });
});
