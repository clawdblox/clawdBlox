import type { Request, Response, NextFunction } from 'express';
import { ForbiddenError, AuthError } from '../utils/errors';
import type { Role } from '@clawdblox/memoryweave-shared';

const ROLE_HIERARCHY: Record<Role, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AuthError('Authentication required'));
      return;
    }

    const userRole = req.user.role as Role;
    const allowed = roles.some(role => ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[role]);

    if (!allowed) {
      next(new ForbiddenError(`Role ${userRole} does not have sufficient permissions`));
      return;
    }

    next();
  };
}
