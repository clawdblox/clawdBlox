// Set required environment variables
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SKIP = !process.env.DATABASE_URL;

describe.skipIf(SKIP)('Memory Integration Tests', () => {
  let pool: any;
  let memoryRepository: any;
  let projectRepository: any;
  let npcRepository: any;
  let projectId: string;
  let npcId: string;

  beforeAll(async () => {
    // Dynamic imports
    const dbModule = await import('../../apps/server/src/config/database');
    pool = dbModule.pool;

    const memoryRepoModule = await import('../../apps/server/src/modules/memory/memory.repository');
    memoryRepository = memoryRepoModule.memoryRepository;

    const projectRepoModule = await import('../../apps/server/src/modules/project/project.repository');
    projectRepository = projectRepoModule.projectRepository;

    const npcRepoModule = await import('../../apps/server/src/modules/npc/npc.repository');
    npcRepository = npcRepoModule.npcRepository;

    // Create test project
    const project = await projectRepository.create({
      name: 'Test Project for Memory',
      api_key_hash: 'test-hash',
      api_key_prefix: 'mw_test_memory',
      player_signing_secret: 'test-secret',
    });
    projectId = project.id;

    // Create test NPC
    const npc = await npcRepository.create(projectId, {
      name: 'Test NPC for Memory',
      personality: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      speaking_style: {
        vocabulary_level: 'moderate',
        formality: 'neutral',
        humor: 'subtle',
        verbosity: 'normal',
        quirks: [],
        catchphrases: [],
      },
      backstory: 'Test NPC for memory tests.',
    });
    npcId = npc.id;
  });

  afterAll(async () => {
    // Cleanup
    if (npcId) {
      await pool.query('DELETE FROM memories WHERE npc_id = $1', [npcId]);
      await pool.query('DELETE FROM npcs WHERE id = $1', [npcId]);
    }
    if (projectId) {
      await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await pool.end();
  });

  function createFakeEmbedding(): number[] {
    // Create a 1536-dimensional embedding with random values
    const embedding: number[] = [];
    for (let i = 0; i < 1536; i++) {
      embedding.push(Math.random());
    }
    return embedding;
  }

  it('should create memory with embedding', async () => {
    const memoryData = {
      type: 'episodic' as const,
      importance: 'medium' as const,
      content: 'The player asked about the weather.',
      embedding: createFakeEmbedding(),
      metadata: { context: 'casual conversation' },
    };

    const memory = await memoryRepository.create(npcId, memoryData);

    expect(memory).toBeDefined();
    expect(memory.id).toBeDefined();
    expect(memory.npc_id).toBe(npcId);
    expect(memory.type).toBe('episodic');
    expect(memory.importance).toBe('medium');
    expect(memory.content).toBe('The player asked about the weather.');
    expect(memory.vividness).toBe(1.0); // Default vividness
  });

  it('should list memories with pagination', async () => {
    // Create multiple memories
    for (let i = 0; i < 3; i++) {
      await memoryRepository.create(npcId, {
        type: 'episodic' as const,
        importance: 'low' as const,
        content: `Test memory ${i}`,
        embedding: createFakeEmbedding(),
      });
    }

    const result = await memoryRepository.findAll(npcId, 1, 10);

    expect(result).toBeDefined();
    expect(result.memories).toBeInstanceOf(Array);
    expect(result.memories.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should get memory by id', async () => {
    const memoryData = {
      type: 'semantic' as const,
      importance: 'high' as const,
      content: 'The capital of France is Paris.',
      embedding: createFakeEmbedding(),
    };

    const created = await memoryRepository.create(npcId, memoryData);
    const memory = await memoryRepository.findById(created.id, npcId);

    expect(memory).toBeDefined();
    expect(memory.id).toBe(created.id);
    expect(memory.content).toBe('The capital of France is Paris.');
  });

  it('should update memory vividness', async () => {
    const memoryData = {
      type: 'procedural' as const,
      importance: 'medium' as const,
      content: 'How to craft a sword.',
      embedding: createFakeEmbedding(),
    };

    const created = await memoryRepository.create(npcId, memoryData);
    const updated = await memoryRepository.update(created.id, npcId, {
      vividness: 0.7,
    });

    expect(updated).toBeDefined();
    expect(updated.vividness).toBe(0.7);
  });

  it('should delete memory', async () => {
    const memoryData = {
      type: 'episodic' as const,
      importance: 'low' as const,
      content: 'Memory to delete.',
      embedding: createFakeEmbedding(),
    };

    const created = await memoryRepository.create(npcId, memoryData);
    const deleted = await memoryRepository.delete(created.id, npcId);

    expect(deleted).toBe(true);

    const notFound = await memoryRepository.findById(created.id, npcId);
    expect(notFound).toBeNull();
  });

  it('should batch decay memories based on importance', async () => {
    // Create memories with different importance levels
    const highImportance = await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'high' as const,
      content: 'High importance memory.',
      embedding: createFakeEmbedding(),
    });

    const lowImportance = await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'low' as const,
      content: 'Low importance memory.',
      embedding: createFakeEmbedding(),
    });

    // Decay rates: high decays less, low decays more
    const decayRates = {
      critical: 0.005,
      high: 0.01,
      medium: 0.02,
      low: 0.05,
    };

    const updatedCount = await memoryRepository.batchDecay(decayRates);

    expect(updatedCount).toBeGreaterThan(0);

    // Check that vividness decreased
    const highAfter = await memoryRepository.findById(highImportance.id, npcId);
    const lowAfter = await memoryRepository.findById(lowImportance.id, npcId);

    expect(highAfter.vividness).toBeLessThan(1.0);
    expect(lowAfter.vividness).toBeLessThan(1.0);
    expect(lowAfter.vividness).toBeLessThan(highAfter.vividness); // Low decays faster
  });

  it('should increment access_count with recordAccess', async () => {
    const memoryData = {
      type: 'semantic' as const,
      importance: 'medium' as const,
      content: 'Access count test.',
      embedding: createFakeEmbedding(),
    };

    const created = await memoryRepository.create(npcId, memoryData);
    expect(created.access_count).toBe(0);

    await memoryRepository.recordAccess(created.id);

    const accessed = await memoryRepository.findById(created.id, npcId);
    expect(accessed.access_count).toBe(1);

    await memoryRepository.recordAccess(created.id);
    const accessed2 = await memoryRepository.findById(created.id, npcId);
    expect(accessed2.access_count).toBe(2);
  });

  it('should perform semantic search with embeddings', async () => {
    // Create memories with different embeddings
    const embedding1 = createFakeEmbedding();
    const memory1 = await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'medium' as const,
      content: 'First test memory for search.',
      embedding: embedding1,
    });

    const embedding2 = createFakeEmbedding();
    await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'high' as const,
      content: 'Second test memory for search.',
      embedding: embedding2,
    });

    // Search with embedding1 - should return memory1 with highest similarity
    const results = await memoryRepository.searchSemantic(npcId, embedding1, {
      limit: 5,
    });

    expect(results).toBeInstanceOf(Array);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('similarity');
    expect(results[0].id).toBe(memory1.id);
  });

  it('should filter semantic search by type', async () => {
    // Create memories of different types
    await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'medium' as const,
      content: 'Episodic memory.',
      embedding: createFakeEmbedding(),
    });

    const semantic = await memoryRepository.create(npcId, {
      type: 'semantic' as const,
      importance: 'medium' as const,
      content: 'Semantic memory.',
      embedding: createFakeEmbedding(),
    });

    // Search only semantic memories
    const results = await memoryRepository.searchSemantic(npcId, createFakeEmbedding(), {
      limit: 10,
      types: ['semantic'],
    });

    expect(results.every(m => m.type === 'semantic')).toBe(true);
  });

  it('should filter semantic search by importance', async () => {
    await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'low' as const,
      content: 'Low importance.',
      embedding: createFakeEmbedding(),
    });

    await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'high' as const,
      content: 'High importance.',
      embedding: createFakeEmbedding(),
    });

    // Search only high importance
    const results = await memoryRepository.searchSemantic(npcId, createFakeEmbedding(), {
      limit: 10,
      importanceLevels: ['high', 'critical'],
    });

    expect(results.every(m => m.importance === 'high' || m.importance === 'critical')).toBe(true);
  });

  it('should filter semantic search by min vividness', async () => {
    // Create memory with low vividness
    const lowVividness = await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'medium' as const,
      content: 'Low vividness memory.',
      embedding: createFakeEmbedding(),
    });

    await memoryRepository.update(lowVividness.id, npcId, { vividness: 0.3 });

    // Create memory with high vividness
    await memoryRepository.create(npcId, {
      type: 'episodic' as const,
      importance: 'medium' as const,
      content: 'High vividness memory.',
      embedding: createFakeEmbedding(),
    });

    // Search with min vividness 0.5
    const results = await memoryRepository.searchSemantic(npcId, createFakeEmbedding(), {
      limit: 10,
      minVividness: 0.5,
    });

    expect(results.every(m => m.vividness >= 0.5)).toBe(true);
  });
});
