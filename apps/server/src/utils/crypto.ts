import crypto from 'node:crypto';
import { env } from '../config/env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 16;

const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1 };

function deriveKey(salt: Buffer): Buffer {
  return crypto.scryptSync(env.ENCRYPTION_KEY, salt, 32, SCRYPT_PARAMS);
}

export function encrypt(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const ciphertext = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return [salt, iv, authTag].map(b => b.toString('hex')).concat(ciphertext).join(':');
}

export function decrypt(encryptedData: string): string {
  const parts = encryptedData.split(':');

  let salt: Buffer;
  let ivHex: string;
  let authTagHex: string;
  let ciphertext: string;

  if (parts.length === 4) {
    // Current format: salt:iv:authTag:ciphertext
    salt = Buffer.from(parts[0]!, 'hex');
    ivHex = parts[1]!;
    authTagHex = parts[2]!;
    ciphertext = parts[3]!;
  } else if (parts.length === 3) {
    // Legacy format: iv:authTag:ciphertext (static salt for backwards compatibility)
    salt = Buffer.from('memoryweave-salt');
    ivHex = parts[0]!;
    authTagHex = parts[1]!;
    ciphertext = parts[2]!;
  } else {
    throw new Error('Invalid encrypted data format');
  }

  const key = deriveKey(salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  return decipher.update(ciphertext, 'hex', 'utf8') + decipher.final('utf8');
}
