import { UnauthorizedError } from '@pravado/utils';
import { FastifyRequest } from 'fastify';

export async function requireUser(request: FastifyRequest) {
  if (!request.user) {
    throw new UnauthorizedError('Authentication required');
  }
}
