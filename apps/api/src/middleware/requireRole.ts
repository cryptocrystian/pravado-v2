import { ForbiddenError } from '@pravado/utils';
import { FastifyRequest } from 'fastify';

type OrgRole = 'owner' | 'admin' | 'member';

const roleHierarchy: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
};

export function requireRole(minimumRole: OrgRole) {
  return async (request: FastifyRequest) => {
    if (!request.orgRole) {
      throw new ForbiddenError('Organization context required');
    }

    const userRoleLevel = roleHierarchy[request.orgRole];
    const requiredRoleLevel = roleHierarchy[minimumRole];

    if (userRoleLevel < requiredRoleLevel) {
      throw new ForbiddenError(
        `Minimum role required: ${minimumRole}, current role: ${request.orgRole}`
      );
    }
  };
}
