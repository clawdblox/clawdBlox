// Set required env vars before any imports
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SKIP = !process.env.DATABASE_URL;

describe.skipIf(SKIP)('Auth Integration Tests', () => {
  let userService: any;
  let pool: any;
  let testUserId: string;
  let testProjectId: string;
  let testApiKey: string;

  beforeAll(async () => {
    // Dynamic imports
    const userServiceModule = await import('../../apps/server/src/modules/user/user.service');
    const databaseModule = await import('../../apps/server/src/config/database');

    userService = userServiceModule.userService;
    pool = databaseModule.pool;

    // Clean up database - truncate in reverse dependency order
    await pool.query('TRUNCATE TABLE api_keys, projects, users RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    if (pool) {
      await pool.end();
    }
  });

  it('should create first owner + project + API key on setup', async () => {
    const setupData = {
      username: 'testowner',
      password: 'SecurePass123!',
      projectName: 'Test Project'
    };

    const result = await userService.setup(setupData);

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('testowner');
    expect(result.user.role).toBe('owner');
    expect(result.project).toBeDefined();
    expect(result.project.name).toBe('Test Project');
    expect(result.apiKey).toBeDefined();
    expect(result.apiKey.startsWith('mw_')).toBe(true);

    // Store for later tests
    testUserId = result.user.id;
    testProjectId = result.project.id;
    testApiKey = result.apiKey;
  });

  it('should throw ConflictError on duplicate setup', async () => {
    const setupData = {
      username: 'anotherowner',
      password: 'AnotherPass123!',
      projectName: 'Another Project'
    };

    try {
      await userService.setup(setupData);
      expect.fail('Should have thrown ConflictError');
    } catch (error: any) {
      expect(error.name).toBe('ConflictError');
      expect(error.message).toContain('already been set up');
    }
  });

  it('should login with correct credentials and return tokens', async () => {
    const loginData = {
      username: 'testowner',
      password: 'SecurePass123!'
    };

    const result = await userService.login(loginData);

    expect(result).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('testowner');
    expect(result.user.role).toBe('owner');
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(typeof result.accessToken).toBe('string');
    expect(typeof result.refreshToken).toBe('string');
  });

  it('should throw AuthError when login with wrong password', async () => {
    const loginData = {
      username: 'testowner',
      password: 'WrongPassword123!'
    };

    try {
      await userService.login(loginData);
      expect.fail('Should have thrown AuthError');
    } catch (error: any) {
      expect(error.name).toBe('AuthError');
      expect(error.message).toContain('Invalid credentials');
    }
  });

  it('should throw AuthError when login with non-existent user', async () => {
    const loginData = {
      username: 'nonexistent',
      password: 'SomePassword123!'
    };

    try {
      await userService.login(loginData);
      expect.fail('Should have thrown AuthError');
    } catch (error: any) {
      expect(error.name).toBe('AuthError');
      expect(error.message).toContain('Invalid credentials');
    }
  });

  it('should refresh with valid token and return new token pair', async () => {
    // First login to get a refresh token
    const loginData = {
      username: 'testowner',
      password: 'SecurePass123!'
    };

    const loginResult = await userService.login(loginData);
    const oldRefreshToken = loginResult.refreshToken;

    // Wait a tiny bit to ensure new tokens are different
    await new Promise(resolve => setTimeout(resolve, 10));

    // Refresh with the token
    const refreshResult = await userService.refresh(oldRefreshToken);

    expect(refreshResult).toBeDefined();
    expect(refreshResult.accessToken).toBeDefined();
    expect(refreshResult.refreshToken).toBeDefined();
    expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);
    expect(refreshResult.refreshToken).not.toBe(oldRefreshToken);
  });

  it('should reject refresh with invalid token', async () => {
    const invalidToken = 'invalid.token.here';

    try {
      await userService.refresh(invalidToken);
      expect.fail('Should have thrown AuthError');
    } catch (error: any) {
      expect(error.name).toBe('AuthError');
    }
  });

  it('should revoke refresh token on logout', async () => {
    // Login to get a fresh token
    const loginData = {
      username: 'testowner',
      password: 'SecurePass123!'
    };

    const loginResult = await userService.login(loginData);
    const refreshToken = loginResult.refreshToken;

    // Revoke the token
    await userService.revokeRefreshToken(refreshToken);

    // Try to use the revoked token
    try {
      await userService.refresh(refreshToken);
      expect.fail('Should have thrown AuthError for revoked token');
    } catch (error: any) {
      expect(error.name).toBe('AuthError');
      expect(error.message).toContain('revoked');
    }
  });

  it('should reject already revoked token on second revocation attempt', async () => {
    // Login to get a fresh token
    const loginData = {
      username: 'testowner',
      password: 'SecurePass123!'
    };

    const loginResult = await userService.login(loginData);
    const refreshToken = loginResult.refreshToken;

    // Revoke once
    await userService.revokeRefreshToken(refreshToken);

    // Try to revoke again
    try {
      await userService.revokeRefreshToken(refreshToken);
      expect.fail('Should have thrown AuthError for already revoked token');
    } catch (error: any) {
      expect(error.name).toBe('AuthError');
    }
  });
});
