/**
 * Journalist Graph Service Tests (Sprint S46)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JournalistGraphService } from '../src/services/journalistGraphService';

describe('JournalistGraphService', () => {
  let service: JournalistGraphService;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
      rpc: vi.fn(),
    };
    service = new JournalistGraphService(mockSupabase);
  });

  describe('Profile Management', () => {
    it('should create a journalist profile', async () => {
      const mockProfile = {
        id: 'profile-123',
        org_id: 'org-123',
        full_name: 'John Doe',
        primary_email: 'john@example.com',
        secondary_emails: [],
        engagement_score: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      });

      const result = await service.createProfile('org-123', {
        fullName: 'John Doe',
        primaryEmail: 'john@example.com',
      });

      expect(result.fullName).toBe('John Doe');
      expect(result.primaryEmail).toBe('john@example.com');
    });

    it('should list journalist profiles with filters', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          org_id: 'org-123',
          full_name: 'John Doe',
          primary_email: 'john@example.com',
          engagement_score: 0.8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({
            data: mockProfiles,
            count: 1,
            error: null,
          }),
        }),
      });

      const result = await service.listProfiles('org-123', {
        minEngagementScore: 0.5,
        limit: 20,
        offset: 0,
      });

      expect(result.profiles).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('Identity Resolution', () => {
    it('should find matching journalists using fuzzy matching', async () => {
      const mockProfiles = [
        {
          id: 'profile-1',
          org_id: 'org-123',
          full_name: 'John Doe',
          primary_email: 'john@example.com',
          secondary_emails: [],
          engagement_score: 0.8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockProfiles, error: null }),
        }),
      });

      const matches = await service.findMatches('org-123', {
        fullName: 'John Doe',
        email: 'john@example.com',
      });

      expect(matches.length).toBeGreaterThan(0);
      expect(matches[0].matchScore).toBeGreaterThan(0.5);
    });
  });

  describe('Activity Management', () => {
    it('should create an activity log entry', async () => {
      const mockActivity = {
        id: 'activity-123',
        org_id: 'org-123',
        journalist_id: 'profile-123',
        activity_type: 'email_opened',
        source_system: 's45_deliverability',
        occurred_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockActivity, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnThis(),
        }),
      });

      const result = await service.createActivity('org-123', {
        journalistId: 'profile-123',
        activityType: 'email_opened',
        sourceSystem: 's45_deliverability',
      });

      expect(result.activityType).toBe('email_opened');
    });
  });

  describe('Scoring Models', () => {
    it('should calculate engagement score', async () => {
      const mockSummary = [
        {
          total_activities: 100,
          total_outreach: 50,
          total_coverage: 20,
          total_emails_sent: 40,
          total_emails_opened: 30,
          total_emails_replied: 15,
        },
      ];

      mockSupabase.rpc.mockResolvedValue({ data: mockSummary, error: null });

      const result = await service.calculateEngagementScore('profile-123', 'org-123');

      expect(result.engagementScore).toBeGreaterThan(0);
      expect(result.engagementScore).toBeLessThanOrEqual(1);
      expect(result.components.responseRate).toBeDefined();
    });
  });

  describe('Graph Builder', () => {
    it('should build journalist graph with nodes and edges', async () => {
      const mockProfile = {
        id: 'profile-1',
        org_id: 'org-123',
        full_name: 'John Doe',
        primary_email: 'john@example.com',
        primary_outlet: 'TechCrunch',
        engagement_score: 0.8,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: [mockProfile],
                count: 1,
                error: null,
              }),
            }),
          }),
        }),
      });

      mockSupabase.rpc.mockResolvedValue({
        data: [{ total_activities: 10, total_coverage: 5, total_outreach: 3 }],
        error: null,
      });

      const graph = await service.buildGraph('org-123', {
        includeOutlets: true,
        includeCoverage: true,
      });

      expect(graph.nodes.length).toBeGreaterThan(0);
      expect(graph.metadata.totalNodes).toBe(graph.nodes.length);
    });
  });
});
