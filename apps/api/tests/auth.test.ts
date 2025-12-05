/**
 * Auth endpoints tests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/server';
import type { FastifyInstance } from 'fastify';

describe('Auth Routes', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('POST /api/v1/auth/session', () => {
    it('should reject invalid access token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/session',
        payload: {
          accessToken: 'invalid-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('INVALID_TOKEN');
    });

    it('should require accessToken in body', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/v1/auth/session',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });

    // Note: Valid token test requires real Supabase token
    // This should be implemented with test fixtures in future sprints
  });

  describe('GET /api/v1/auth/me', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/auth/me',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
      expect(body.message).toBe('Authentication required');
    });

    // Note: Authenticated tests require test user setup
    // This should be implemented with test fixtures in future sprints
  });
});
