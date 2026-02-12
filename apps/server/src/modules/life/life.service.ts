import { routineRepository } from './routine.repository';
import { goalRepository } from './goal.repository';
import { relationshipRepository } from './relationship.repository';
import { NotFoundError } from '../../utils/errors';
import type { Routine, Goal, Relationship, CreateRelationshipInput } from '@clawdblox/memoryweave-shared';

export const lifeService = {
  async listRoutines(npcId: string): Promise<Routine[]> {
    return routineRepository.findAll(npcId);
  },

  async getRoutine(id: string, npcId: string): Promise<Routine> {
    const routine = await routineRepository.findById(id, npcId);
    if (!routine) throw new NotFoundError('Routine', id);
    return routine;
  },

  async createRoutine(npcId: string, data: {
    name: string;
    start_hour: number;
    end_hour: number;
    day_of_week: number[];
    location: string;
    activity: string;
    interruptible?: boolean;
    priority?: number;
  }): Promise<Routine> {
    return routineRepository.create(npcId, data);
  },

  async updateRoutine(id: string, npcId: string, data: Record<string, unknown>): Promise<Routine> {
    const routine = await routineRepository.update(id, npcId, data);
    if (!routine) throw new NotFoundError('Routine', id);
    return routine;
  },

  async deleteRoutine(id: string, npcId: string): Promise<void> {
    const deleted = await routineRepository.delete(id, npcId);
    if (!deleted) throw new NotFoundError('Routine', id);
  },

  async listGoals(npcId: string): Promise<Goal[]> {
    return goalRepository.findAll(npcId);
  },

  async getGoal(id: string, npcId: string): Promise<Goal> {
    const goal = await goalRepository.findById(id, npcId);
    if (!goal) throw new NotFoundError('Goal', id);
    return goal;
  },

  async createGoal(npcId: string, data: {
    title: string;
    goal_type: string;
    priority?: number;
    success_criteria: string[];
    parent_goal_id?: string;
  }): Promise<Goal> {
    return goalRepository.create(npcId, data);
  },

  async updateGoal(id: string, npcId: string, data: Record<string, unknown>): Promise<Goal> {
    const goal = await goalRepository.update(id, npcId, data);
    if (!goal) throw new NotFoundError('Goal', id);
    return goal;
  },

  async deleteGoal(id: string, npcId: string): Promise<void> {
    const deleted = await goalRepository.delete(id, npcId);
    if (!deleted) throw new NotFoundError('Goal', id);
  },

  async listRelationships(npcId: string): Promise<Relationship[]> {
    return relationshipRepository.findAll(npcId);
  },

  async getRelationshipById(id: string, npcId: string): Promise<Relationship> {
    const rel = await relationshipRepository.findById(id, npcId);
    if (!rel) throw new NotFoundError('Relationship', id);
    return rel;
  },

  async getRelationship(npcId: string, targetType: string, targetId: string): Promise<Relationship | null> {
    return relationshipRepository.findByTarget(npcId, targetType, targetId);
  },

  async createRelationship(npcId: string, data: CreateRelationshipInput): Promise<Relationship> {
    return relationshipRepository.create(npcId, data);
  },

  async updateRelationship(id: string, npcId: string, data: Record<string, unknown>): Promise<Relationship> {
    const rel = await relationshipRepository.update(id, npcId, data);
    if (!rel) throw new NotFoundError('Relationship', id);
    return rel;
  },

  async deleteRelationship(id: string, npcId: string): Promise<void> {
    const deleted = await relationshipRepository.delete(id, npcId);
    if (!deleted) throw new NotFoundError('Relationship', id);
  },

  async incrementFamiliarity(npcId: string, targetType: string, targetId: string): Promise<void> {
    await relationshipRepository.incrementFamiliarity(npcId, targetType, targetId);
  },

  async getContextForConversation(npcId: string): Promise<{
    currentRoutine?: string;
    activeGoals: string[];
  }> {
    const now = new Date();
    const [routine, goals] = await Promise.all([
      routineRepository.findCurrent(npcId, now.getHours(), now.getDay()),
      goalRepository.findActive(npcId),
    ]);

    return {
      currentRoutine: routine
        ? `${routine.name} at ${routine.location} (${routine.activity})`
        : undefined,
      activeGoals: goals.map(g => `${g.title} (${g.progress}% complete)`),
    };
  },
};
