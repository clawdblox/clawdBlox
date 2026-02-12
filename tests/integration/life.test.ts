// Set required environment variables
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'test-encryption-key-at-least-32-chars!!';
process.env.DATABASE_URL = process.env.DATABASE_URL || '';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-at-least-32-chars!!';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-at-least-32-char!';

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const SKIP = !process.env.DATABASE_URL;

describe.skipIf(SKIP)('Life System Integration Tests', () => {
  let pool: any;
  let routineRepository: any;
  let goalRepository: any;
  let relationshipRepository: any;
  let projectRepository: any;
  let npcRepository: any;
  let projectId: string;
  let npcId: string;

  beforeAll(async () => {
    // Dynamic imports
    const dbModule = await import('../../apps/server/src/config/database');
    pool = dbModule.pool;

    const routineRepoModule = await import('../../apps/server/src/modules/life/routine.repository');
    routineRepository = routineRepoModule.routineRepository;

    const goalRepoModule = await import('../../apps/server/src/modules/life/goal.repository');
    goalRepository = goalRepoModule.goalRepository;

    const relationshipRepoModule = await import('../../apps/server/src/modules/life/relationship.repository');
    relationshipRepository = relationshipRepoModule.relationshipRepository;

    const projectRepoModule = await import('../../apps/server/src/modules/project/project.repository');
    projectRepository = projectRepoModule.projectRepository;

    const npcRepoModule = await import('../../apps/server/src/modules/npc/npc.repository');
    npcRepository = npcRepoModule.npcRepository;

    // Create test project
    const project = await projectRepository.create({
      name: 'Test Project for Life',
      api_key_hash: 'test-hash',
      api_key_prefix: 'mw_test_life',
      player_signing_secret: 'test-secret',
    });
    projectId = project.id;

    // Create test NPC
    const npc = await npcRepository.create(projectId, {
      name: 'Test NPC for Life',
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
      backstory: 'Test NPC for life system tests.',
    });
    npcId = npc.id;
  });

  afterAll(async () => {
    // Cleanup
    if (npcId) {
      await pool.query('DELETE FROM routines WHERE npc_id = $1', [npcId]);
      await pool.query('DELETE FROM goals WHERE npc_id = $1', [npcId]);
      await pool.query('DELETE FROM relationships WHERE npc_id = $1', [npcId]);
      await pool.query('DELETE FROM npcs WHERE id = $1', [npcId]);
    }
    if (projectId) {
      await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
    }
    await pool.end();
  });

  describe('Routines', () => {
    it('should create routine with day_of_week', async () => {
      const routineData = {
        name: 'Morning Training',
        start_hour: 8,
        end_hour: 10,
        day_of_week: [1, 3, 5], // Monday, Wednesday, Friday
        location: 'Training Grounds',
        activity: 'Practicing sword techniques',
        interruptible: false,
        priority: 7,
      };

      const routine = await routineRepository.create(npcId, routineData);

      expect(routine).toBeDefined();
      expect(routine.id).toBeDefined();
      expect(routine.name).toBe('Morning Training');
      expect(routine.start_hour).toBe(8);
      expect(routine.end_hour).toBe(10);
      expect(routine.day_of_week).toEqual([1, 3, 5]);
      expect(routine.location).toBe('Training Grounds');
      expect(routine.priority).toBe(7);
      expect(routine.interruptible).toBe(false);
    });

    it('should list routines sorted by priority', async () => {
      // Create multiple routines with different priorities
      await routineRepository.create(npcId, {
        name: 'Low Priority Task',
        start_hour: 14,
        end_hour: 16,
        day_of_week: [1, 2, 3, 4, 5],
        location: 'Market',
        activity: 'Shopping',
        priority: 3,
      });

      await routineRepository.create(npcId, {
        name: 'High Priority Task',
        start_hour: 12,
        end_hour: 13,
        day_of_week: [1, 2, 3, 4, 5],
        location: 'Town Hall',
        activity: 'Important meeting',
        priority: 9,
      });

      const routines = await routineRepository.findAll(npcId);

      expect(routines).toBeInstanceOf(Array);
      expect(routines.length).toBeGreaterThan(0);

      // Should be sorted by priority DESC
      for (let i = 0; i < routines.length - 1; i++) {
        expect(routines[i].priority).toBeGreaterThanOrEqual(routines[i + 1].priority);
      }
    });

    it('should find current routine by hour and day', async () => {
      // Create a routine for Monday (day 1) from 9-11
      await routineRepository.create(npcId, {
        name: 'Test Current Routine',
        start_hour: 9,
        end_hour: 11,
        day_of_week: [1], // Monday
        location: 'Library',
        activity: 'Reading',
        priority: 5,
      });

      // Find routine at hour 10 on Monday (day 1)
      const current = await routineRepository.findCurrent(npcId, 10, 1);

      expect(current).toBeDefined();
      expect(current.name).toBe('Test Current Routine');
    });

    it('should not find routine outside time range', async () => {
      // Try to find routine at hour 12 when the routine ends at 11
      const notFound = await routineRepository.findCurrent(npcId, 12, 1);

      // Should either be null or a different routine
      if (notFound) {
        expect(notFound.name).not.toBe('Test Current Routine');
      }
    });

    it('should update routine', async () => {
      const routine = await routineRepository.create(npcId, {
        name: 'Update Test Routine',
        start_hour: 6,
        end_hour: 7,
        day_of_week: [2],
        location: 'Home',
        activity: 'Sleeping',
        priority: 2,
      });

      const updated = await routineRepository.update(routine.id, npcId, {
        priority: 8,
        location: 'Bedroom',
      });

      expect(updated).toBeDefined();
      expect(updated.priority).toBe(8);
      expect(updated.location).toBe('Bedroom');
      expect(updated.name).toBe('Update Test Routine'); // Unchanged
    });

    it('should delete routine', async () => {
      const routine = await routineRepository.create(npcId, {
        name: 'Delete Test Routine',
        start_hour: 20,
        end_hour: 21,
        day_of_week: [0, 6], // Sunday and Saturday
        location: 'Tavern',
        activity: 'Relaxing',
        priority: 4,
      });

      const deleted = await routineRepository.delete(routine.id, npcId);
      expect(deleted).toBe(true);

      const notFound = await routineRepository.findById(routine.id, npcId);
      expect(notFound).toBeNull();
    });
  });

  describe('Goals', () => {
    it('should create goal with goal_type', async () => {
      const goalData = {
        title: 'Become a master swordsman',
        goal_type: 'personal',
        priority: 8,
        success_criteria: ['Win 100 duels', 'Learn advanced techniques', 'Train daily'],
      };

      const goal = await goalRepository.create(npcId, goalData);

      expect(goal).toBeDefined();
      expect(goal.id).toBeDefined();
      expect(goal.title).toBe('Become a master swordsman');
      expect(goal.goal_type).toBe('personal');
      expect(goal.priority).toBe(8);
      expect(goal.success_criteria).toEqual(['Win 100 duels', 'Learn advanced techniques', 'Train daily']);
      expect(goal.status).toBe('active'); // Default status
      expect(goal.progress).toBe(0); // Default progress
    });

    it('should create goal with all goal_type enums', async () => {
      const types = ['personal', 'professional', 'social', 'survival', 'secret'];

      for (const type of types) {
        const goal = await goalRepository.create(npcId, {
          title: `Test ${type} goal`,
          goal_type: type,
          success_criteria: ['Test criterion'],
        });

        expect(goal.goal_type).toBe(type);
      }
    });

    it('should create sub-goal with parent_goal_id', async () => {
      const parentGoal = await goalRepository.create(npcId, {
        title: 'Master Combat',
        goal_type: 'professional',
        success_criteria: ['Complete all sub-goals'],
      });

      const subGoal = await goalRepository.create(npcId, {
        title: 'Learn Sword Fighting',
        goal_type: 'professional',
        success_criteria: ['Practice 10 hours'],
        parent_goal_id: parentGoal.id,
      });

      expect(subGoal).toBeDefined();
      expect(subGoal.parent_goal_id).toBe(parentGoal.id);

      // Verify we can find sub-goals
      const subGoals = await goalRepository.findSubGoals(parentGoal.id);
      expect(subGoals).toBeInstanceOf(Array);
      expect(subGoals.some(g => g.id === subGoal.id)).toBe(true);
    });

    it('should update goal progress and status', async () => {
      const goal = await goalRepository.create(npcId, {
        title: 'Progress Test Goal',
        goal_type: 'personal',
        success_criteria: ['Step 1', 'Step 2'],
      });

      const updated = await goalRepository.update(goal.id, npcId, {
        progress: 50,
        status: 'active',
      });

      expect(updated).toBeDefined();
      expect(updated.progress).toBe(50);
      expect(updated.status).toBe('active');
    });

    it('should support all goal statuses', async () => {
      const statuses = ['active', 'completed', 'failed', 'paused', 'abandoned'];

      const goal = await goalRepository.create(npcId, {
        title: 'Status Test Goal',
        goal_type: 'personal',
        success_criteria: ['Test'],
      });

      for (const status of statuses) {
        const updated = await goalRepository.update(goal.id, npcId, { status });
        expect(updated.status).toBe(status);
      }
    });

    it('should find active goals', async () => {
      await goalRepository.create(npcId, {
        title: 'Active Goal 1',
        goal_type: 'personal',
        success_criteria: ['Test'],
      });

      // Goals are created with 'active' status by default
      const activeGoals = await goalRepository.findActive(npcId);
      expect(activeGoals.every(g => g.status === 'active')).toBe(true);
    });

    it('should delete goal', async () => {
      const goal = await goalRepository.create(npcId, {
        title: 'Delete Test Goal',
        goal_type: 'survival',
        success_criteria: ['Stay alive'],
      });

      const deleted = await goalRepository.delete(goal.id, npcId);
      expect(deleted).toBe(true);

      const notFound = await goalRepository.findById(goal.id, npcId);
      expect(notFound).toBeNull();
    });
  });

  describe('Relationships', () => {
    it('should create relationship', async () => {
      const relationshipData = {
        target_type: 'player',
        target_id: 'player123',
        affinity: 0.3,
        trust: 0.6,
      };

      const relationship = await relationshipRepository.create(npcId, relationshipData);

      expect(relationship).toBeDefined();
      expect(relationship.id).toBeDefined();
      expect(relationship.npc_id).toBe(npcId);
      expect(relationship.target_type).toBe('player');
      expect(relationship.target_id).toBe('player123');
      expect(relationship.affinity).toBe(0.3);
      expect(relationship.trust).toBe(0.6);
      expect(relationship.familiarity).toBe(0); // Default
    });

    it('should update affinity and trust', async () => {
      const relationship = await relationshipRepository.create(npcId, {
        target_type: 'npc',
        target_id: 'npc456',
        affinity: 0.2,
        trust: 0.5,
      });

      const updated = await relationshipRepository.update(relationship.id, npcId, {
        affinity: 0.7,
        trust: 0.8,
      });

      expect(updated).toBeDefined();
      expect(updated.affinity).toBe(0.7);
      expect(updated.trust).toBe(0.8);
    });

    it('should delete relationship', async () => {
      const relationship = await relationshipRepository.create(npcId, {
        target_type: 'player',
        target_id: 'player_to_delete',
      });

      const deleted = await relationshipRepository.delete(relationship.id, npcId);
      expect(deleted).toBe(true);

      const notFound = await relationshipRepository.findById(relationship.id, npcId);
      expect(notFound).toBeNull();
    });

    it('should increment familiarity', async () => {
      const relationship = await relationshipRepository.create(npcId, {
        target_type: 'player',
        target_id: 'player_familiarity',
        affinity: 0,
        trust: 0.5,
      });

      expect(relationship.familiarity).toBe(0);

      // Increment familiarity
      await relationshipRepository.incrementFamiliarity(npcId, 'player', 'player_familiarity', 0.02);

      const updated = await relationshipRepository.findByTarget(npcId, 'player', 'player_familiarity');
      expect(updated.familiarity).toBeCloseTo(0.02, 2);
    });

    it('should increment familiarity with default value', async () => {
      const relationship = await relationshipRepository.create(npcId, {
        target_type: 'player',
        target_id: 'player_default_increment',
      });

      // Use default increment (0.02)
      await relationshipRepository.incrementFamiliarity(npcId, 'player', 'player_default_increment');

      const updated = await relationshipRepository.findByTarget(npcId, 'player', 'player_default_increment');
      expect(updated.familiarity).toBeCloseTo(0.02, 2);
    });

    it('should cap familiarity at 1.0', async () => {
      const relationship = await relationshipRepository.create(npcId, {
        target_type: 'player',
        target_id: 'player_cap_test',
      });

      // Increment to maximum
      for (let i = 0; i < 60; i++) {
        await relationshipRepository.incrementFamiliarity(npcId, 'player', 'player_cap_test', 0.02);
      }

      const updated = await relationshipRepository.findByTarget(npcId, 'player', 'player_cap_test');
      expect(updated.familiarity).toBeLessThanOrEqual(1.0);
    });

    it('should find relationship by target', async () => {
      await relationshipRepository.create(npcId, {
        target_type: 'player',
        target_id: 'player_find_test',
        affinity: 0.5,
      });

      const found = await relationshipRepository.findByTarget(npcId, 'player', 'player_find_test');

      expect(found).toBeDefined();
      expect(found.target_type).toBe('player');
      expect(found.target_id).toBe('player_find_test');
      expect(found.affinity).toBe(0.5);
    });

    it('should list all relationships', async () => {
      // Create multiple relationships
      await relationshipRepository.create(npcId, {
        target_type: 'player',
        target_id: 'player_list_1',
      });

      await relationshipRepository.create(npcId, {
        target_type: 'player',
        target_id: 'player_list_2',
      });

      const relationships = await relationshipRepository.findAll(npcId);

      expect(relationships).toBeInstanceOf(Array);
      expect(relationships.length).toBeGreaterThan(0);
    });
  });
});
