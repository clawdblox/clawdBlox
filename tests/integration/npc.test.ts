// Set required environment variables
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SKIP = !process.env.DATABASE_URL;

describe.skipIf(SKIP)('NPC Integration Tests', () => {
  let pool: any;
  let npcRepository: any;
  let projectRepository: any;
  let projectId: string;

  beforeAll(async () => {
    // Dynamic imports
    const dbModule = await import('../../apps/server/src/config/database');
    pool = dbModule.pool;

    const npcRepoModule = await import('../../apps/server/src/modules/npc/npc.repository');
    npcRepository = npcRepoModule.npcRepository;

    const projectRepoModule = await import('../../apps/server/src/modules/project/project.repository');
    projectRepository = projectRepoModule.projectRepository;

    // Create a test project
    const project = await projectRepository.create({
      name: 'Test Project for NPC',
      api_key_hash: 'test-hash',
      api_key_prefix: 'mw_test_npc',
      player_signing_secret: 'test-secret',
    });
    projectId = project.id;
  });

  afterAll(async () => {
    // Cleanup
    if (projectId) {
      await pool.query('DELETE FROM npcs WHERE project_id = $1', [projectId]);
      await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await pool.end();
  });

  it('should create NPC with valid OCEAN personality', async () => {
    const npcData = {
      name: 'Test NPC',
      personality: {
        openness: 0.8,
        conscientiousness: 0.6,
        extraversion: 0.7,
        agreeableness: 0.5,
        neuroticism: 0.3,
      },
      speaking_style: {
        vocabulary_level: 'moderate',
        formality: 'neutral',
        humor: 'subtle',
        verbosity: 'normal',
        quirks: ['thoughtful pauses'],
        catchphrases: ['indeed'],
      },
      backstory: 'A test character with moderate personality traits.',
    };

    const npc = await npcRepository.create(projectId, npcData);

    expect(npc).toBeDefined();
    expect(npc.id).toBeDefined();
    expect(npc.name).toBe('Test NPC');
    expect(npc.personality.openness).toBe(0.8);
    expect(npc.personality.conscientiousness).toBe(0.6);
    expect(npc.speaking_style.vocabulary_level).toBe('moderate');
  });

  it('should reject NPC with invalid OCEAN values (value > 1)', async () => {
    const npcData = {
      name: 'Invalid NPC',
      personality: {
        openness: 1.5, // Invalid: > 1
        conscientiousness: 0.6,
        extraversion: 0.7,
        agreeableness: 0.5,
        neuroticism: 0.3,
      },
      speaking_style: {
        vocabulary_level: 'moderate',
        formality: 'neutral',
        humor: 'subtle',
        verbosity: 'normal',
        quirks: [],
        catchphrases: [],
      },
      backstory: 'Invalid character',
    };

    // Validate with Zod schema - should fail
    const { oceanPersonalitySchema } = await import('@clawdblox/memoryweave-shared');
    const validation = oceanPersonalitySchema.safeParse(npcData.personality);
    expect(validation.success).toBe(false);
  });

  it('should reject NPC with invalid OCEAN values (value < 0)', async () => {
    const npcData = {
      name: 'Invalid NPC 2',
      personality: {
        openness: 0.5,
        conscientiousness: -0.2, // Invalid: < 0
        extraversion: 0.7,
        agreeableness: 0.5,
        neuroticism: 0.3,
      },
      speaking_style: {
        vocabulary_level: 'moderate',
        formality: 'neutral',
        humor: 'subtle',
        verbosity: 'normal',
        quirks: [],
        catchphrases: [],
      },
      backstory: 'Invalid character',
    };

    const { oceanPersonalitySchema } = await import('@clawdblox/memoryweave-shared');
    const validation = oceanPersonalitySchema.safeParse(npcData.personality);
    expect(validation.success).toBe(false);
  });

  it('should list NPCs', async () => {
    const result = await npcRepository.findAll(projectId, 1, 10);

    expect(result).toBeDefined();
    expect(result.npcs).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  it('should get single NPC by id', async () => {
    // First create an NPC
    const npcData = {
      name: 'Get Test NPC',
      personality: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      speaking_style: {
        vocabulary_level: 'simple',
        formality: 'casual',
        humor: 'none',
        verbosity: 'terse',
        quirks: [],
        catchphrases: [],
      },
      backstory: 'A simple test character.',
    };

    const created = await npcRepository.create(projectId, npcData);
    const npc = await npcRepository.findById(created.id, projectId);

    expect(npc).toBeDefined();
    expect(npc.id).toBe(created.id);
    expect(npc.name).toBe('Get Test NPC');
  });

  it('should update NPC personality partially', async () => {
    // Create an NPC
    const npcData = {
      name: 'Update Test NPC',
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
      backstory: 'Character to update.',
    };

    const created = await npcRepository.create(projectId, npcData);

    // Update personality
    const updatedPersonality = {
      ...created.personality,
      openness: 0.9,
      extraversion: 0.2,
    };

    const updated = await npcRepository.update(created.id, projectId, {
      personality: updatedPersonality,
    });

    expect(updated).toBeDefined();
    expect(updated.personality.openness).toBe(0.9);
    expect(updated.personality.extraversion).toBe(0.2);
    expect(updated.personality.conscientiousness).toBe(0.5); // Unchanged
  });

  it('should delete NPC', async () => {
    // Create an NPC
    const npcData = {
      name: 'Delete Test NPC',
      personality: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      speaking_style: {
        vocabulary_level: 'simple',
        formality: 'casual',
        humor: 'none',
        verbosity: 'terse',
        quirks: [],
        catchphrases: [],
      },
      backstory: 'Character to delete.',
    };

    const created = await npcRepository.create(projectId, npcData);
    const deleted = await npcRepository.delete(created.id, projectId);

    expect(deleted).toBe(true);

    // Verify deletion
    const notFound = await npcRepository.findById(created.id, projectId);
    expect(notFound).toBeNull();
  });

  it('should support optional values, fears, desires in personality', async () => {
    const npcData = {
      name: 'Complex Personality NPC',
      personality: {
        openness: 0.7,
        conscientiousness: 0.6,
        extraversion: 0.8,
        agreeableness: 0.5,
        neuroticism: 0.4,
        values: ['honesty', 'loyalty', 'courage'],
        fears: ['betrayal', 'failure'],
        desires: ['recognition', 'peace'],
      },
      speaking_style: {
        vocabulary_level: 'advanced',
        formality: 'formal',
        humor: 'subtle',
        verbosity: 'verbose',
        quirks: [],
        catchphrases: [],
      },
      backstory: 'A character with rich personality.',
    };

    const npc = await npcRepository.create(projectId, npcData);

    expect(npc).toBeDefined();
    expect(npc.personality.values).toEqual(['honesty', 'loyalty', 'courage']);
    expect(npc.personality.fears).toEqual(['betrayal', 'failure']);
    expect(npc.personality.desires).toEqual(['recognition', 'peace']);
  });

  it('should support optional speech_patterns and accent in speaking_style', async () => {
    const npcData = {
      name: 'Speech Pattern NPC',
      personality: {
        openness: 0.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      },
      speaking_style: {
        vocabulary_level: 'archaic',
        formality: 'formal',
        humor: 'none',
        verbosity: 'verbose',
        quirks: ['dramatic pauses'],
        catchphrases: ['Verily'],
        speech_patterns: ['speaks in riddles', 'uses metaphors'],
        accent: 'British',
      },
      backstory: 'An old wise character.',
    };

    const npc = await npcRepository.create(projectId, npcData);

    expect(npc).toBeDefined();
    expect(npc.speaking_style.speech_patterns).toEqual(['speaks in riddles', 'uses metaphors']);
    expect(npc.speaking_style.accent).toBe('British');
  });
});
