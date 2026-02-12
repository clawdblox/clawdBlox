import { describe, it, expect } from 'vitest';
import { signHMAC, verifyHMAC } from '../../../apps/server/src/utils/hmac';

describe('HMAC Utils (SHA-256)', () => {
  const secret = 'test-secret-key';

  it('should sign and verify a payload', () => {
    const payload = 'player123:1700000000000:Hello NPC';
    const signature = signHMAC(secret, payload);
    expect(verifyHMAC(secret, payload, signature)).toBe(true);
  });

  it('should reject tampered payload', () => {
    const payload = 'player123:1700000000000:Hello NPC';
    const signature = signHMAC(secret, payload);
    expect(verifyHMAC(secret, payload + ' tampered', signature)).toBe(false);
  });

  it('should reject wrong secret', () => {
    const payload = 'test-payload';
    const signature = signHMAC(secret, payload);
    expect(verifyHMAC('wrong-secret', payload, signature)).toBe(false);
  });

  it('should produce consistent signatures', () => {
    const payload = 'deterministic';
    const sig1 = signHMAC(secret, payload);
    const sig2 = signHMAC(secret, payload);
    expect(sig1).toBe(sig2);
  });

  it('should produce hex output', () => {
    const signature = signHMAC(secret, 'test');
    expect(signature).toMatch(/^[0-9a-f]{64}$/);
  });

  it('should use timing-safe comparison (reject different length)', () => {
    const payload = 'test';
    const signature = signHMAC(secret, payload);
    // Truncated signature
    expect(verifyHMAC(secret, payload, signature.slice(0, 10))).toBe(false);
  });
});
