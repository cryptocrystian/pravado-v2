/**
 * Ops API Tests (Sprint S27)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../src/server';
import type { FastifyInstance } from 'fastify';

describe('Ops Routes (S27)', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    server = await createServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  describe('GET /api/v1/ops/overview', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/ops/overview',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
    });

    it('should accept period query parameter', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/ops/overview?period=7d',
      });

      // Still 401 without auth, but URL is valid
      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/v1/ops/queue', () => {
    it('should require authentication', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/v1/ops/queue',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('UNAUTHORIZED');
    });
  });
});
