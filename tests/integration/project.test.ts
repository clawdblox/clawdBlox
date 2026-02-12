// Set required environment variables
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SKIP = !process.env.DATABASE_URL;

describe.skipIf(SKIP)('Project Integration Tests', () => {
  let pool: any;
  let projectRepository: any;
  let projectService: any;
  let generateApiKey: any;
  let hashApiKey: any;
  let verifyApiKey: any;
  let encrypt: any;
  let decrypt: any;

  const createdProjectIds: string[] = [];

  beforeAll(async () => {
    const dbModule = await import('../../apps/server/src/config/database');
    pool = dbModule.pool;

    const projectRepoModule = await import('../../apps/server/src/modules/project/project.repository');
    projectRepository = projectRepoModule.projectRepository;

    const projectServiceModule = await import('../../apps/server/src/modules/project/project.service');
    projectService = projectServiceModule.projectService;

    const apiKeyModule = await import('../../apps/server/src/utils/api-key');
    generateApiKey = apiKeyModule.generateApiKey;
    hashApiKey = apiKeyModule.hashApiKey;
    verifyApiKey = apiKeyModule.verifyApiKey;

    const cryptoModule = await import('../../apps/server/src/utils/crypto');
    encrypt = cryptoModule.encrypt;
    decrypt = cryptoModule.decrypt;
  });

  afterAll(async () => {
    for (const id of createdProjectIds) {
      await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    }
    await pool.end();
  });

  async function createTestProject(overrides: Record<string, unknown> = {}) {
    const { key, prefix } = generateApiKey();
    const hash = await hashApiKey(key);
    const project = await projectRepository.create({
      name: 'Test Project',
      api_key_hash: hash,
      api_key_prefix: overrides.api_key_prefix || prefix,
      player_signing_secret: 'test-signing-secret-hex-string',
      ...overrides,
    });
    createdProjectIds.push(project.id);
    return { project, apiKey: key };
  }

  describe('Project Repository - CRUD', () => {
    it('should create with required fields', async () => {
      const { project } = await createTestProject({ api_key_prefix: 'mw_prj01' });

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.name).toBe('Test Project');
      expect(project.api_key_hash).toBeDefined();
      expect(project.api_key_prefix).toBe('mw_prj01');
      expect(project.player_signing_secret).toBeDefined();
      expect(project.groq_key_encrypted).toBeNull();
      expect(project.settings).toEqual({});
    });

    it('should create with optional groq_key_encrypted', async () => {
      const encrypted = encrypt('gsk_test_key');
      const { project } = await createTestProject({
        api_key_prefix: 'mw_prj02',
        groq_key_encrypted: encrypted,
      });

      expect(project.groq_key_encrypted).toBe(encrypted);
    });

    it('should create with settings', async () => {
      const settings = { max_npcs: 50, memory_decay_enabled: true };
      const { project } = await createTestProject({
        api_key_prefix: 'mw_prj03',
        settings,
      });

      expect(project.settings).toEqual(settings);
    });

    it('should findById successfully', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prj04' });
      const found = await projectRepository.findById(created.id);

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
      expect(found.name).toBe(created.name);
    });

    it('should return null for findById with non-existent UUID', async () => {
      const found = await projectRepository.findById('00000000-0000-0000-0000-000000000000');
      expect(found).toBeNull();
    });

    it('should findByApiKeyPrefix successfully', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prj05' });
      const found = await projectRepository.findByApiKeyPrefix('mw_prj05');

      expect(found).toBeDefined();
      expect(found.id).toBe(created.id);
    });

    it('should return null for findByApiKeyPrefix with non-existent prefix', async () => {
      const found = await projectRepository.findByApiKeyPrefix('mw_nonex');
      expect(found).toBeNull();
    });

    it('should update name', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prj06' });
      const updated = await projectRepository.update(created.id, { name: 'Updated Name' });

      expect(updated).toBeDefined();
      expect(updated.name).toBe('Updated Name');
    });

    it('should update settings (JSON)', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prj07' });
      const newSettings = { max_npcs: 200, groq_chat_model: 'llama-3.2' };
      const updated = await projectRepository.update(created.id, { settings: newSettings });

      expect(updated.settings).toEqual(newSettings);
    });

    it('should update groq_key_encrypted', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prj08' });
      const encrypted = encrypt('gsk_new_key');
      const updated = await projectRepository.update(created.id, { groq_key_encrypted: encrypted });

      expect(updated.groq_key_encrypted).toBe(encrypted);
    });

    it('should update multiple fields at once', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prj09' });
      const encrypted = encrypt('gsk_multi');
      const updated = await projectRepository.update(created.id, {
        name: 'Multi Update',
        groq_key_encrypted: encrypted,
        settings: { max_npcs: 999 },
      });

      expect(updated.name).toBe('Multi Update');
      expect(updated.groq_key_encrypted).toBe(encrypted);
      expect(updated.settings).toEqual({ max_npcs: 999 });
    });

    it('should return current project for empty update data', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prj10' });
      const result = await projectRepository.update(created.id, {});

      expect(result).toBeDefined();
      expect(result.id).toBe(created.id);
      expect(result.name).toBe(created.name);
    });

    it('should return null for update with non-existent ID', async () => {
      const result = await projectRepository.update('00000000-0000-0000-0000-000000000000', { name: 'Ghost' });
      expect(result).toBeNull();
    });

    it('should delete successfully', async () => {
      const { key, prefix } = generateApiKey();
      const hash = await hashApiKey(key);
      const project = await projectRepository.create({
        name: 'To Delete',
        api_key_hash: hash,
        api_key_prefix: 'mw_prjdl',
        player_signing_secret: 'delete-secret',
      });
      // Don't add to createdProjectIds since we're deleting it

      const deleted = await projectRepository.delete(project.id);
      expect(deleted).toBe(true);

      const found = await projectRepository.findById(project.id);
      expect(found).toBeNull();
    });

    it('should return false for delete with non-existent ID', async () => {
      const deleted = await projectRepository.delete('00000000-0000-0000-0000-000000000000');
      expect(deleted).toBe(false);
    });
  });

  describe('Project Service - getById', () => {
    it('should return safe project without sensitive fields', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjs1' });
      const safe = await projectService.getById(created.id);

      expect(safe.id).toBe(created.id);
      expect(safe.name).toBe(created.name);
      expect(safe).not.toHaveProperty('api_key_hash');
      expect(safe).not.toHaveProperty('groq_key_encrypted');
      expect(safe).not.toHaveProperty('player_signing_secret');
    });

    it('should have has_groq_key false when not set', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjs2' });
      const safe = await projectService.getById(created.id);

      expect(safe.has_groq_key).toBe(false);
    });

    it('should have has_groq_key true when set', async () => {
      const encrypted = encrypt('gsk_key_for_flag');
      const { project: created } = await createTestProject({
        api_key_prefix: 'mw_prjs3',
        groq_key_encrypted: encrypted,
      });
      const safe = await projectService.getById(created.id);

      expect(safe.has_groq_key).toBe(true);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      await expect(
        projectService.getById('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('not found');
    });
  });

  describe('Project Service - update', () => {
    it('should update name', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prju1' });
      const updated = await projectService.update(created.id, { name: 'Service Updated' });

      expect(updated.name).toBe('Service Updated');
    });

    it('should encrypt groq_api_key and verify round-trip', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prju2' });
      await projectService.update(created.id, { groq_api_key: 'gsk_roundtrip_test' });

      // Read raw project from DB to verify encryption
      const raw = await projectRepository.findById(created.id);
      expect(raw.groq_key_encrypted).toBeDefined();
      expect(raw.groq_key_encrypted).not.toBe('gsk_roundtrip_test');

      const decrypted = decrypt(raw.groq_key_encrypted);
      expect(decrypted).toBe('gsk_roundtrip_test');
    });

    it('should update settings', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prju3' });
      const updated = await projectService.update(created.id, {
        settings: { max_npcs: 42, memory_decay_enabled: false },
      });

      expect(updated.settings).toEqual({ max_npcs: 42, memory_decay_enabled: false });
    });

    it('should throw NotFoundError for non-existent project', async () => {
      await expect(
        projectService.update('00000000-0000-0000-0000-000000000000', { name: 'Ghost' }),
      ).rejects.toThrow('not found');
    });

    it('should not overwrite other fields on partial update', async () => {
      const encrypted = encrypt('gsk_partial_test');
      const { project: created } = await createTestProject({
        name: 'Original Name',
        api_key_prefix: 'mw_prju4',
        groq_key_encrypted: encrypted,
      });

      await projectService.update(created.id, { name: 'Changed Name' });

      const raw = await projectRepository.findById(created.id);
      expect(raw.name).toBe('Changed Name');
      expect(raw.groq_key_encrypted).toBe(encrypted);
    });
  });

  describe('Project Service - rotateApiKey', () => {
    it('should return key with mw_ prefix', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjr1' });
      const { apiKey } = await projectService.rotateApiKey(created.id);

      expect(apiKey).toMatch(/^mw_/);
    });

    it('should save old hash as previous_api_key_hash', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjr2' });
      const oldHash = created.api_key_hash;

      await projectService.rotateApiKey(created.id);

      const raw = await projectRepository.findById(created.id);
      expect(raw.previous_api_key_hash).toBe(oldHash);
    });

    it('should set key_rotation_expires_at ~24h in future', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjr3' });
      const before = Date.now();

      await projectService.rotateApiKey(created.id);

      const raw = await projectRepository.findById(created.id);
      const expiresAt = new Date(raw.key_rotation_expires_at).getTime();
      const expected24h = before + 24 * 60 * 60 * 1000;

      expect(Math.abs(expiresAt - expected24h)).toBeLessThan(5000);
    });

    it('should verify new key against new hash', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjr4' });
      const { apiKey } = await projectService.rotateApiKey(created.id);

      const raw = await projectRepository.findById(created.id);
      const valid = await verifyApiKey(apiKey, raw.api_key_hash);
      expect(valid).toBe(true);
    });

    it('should update prefix to match new key', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjr5' });
      const { apiKey } = await projectService.rotateApiKey(created.id);

      const raw = await projectRepository.findById(created.id);
      const expectedPrefix = apiKey.slice(0, 8);
      expect(raw.api_key_prefix).toBe(expectedPrefix);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      await expect(
        projectService.rotateApiKey('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('not found');
    });
  });

  describe('Project Service - rotateSigningSecret', () => {
    it('should return 64-char hex string', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjss1' });
      const { signingSecret } = await projectService.rotateSigningSecret(created.id);

      expect(signingSecret).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should update DB with new secret', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjss2' });
      const { signingSecret } = await projectService.rotateSigningSecret(created.id);

      const raw = await projectRepository.findById(created.id);
      expect(raw.player_signing_secret).toBe(signingSecret);
    });

    it('should produce different secrets on two calls', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjss3' });
      const { signingSecret: s1 } = await projectService.rotateSigningSecret(created.id);
      const { signingSecret: s2 } = await projectService.rotateSigningSecret(created.id);

      expect(s1).not.toBe(s2);
    });

    it('should throw NotFoundError for non-existent project', async () => {
      await expect(
        projectService.rotateSigningSecret('00000000-0000-0000-0000-000000000000'),
      ).rejects.toThrow('not found');
    });
  });

  describe('Project Service - getGroqKey', () => {
    it('should return decrypted key when set', async () => {
      const encrypted = encrypt('gsk_decryptable_key');
      const { project: created } = await createTestProject({
        api_key_prefix: 'mw_prjgk1',
        groq_key_encrypted: encrypted,
      });

      const raw = await projectRepository.findById(created.id);
      const key = await projectService.getGroqKey(raw);
      expect(key).toBe('gsk_decryptable_key');
    });

    it('should return null when groq key not set', async () => {
      const { project: created } = await createTestProject({ api_key_prefix: 'mw_prjgk2' });

      const raw = await projectRepository.findById(created.id);
      const key = await projectService.getGroqKey(raw);
      expect(key).toBeNull();
    });
  });
});
