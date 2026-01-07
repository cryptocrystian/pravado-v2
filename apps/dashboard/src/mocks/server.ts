/**
 * MSW Server Setup
 *
 * This file configures MSW for Node.js environments (tests, SSR).
 * Used in Jest/Vitest tests to mock API responses.
 *
 * Usage in tests:
 * ```
 * import { server } from '@/mocks/server';
 *
 * beforeAll(() => server.listen());
 * afterEach(() => server.resetHandlers());
 * afterAll(() => server.close());
 * ```
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
