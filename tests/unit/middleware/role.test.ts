import { describe, it, expect, vi } from 'vitest';
import { requireRole } from '../../../apps/server/src/middleware/role.middleware';

function createReqWithRole(role: string) {
  return {
    user: { sub: 'user-1', email: 'test@test.com', role, project_id: 'proj-1', type: 'access' },
  } as any;
}

describe('Role Middleware', () => {
  it('should allow owner to access owner routes', () => {
    const middleware = requireRole('owner');
    const req = createReqWithRole('owner');
    const next = vi.fn();
    middleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should allow owner to access editor routes', () => {
    const middleware = requireRole('editor');
    const req = createReqWithRole('owner');
    const next = vi.fn();
    middleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should allow owner to access viewer routes', () => {
    const middleware = requireRole('viewer');
    const req = createReqWithRole('owner');
    const next = vi.fn();
    middleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject viewer from owner routes', () => {
    const middleware = requireRole('owner');
    const req = createReqWithRole('viewer');
    const next = vi.fn();
    middleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should reject editor from owner routes', () => {
    const middleware = requireRole('owner');
    const req = createReqWithRole('editor');
    const next = vi.fn();
    middleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('should reject unauthenticated request', () => {
    const middleware = requireRole('viewer');
    const req = {} as any;
    const next = vi.fn();
    middleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
