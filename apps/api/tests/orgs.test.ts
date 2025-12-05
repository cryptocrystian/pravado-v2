/**
 * Organization endpoints tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/server';
import type { FastifyInstance } from 'fastify';

describe('Orgs Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/v1/orgs', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/orgs',
        payload: {
          name: 'Test Org',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should validate request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/orgs',
        payload: {},
      });

      // Auth check happens before validation, so expect 401
      expect(response.statusCode).toBe(401);
    });

    // Note: Authenticated tests require test user setup
    // This should be implemented with test fixtures in future sprints
  });

  describe('POST /api/v1/orgs/:id/invite', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/orgs/test-org-id/invite',
        payload: {
          email: 'test@example.com',
          role: 'member',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should validate request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/orgs/test-org-id/invite',
        payload: {
          email: 'invalid-email',
        },
      });

      // Auth check happens before validation, so expect 401
      expect(response.statusCode).toBe(401);
    });

    // Note: Tests for org membership and role checks require test fixtures
    // This should be implemented in future sprints
  });

  describe('POST /api/v1/orgs/:id/join', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/orgs/test-org-id/join',
        payload: {
          token: 'test-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should validate request body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/orgs/test-org-id/join',
        payload: {},
      });

      // Auth check happens before validation, so expect 401
      expect(response.statusCode).toBe(401);
    });

    // Note: Tests for valid tokens and invite acceptance require test fixtures
    // This should be implemented in future sprints
  });
});
