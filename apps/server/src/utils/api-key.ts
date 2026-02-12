import crypto from 'node:crypto';
import bcrypt from 'bcrypt';

const API_KEY_PREFIX = 'mw_';
const API_KEY_LENGTH = 32;
const BCRYPT_ROUNDS = 12;

export function generateApiKey(): { key: string; prefix: string } {
  const raw = crypto.randomBytes(API_KEY_LENGTH).toString('base64url');
  const key = `${API_KEY_PREFIX}${raw}`;
  const prefix = key.slice(0, 8);
  return { key, prefix };
}

export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, BCRYPT_ROUNDS);
}

export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash);
}

const API_KEY_MAX_LENGTH = 128;
const API_KEY_REGEX = /^mw_[A-Za-z0-9_-]+$/;

export function isValidApiKeyFormat(key: string): boolean {
  return key.length > API_KEY_PREFIX.length + 10
    && key.length <= API_KEY_MAX_LENGTH
    && API_KEY_REGEX.test(key);
}
