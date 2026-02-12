import { describe, it, expect } from 'vitest';

process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-char!';

import { generateAccessToken, generateRefreshToken, generateTokenPair, verifyAccessToken, verifyRefreshToken } from '../../../apps/server/src/utils/jwt';

describe('JWT Utils', () => {
  const payload = {
    sub: 'user-123',
    email: 'test@test.com',
    role: 'owner' as const,
    project_id: 'project-456',
  };

  it('should generate and verify access token', () => {
    const token = generateAccessToken(payload);
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.type).toBe('access');
  });

  it('should generate and verify refresh token', () => {
    const token = generateRefreshToken(payload);
    const decoded = verifyRefreshToken(token);
    expect(decoded.sub).toBe(payload.sub);
    expect(decoded.type).toBe('refresh');
  });

  it('should generate token pair', () => {
    const pair = generateTokenPair(payload);
    expect(pair.accessToken).toBeTruthy();
    expect(pair.refreshToken).toBeTruthy();
    expect(pair.accessToken).not.toBe(pair.refreshToken);
  });

  it('should reject access token with refresh secret', () => {
    const token = generateAccessToken(payload);
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('should reject refresh token with access secret', () => {
    const token = generateRefreshToken(payload);
    expect(() => verifyAccessToken(token)).toThrow();
  });

  it('should reject invalid token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });
});
