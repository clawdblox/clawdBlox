// Set required environment variables
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SKIP = !process.env.DATABASE_URL;

describe.skipIf(SKIP)('Stats Integration Tests', () => {
  let pool: any;
  let projectRepository: any;
  let npcRepository: any;
  let conversationRepository: any;
  let memoryRepository: any;
  let relationshipRepository: any;

  let mainProjectId: string;
  let otherProjectId: string;
  let emptyProjectId: string;

  // NPC IDs for main project
  let mainNpc1Id: string;
  let mainNpc2Id: string;

  // NPC ID for other project
  let otherNpcId: string;

  const DUMMY_EMBEDDING = new Array(1536).fill(0);

  beforeAll(async () => {
    const dbModule = await import('../../apps/server/src/config/database');
    pool = dbModule.pool;

    const projectRepoModule = await import('../../apps/server/src/modules/project/project.repository');
    projectRepository = projectRepoModule.projectRepository;

    const npcRepoModule = await import('../../apps/server/src/modules/npc/npc.repository');
    npcRepository = npcRepoModule.npcRepository;

    const convRepoModule = await import('../../apps/server/src/modules/conversation/conversation.repository');
    conversationRepository = convRepoModule.conversationRepository;

    const memRepoModule = await import('../../apps/server/src/modules/memory/memory.repository');
    memoryRepository = memRepoModule.memoryRepository;

    const relRepoModule = await import('../../apps/server/src/modules/life/relationship.repository');
    relationshipRepository = relRepoModule.relationshipRepository;

    // Create main project
    const mainProject = await projectRepository.create({
      name: 'Stats Main Project',
      api_key_hash: 'stats-main-hash',
      api_key_prefix: 'mw_stm01',
      player_signing_secret: 'stats-main-secret',
    });
    mainProjectId = mainProject.id;

    // Create other project (for isolation testing)
    const otherProject = await projectRepository.create({
      name: 'Stats Other Project',
      api_key_hash: 'stats-other-hash',
      api_key_prefix: 'mw_sto01',
      player_signing_secret: 'stats-other-secret',
    });
    otherProjectId = otherProject.id;

    // Create empty project
    const emptyProject = await projectRepository.create({
      name: 'Stats Empty Project',
      api_key_hash: 'stats-empty-hash',
      api_key_prefix: 'mw_ste01',
      player_signing_secret: 'stats-empty-secret',
    });
    emptyProjectId = emptyProject.id;

    const npcData = {
      personality: { openness: 0.5, conscientiousness: 0.5, extraversion: 0.5, agreeableness: 0.5, neuroticism: 0.5 },
      speaking_style: { vocabulary_level: 'moderate', formality: 'neutral', humor: 'none', verbosity: 'normal', quirks: [], catchphrases: [] },
      backstory: 'Test NPC for stats.',
    };

    // Main project: 2 NPCs
    const mainNpc1 = await npcRepository.create(mainProjectId, { ...npcData, name: 'Stats NPC 1' });
    mainNpc1Id = mainNpc1.id;
    const mainNpc2 = await npcRepository.create(mainProjectId, { ...npcData, name: 'Stats NPC 2' });
    mainNpc2Id = mainNpc2.id;

    // Other project: 1 NPC
    const otherNpc = await npcRepository.create(otherProjectId, { ...npcData, name: 'Other NPC' });
    otherNpcId = otherNpc.id;

    // Main project: 3 conversations (2 active + 1 ended)
    const conv1 = await conversationRepository.create(mainNpc1Id, 'player-stats-1');
    const conv2 = await conversationRepository.create(mainNpc1Id, 'player-stats-2');
    const conv3 = await conversationRepository.create(mainNpc2Id, 'player-stats-3');
    await conversationRepository.endConversation(conv3.id, 'ended conversation');

    // Other project: 1 conversation
    await conversationRepository.create(otherNpcId, 'player-other-1');

    // Main project: 3 memories with varied vividness
    // Default vividness = 1.0, we'll update two to get avg ≈ 0.87
    const mem1 = await memoryRepository.create(mainNpc1Id, {
      type: 'episodic',
      importance: 'moderate',
      content: 'Stats memory 1',
      embedding: DUMMY_EMBEDDING,
    });
    const mem2 = await memoryRepository.create(mainNpc1Id, {
      type: 'semantic',
      importance: 'significant',
      content: 'Stats memory 2',
      embedding: DUMMY_EMBEDDING,
    });
    const mem3 = await memoryRepository.create(mainNpc2Id, {
      type: 'emotional',
      importance: 'trivial',
      content: 'Stats memory 3',
      embedding: DUMMY_EMBEDDING,
    });

    // Update vividness: 1.0, 0.8, 0.8 → avg = 0.8667 → toFixed2 = 0.87
    await memoryRepository.update(mem2.id, mainNpc1Id, { vividness: 0.8 });
    await memoryRepository.update(mem3.id, mainNpc2Id, { vividness: 0.8 });

    // Other project: 1 memory
    await memoryRepository.create(otherNpcId, {
      type: 'procedural',
      importance: 'minor',
      content: 'Other memory',
      embedding: DUMMY_EMBEDDING,
    });

    // Main project: 2 relationships with varied affinity/trust
    // rel1: affinity=-0.3, trust=0.4 | rel2: affinity=0.5, trust=0.8
    // avg_affinity = 0.1, avg_trust = 0.6, avg_familiarity = 0
    await relationshipRepository.create(mainNpc1Id, {
      target_type: 'player',
      target_id: 'player-stats-1',
      affinity: -0.3,
      trust: 0.4,
    });
    await relationshipRepository.create(mainNpc2Id, {
      target_type: 'player',
      target_id: 'player-stats-3',
      affinity: 0.5,
      trust: 0.8,
    });

    // Other project: 1 relationship
    await relationshipRepository.create(otherNpcId, {
      target_type: 'player',
      target_id: 'player-other-1',
      affinity: 0.9,
      trust: 0.9,
    });
  });

  afterAll(async () => {
    // Cascade delete handles npcs, conversations, memories, relationships
    for (const id of [mainProjectId, otherProjectId, emptyProjectId]) {
      if (id) await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    }
    await pool.end();
  });

  // Helper: run the same stats queries as stats.controller.ts
  function toInt(value: string): number {
    return parseInt(value, 10);
  }

  function toFixed2(value: string): number {
    return Math.round(parseFloat(value) * 100) / 100;
  }

  async function getStats(projectId: string) {
    const projectFilter = 'npc_id IN (SELECT id FROM npcs WHERE project_id = $1)';

    const [npcs, conversations, memories, relationships] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM npcs WHERE project_id = $1', [projectId]),
      pool.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active
         FROM conversations WHERE ${projectFilter}`,
        [projectId],
      ),
      pool.query(
        `SELECT COUNT(*) AS total, COALESCE(AVG(vividness), 0) AS avg_vividness
         FROM memories WHERE ${projectFilter}`,
        [projectId],
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                COALESCE(AVG(affinity), 0) AS avg_affinity,
                COALESCE(AVG(trust), 0) AS avg_trust,
                COALESCE(AVG(familiarity), 0) AS avg_familiarity
         FROM relationships WHERE ${projectFilter}`,
        [projectId],
      ),
    ]);

    const npc = npcs.rows[0];
    const conv = conversations.rows[0];
    const mem = memories.rows[0];
    const rel = relationships.rows[0];

    return {
      npcs: { total: toInt(npc.count) },
      conversations: { total: toInt(conv.total), active: toInt(conv.active) },
      memories: { total: toInt(mem.total), avg_vividness: toFixed2(mem.avg_vividness) },
      relationships: {
        total: toInt(rel.total),
        avg_affinity: toFixed2(rel.avg_affinity),
        avg_trust: toFixed2(rel.avg_trust),
        avg_familiarity: toFixed2(rel.avg_familiarity),
      },
    };
  }

  describe('NPC stats', () => {
    it('should count 2 NPCs for main project', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.npcs.total).toBe(2);
    });

    it('should count 1 NPC for other project (isolation)', async () => {
      const stats = await getStats(otherProjectId);
      expect(stats.npcs.total).toBe(1);
    });
  });

  describe('Conversation stats', () => {
    it('should count 3 total conversations for main project', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.conversations.total).toBe(3);
    });

    it('should count 2 active conversations for main project', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.conversations.active).toBe(2);
    });

    it('should count 1 conversation for other project (isolation)', async () => {
      const stats = await getStats(otherProjectId);
      expect(stats.conversations.total).toBe(1);
      expect(stats.conversations.active).toBe(1);
    });
  });

  describe('Memory stats', () => {
    it('should count 3 total memories for main project', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.memories.total).toBe(3);
    });

    it('should calculate avg_vividness close to 0.87', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.memories.avg_vividness).toBeCloseTo(0.87, 1);
    });

    it('should count 1 memory for other project (isolation)', async () => {
      const stats = await getStats(otherProjectId);
      expect(stats.memories.total).toBe(1);
    });
  });

  describe('Relationship stats', () => {
    it('should count 2 relationships for main project', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.relationships.total).toBe(2);
    });

    it('should calculate avg_affinity close to 0.1', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.relationships.avg_affinity).toBeCloseTo(0.1, 1);
    });

    it('should calculate avg_trust close to 0.6', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.relationships.avg_trust).toBeCloseTo(0.6, 1);
    });

    it('should calculate avg_familiarity equal to 0', async () => {
      const stats = await getStats(mainProjectId);
      expect(stats.relationships.avg_familiarity).toBe(0);
    });

    it('should count 1 relationship for other project (isolation)', async () => {
      const stats = await getStats(otherProjectId);
      expect(stats.relationships.total).toBe(1);
    });
  });

  describe('Empty project', () => {
    it('should return all zeros for project with no data', async () => {
      const stats = await getStats(emptyProjectId);

      expect(stats.npcs.total).toBe(0);
      expect(stats.conversations.total).toBe(0);
      expect(stats.conversations.active).toBe(0);
      expect(stats.memories.total).toBe(0);
      expect(stats.memories.avg_vividness).toBe(0);
      expect(stats.relationships.total).toBe(0);
      expect(stats.relationships.avg_affinity).toBe(0);
      expect(stats.relationships.avg_trust).toBe(0);
      expect(stats.relationships.avg_familiarity).toBe(0);
    });
  });
});
