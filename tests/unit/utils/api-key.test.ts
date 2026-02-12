import { describe, it, expect } from 'vitest';
import { generateApiKey, hashApiKey, verifyApiKey, isValidApiKeyFormat } from '../../../apps/server/src/utils/api-key';

describe('API Key Utils', () => {
  it('should generate keys with mw_ prefix', () => {
    const { key, prefix } = generateApiKey();
    expect(key).toMatch(/^mw_/);
    expect(prefix).toBe(key.slice(0, 8));
    expect(prefix.length).toBe(8);
  });

  it('should generate unique keys', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1.key).not.toBe(key2.key);
  });

  it('should hash and verify key', async () => {
    const { key } = generateApiKey();
    const hash = await hashApiKey(key);
    const valid = await verifyApiKey(key, hash);
    expect(valid).toBe(true);
  });

  it('should reject wrong key', async () => {
    const { key } = generateApiKey();
    const hash = await hashApiKey(key);
    const valid = await verifyApiKey('mw_wrong-key-completely', hash);
    expect(valid).toBe(false);
  });

  it('should validate key format', () => {
    expect(isValidApiKeyFormat('mw_abcdefghijklmnop')).toBe(true);
    expect(isValidApiKeyFormat('wrong_prefix')).toBe(false);
    expect(isValidApiKeyFormat('mw_')).toBe(false);
    expect(isValidApiKeyFormat('')).toBe(false);
  });
});
