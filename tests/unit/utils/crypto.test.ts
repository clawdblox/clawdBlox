import { describe, it, expect, beforeAll } from 'vitest';

// Set env before importing
process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-at-least-32-char!';

import { encrypt, decrypt } from '../../../apps/server/src/utils/crypto';

describe('Crypto Utils (AES-256-GCM)', () => {
  it('should encrypt and decrypt a string', () => {
    const plaintext = 'my-secret-api-key-gsk_12345';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for same plaintext (random IV)', () => {
    const plaintext = 'same-text';
    const enc1 = encrypt(plaintext);
    const enc2 = encrypt(plaintext);
    expect(enc1).not.toBe(enc2);
  });

  it('should handle empty strings', () => {
    const encrypted = encrypt('');
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe('');
  });

  it('should handle unicode', () => {
    const plaintext = 'secret key 🔑 日本語';
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should throw on tampered ciphertext', () => {
    const encrypted = encrypt('test');
    const parts = encrypted.split(':');
    // Tamper with the ciphertext
    parts[2] = parts[2].replace(/[0-9a-f]/, 'x');
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  it('should throw on invalid format', () => {
    expect(() => decrypt('not-valid')).toThrow('Invalid encrypted data format');
  });
});
