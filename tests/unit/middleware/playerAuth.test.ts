import { describe, it, expect, vi } from 'vitest';

process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-char!';

import { playerAuthMiddleware } from '../../../apps/server/src/middleware/playerAuth.middleware';
import { signHMAC } from '../../../apps/server/src/utils/hmac';

const SECRET = 'test-player-signing-secret';

function createReq(playerId: string, message: string, secret: string, timestampOverride?: number) {
  const timestamp = timestampOverride || Date.now();
  const payload = `${playerId}:${timestamp}`;
  const signature = signHMAC(secret, payload);
  const playerToken = `${timestamp}:${signature}`;

  return {
    body: { player_id: playerId, player_token: playerToken, message },
    project: { player_signing_secret: secret },
  } as any;
}

describe('Player Auth Middleware (HMAC)', () => {
  it('should accept valid HMAC token', () => {
    const req = createReq('player-1', 'Hello NPC', SECRET);
    const next = vi.fn();
    playerAuthMiddleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith();
  });

  it('should reject missing project context', () => {
    const req = { body: { player_id: 'p1', player_token: 'token', message: 'hi' } } as any;
    const next = vi.fn();
    playerAuthMiddleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should reject missing fields', () => {
    const req = { body: {}, project: { player_signing_secret: SECRET } } as any;
    const next = vi.fn();
    playerAuthMiddleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('should reject tampered signature', () => {
    const req = createReq('player-1', 'Hello', SECRET);
    req.body.player_token = req.body.player_token.replace(/[0-9a-f](?=[0-9a-f]*$)/, 'x');
    const next = vi.fn();
    playerAuthMiddleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should reject expired token (> 5 min)', () => {
    const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6 minutes ago
    const req = createReq('player-1', 'Hello', SECRET, oldTimestamp);
    const next = vi.fn();
    playerAuthMiddleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should reject invalid token format', () => {
    const req = {
      body: { player_id: 'p1', player_token: 'no-colon-here', message: 'hi' },
      project: { player_signing_secret: SECRET },
    } as any;
    const next = vi.fn();
    playerAuthMiddleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('should reject wrong signing secret', () => {
    const req = createReq('player-1', 'Hello', 'wrong-secret');
    req.project.player_signing_secret = SECRET;
    const next = vi.fn();
    playerAuthMiddleware(req, {} as any, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
