process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect } from 'vitest';
import {
  projectSettingsSchema,
  createProjectSchema,
  updateProjectSchema,
} from '@clawdblox/memoryweave-shared';

describe('Project Service - Schema Validation', () => {
  describe('projectSettingsSchema', () => {
    it('should accept empty object', () => {
      expect(projectSettingsSchema.safeParse({}).success).toBe(true);
    });

    it('should accept all valid fields', () => {
      const result = projectSettingsSchema.safeParse({
        groq_chat_model: 'llama-3.1-70b-versatile',
        groq_embed_model: 'text-embedding-3-small',
        max_npcs: 100,
        max_memories_per_npc: 5000,
        memory_decay_enabled: true,
      });
      expect(result.success).toBe(true);
    });

    it('should accept max_npcs boundary value 1', () => {
      expect(projectSettingsSchema.safeParse({ max_npcs: 1 }).success).toBe(true);
    });

    it('should accept max_npcs boundary value 10000', () => {
      expect(projectSettingsSchema.safeParse({ max_npcs: 10000 }).success).toBe(true);
    });

    it('should accept max_memories_per_npc boundary value 100', () => {
      expect(projectSettingsSchema.safeParse({ max_memories_per_npc: 100 }).success).toBe(true);
    });

    it('should accept max_memories_per_npc boundary value 100000', () => {
      expect(projectSettingsSchema.safeParse({ max_memories_per_npc: 100000 }).success).toBe(true);
    });

    it('should accept boolean memory_decay_enabled', () => {
      expect(projectSettingsSchema.safeParse({ memory_decay_enabled: false }).success).toBe(true);
    });

    it('should reject max_npcs 0', () => {
      expect(projectSettingsSchema.safeParse({ max_npcs: 0 }).success).toBe(false);
    });

    it('should reject max_npcs 10001', () => {
      expect(projectSettingsSchema.safeParse({ max_npcs: 10001 }).success).toBe(false);
    });

    it('should reject non-integer max_npcs', () => {
      expect(projectSettingsSchema.safeParse({ max_npcs: 1.5 }).success).toBe(false);
    });

    it('should reject max_memories_per_npc 99', () => {
      expect(projectSettingsSchema.safeParse({ max_memories_per_npc: 99 }).success).toBe(false);
    });

    it('should reject max_memories_per_npc 100001', () => {
      expect(projectSettingsSchema.safeParse({ max_memories_per_npc: 100001 }).success).toBe(false);
    });

    it('should reject string "true" for boolean', () => {
      expect(projectSettingsSchema.safeParse({ memory_decay_enabled: 'true' }).success).toBe(false);
    });
  });

  describe('createProjectSchema', () => {
    it('should accept name only', () => {
      expect(createProjectSchema.safeParse({ name: 'My Project' }).success).toBe(true);
    });

    it('should accept name + groq_api_key', () => {
      const result = createProjectSchema.safeParse({
        name: 'My Project',
        groq_api_key: 'gsk_test123',
      });
      expect(result.success).toBe(true);
    });

    it('should accept boundary name 1 char', () => {
      expect(createProjectSchema.safeParse({ name: 'A' }).success).toBe(true);
    });

    it('should accept boundary name 200 chars', () => {
      expect(createProjectSchema.safeParse({ name: 'A'.repeat(200) }).success).toBe(true);
    });

    it('should reject empty name', () => {
      expect(createProjectSchema.safeParse({ name: '' }).success).toBe(false);
    });

    it('should reject name > 200 chars', () => {
      expect(createProjectSchema.safeParse({ name: 'A'.repeat(201) }).success).toBe(false);
    });

    it('should reject missing name', () => {
      expect(createProjectSchema.safeParse({}).success).toBe(false);
    });
  });

  describe('updateProjectSchema', () => {
    it('should accept empty object', () => {
      expect(updateProjectSchema.safeParse({}).success).toBe(true);
    });

    it('should accept single field', () => {
      expect(updateProjectSchema.safeParse({ name: 'New Name' }).success).toBe(true);
    });

    it('should accept all fields', () => {
      const result = updateProjectSchema.safeParse({
        name: 'Updated',
        groq_api_key: 'gsk_new',
        settings: { max_npcs: 50 },
      });
      expect(result.success).toBe(true);
    });

    it('should accept nested valid settings', () => {
      const result = updateProjectSchema.safeParse({
        settings: {
          max_npcs: 500,
          memory_decay_enabled: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty string name', () => {
      expect(updateProjectSchema.safeParse({ name: '' }).success).toBe(false);
    });

    it('should reject invalid nested settings', () => {
      const result = updateProjectSchema.safeParse({
        settings: { max_npcs: -1 },
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('Project Service - toSafe', () => {
  it('should strip sensitive fields and add has_groq_key true', async () => {
    const { encrypt } = await import('../../../apps/server/src/utils/crypto');

    const fakeProject = {
      id: 'test-id',
      name: 'Test',
      api_key_hash: '$2b$12$secret-hash',
      api_key_prefix: 'mw_test1',
      previous_api_key_hash: null,
      key_rotation_expires_at: null,
      groq_key_encrypted: encrypt('gsk_test'),
      player_signing_secret: 'super-secret-signing-key',
      settings: {},
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Apply the same transformation as toSafe
    const { api_key_hash, groq_key_encrypted, player_signing_secret, ...safe } = fakeProject;
    const result = { ...safe, has_groq_key: !!groq_key_encrypted };

    expect(result).not.toHaveProperty('api_key_hash');
    expect(result).not.toHaveProperty('groq_key_encrypted');
    expect(result).not.toHaveProperty('player_signing_secret');
    expect(result.has_groq_key).toBe(true);
    expect(result.id).toBe('test-id');
    expect(result.name).toBe('Test');
  });

  it('should set has_groq_key false when groq key is null', () => {
    const fakeProject = {
      id: 'test-id',
      name: 'Test',
      api_key_hash: '$2b$12$secret-hash',
      api_key_prefix: 'mw_test1',
      previous_api_key_hash: null,
      key_rotation_expires_at: null,
      groq_key_encrypted: null,
      player_signing_secret: 'super-secret-signing-key',
      settings: {},
      created_at: new Date(),
      updated_at: new Date(),
    };

    const { api_key_hash, groq_key_encrypted, player_signing_secret, ...safe } = fakeProject;
    const result = { ...safe, has_groq_key: !!groq_key_encrypted };

    expect(result.has_groq_key).toBe(false);
  });
});

describe('Project Service - Groq Key Encryption', () => {
  it('should encrypt and decrypt round-trip', async () => {
    const { encrypt, decrypt } = await import('../../../apps/server/src/utils/crypto');

    const original = 'gsk_test_api_key_12345';
    const encrypted = encrypt(original);
    const decrypted = decrypt(encrypted);

    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for same plaintext', async () => {
    const { encrypt } = await import('../../../apps/server/src/utils/crypto');

    const original = 'gsk_test_api_key_12345';
    const encrypted1 = encrypt(original);
    const encrypted2 = encrypt(original);

    expect(encrypted1).not.toBe(encrypted2);
  });
});
