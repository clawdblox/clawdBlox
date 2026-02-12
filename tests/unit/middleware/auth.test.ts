import { describe, it, expect, vi, beforeEach } from 'vitest';

process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-char!';

import { authMiddleware } from '../../../apps/server/src/middleware/auth.middleware';
import { generateAccessToken, generateRefreshToken } from '../../../apps/server/src/utils/jwt';

function createMockReqRes(cookies: Record<string, string> = {}) {
  const req = { cookies } as any;
  const res = {} as any;
  const next = vi.fn();
  return { req, res, next };
}

describe('Auth Middleware', () => {
  it('should reject request without access token', () => {
    const { req, res, next } = createMockReqRes();
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should accept valid access token', () => {
    const token = generateAccessToken({
      sub: 'user-1',
      email: 'test@test.com',
      role: 'owner',
      project_id: 'proj-1',
    });
    const { req, res, next } = createMockReqRes({ access_token: token });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toBeDefined();
    expect(req.user.sub).toBe('user-1');
  });

  it('should reject expired/invalid token', () => {
    const { req, res, next } = createMockReqRes({ access_token: 'invalid-token' });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should reject refresh token used as access token', () => {
    const token = generateRefreshToken({
      sub: 'user-1',
      email: 'test@test.com',
      role: 'owner',
      project_id: 'proj-1',
    });
    const { req, res, next } = createMockReqRes({ access_token: token });
    authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
