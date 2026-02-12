// Set required environment variables
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SKIP = !process.env.DATABASE_URL;

describe.skipIf(SKIP)('WebSocket Integration Tests', () => {
  let pool: any;
  let WS_CLOSE_CODES: any;
  let WS_CLOSE_REASONS: any;
  let closeWithCode: any;
  let checkMessageSize: any;

  beforeAll(async () => {
    // Dynamic imports
    const dbModule = await import('../../apps/server/src/config/database');
    pool = dbModule.pool;

    const wsCodesModule = await import('@clawdblox/memoryweave-shared');
    WS_CLOSE_CODES = wsCodesModule.WS_CLOSE_CODES;
    WS_CLOSE_REASONS = wsCodesModule.WS_CLOSE_REASONS;

    const wsConnectionModule = await import('../../apps/server/src/websocket/ws-connection');
    checkMessageSize = wsConnectionModule.checkMessageSize;

    const wsCodesServerModule = await import('../../apps/server/src/websocket/ws-codes');
    closeWithCode = wsCodesServerModule.closeWithCode;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should have correct WS_CLOSE_CODES values', () => {
    expect(WS_CLOSE_CODES.AUTH_FAILED).toBe(4000);
    expect(WS_CLOSE_CODES.INACTIVITY_TIMEOUT).toBe(4001);
    expect(WS_CLOSE_CODES.CONNECTION_LIMIT).toBe(4002);
    expect(WS_CLOSE_CODES.RATE_LIMITED).toBe(4003);
    expect(WS_CLOSE_CODES.INVALID_FORMAT).toBe(4004);
    expect(WS_CLOSE_CODES.SERVER_SHUTDOWN).toBe(4005);
  });

  it('should have correct WS_CLOSE_REASONS mapping', () => {
    expect(WS_CLOSE_REASONS[4000]).toBe('Authentication failed or timed out');
    expect(WS_CLOSE_REASONS[4001]).toBe('Inactivity timeout');
    expect(WS_CLOSE_REASONS[4002]).toBe('Connection limit reached');
    expect(WS_CLOSE_REASONS[4003]).toBe('Rate limit exceeded');
    expect(WS_CLOSE_REASONS[4004]).toBe('Invalid message format');
    expect(WS_CLOSE_REASONS[4005]).toBe('Server shutting down');
  });

  it('should accept messages under size limit', () => {
    const smallMessage = 'Hello, world!';
    const result = checkMessageSize(smallMessage);

    expect(result).toBe(true);
  });

  it('should accept messages at exact size limit', () => {
    // Default limit is usually 16KB (16384 bytes)
    const limit = 16384;
    const exactSizeMessage = 'a'.repeat(limit);
    const result = checkMessageSize(exactSizeMessage);

    expect(result).toBe(true);
  });

  it('should reject oversized messages', () => {
    // Create message larger than 16KB
    const oversizedMessage = 'a'.repeat(20000);
    const result = checkMessageSize(oversizedMessage);

    expect(result).toBe(false);
  });

  it('should handle Buffer messages', () => {
    const bufferMessage = Buffer.from('Test message');
    const result = checkMessageSize(bufferMessage);

    expect(result).toBe(true);
  });

  it('should handle large Buffer messages', () => {
    const largeBuffer = Buffer.alloc(20000, 'a');
    const result = checkMessageSize(largeBuffer);

    expect(result).toBe(false);
  });

  it('should call ws.close with correct code and reason via closeWithCode', () => {
    let closedWithCode: number | undefined;
    let closedWithReason: string | undefined;

    const mockWs = {
      close: (code: number, reason: string) => {
        closedWithCode = code;
        closedWithReason = reason;
      },
    };

    closeWithCode(mockWs, WS_CLOSE_CODES.AUTH_FAILED);

    expect(closedWithCode).toBe(4000);
    expect(closedWithReason).toBe('Authentication failed or timed out');
  });

  it('should handle INACTIVITY_TIMEOUT close code', () => {
    let closedWithCode: number | undefined;
    let closedWithReason: string | undefined;

    const mockWs = {
      close: (code: number, reason: string) => {
        closedWithCode = code;
        closedWithReason = reason;
      },
    };

    closeWithCode(mockWs, WS_CLOSE_CODES.INACTIVITY_TIMEOUT);

    expect(closedWithCode).toBe(4001);
    expect(closedWithReason).toBe('Inactivity timeout');
  });

  it('should handle CONNECTION_LIMIT close code', () => {
    let closedWithCode: number | undefined;
    let closedWithReason: string | undefined;

    const mockWs = {
      close: (code: number, reason: string) => {
        closedWithCode = code;
        closedWithReason = reason;
      },
    };

    closeWithCode(mockWs, WS_CLOSE_CODES.CONNECTION_LIMIT);

    expect(closedWithCode).toBe(4002);
    expect(closedWithReason).toBe('Connection limit reached');
  });

  it('should handle RATE_LIMITED close code', () => {
    let closedWithCode: number | undefined;
    let closedWithReason: string | undefined;

    const mockWs = {
      close: (code: number, reason: string) => {
        closedWithCode = code;
        closedWithReason = reason;
      },
    };

    closeWithCode(mockWs, WS_CLOSE_CODES.RATE_LIMITED);

    expect(closedWithCode).toBe(4003);
    expect(closedWithReason).toBe('Rate limit exceeded');
  });

  it('should handle INVALID_FORMAT close code', () => {
    let closedWithCode: number | undefined;
    let closedWithReason: string | undefined;

    const mockWs = {
      close: (code: number, reason: string) => {
        closedWithCode = code;
        closedWithReason = reason;
      },
    };

    closeWithCode(mockWs, WS_CLOSE_CODES.INVALID_FORMAT);

    expect(closedWithCode).toBe(4004);
    expect(closedWithReason).toBe('Invalid message format');
  });

  it('should handle SERVER_SHUTDOWN close code', () => {
    let closedWithCode: number | undefined;
    let closedWithReason: string | undefined;

    const mockWs = {
      close: (code: number, reason: string) => {
        closedWithCode = code;
        closedWithReason = reason;
      },
    };

    closeWithCode(mockWs, WS_CLOSE_CODES.SERVER_SHUTDOWN);

    expect(closedWithCode).toBe(4005);
    expect(closedWithReason).toBe('Server shutting down');
  });

  it('should handle unknown close code with default reason', () => {
    let closedWithCode: number | undefined;
    let closedWithReason: string | undefined;

    const mockWs = {
      close: (code: number, reason: string) => {
        closedWithCode = code;
        closedWithReason = reason;
      },
    };

    closeWithCode(mockWs, 9999);

    expect(closedWithCode).toBe(9999);
    expect(closedWithReason).toBe('Unknown');
  });

  it('should have all close codes in 4000-4999 range', () => {
    const codes = Object.values(WS_CLOSE_CODES);
    for (const code of codes) {
      expect(code).toBeGreaterThanOrEqual(4000);
      expect(code).toBeLessThan(5000);
    }
  });

  it('should have unique close codes', () => {
    const codes = Object.values(WS_CLOSE_CODES);
    const uniqueCodes = new Set(codes);
    expect(uniqueCodes.size).toBe(codes.length);
  });

  it('should have reason for every close code', () => {
    for (const [key, code] of Object.entries(WS_CLOSE_CODES)) {
      expect(WS_CLOSE_REASONS[code]).toBeDefined();
      expect(WS_CLOSE_REASONS[code]).toBeTruthy();
      expect(typeof WS_CLOSE_REASONS[code]).toBe('string');
    }
  });
});
