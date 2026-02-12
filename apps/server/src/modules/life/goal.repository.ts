import { pool } from '../../config/database';
import { dynamicUpdate } from '../../utils/query-builder';
import type { Goal } from '@clawdblox/memoryweave-shared';

export const goalRepository = {
  async findAll(npcId: string): Promise<Goal[]> {
    const result = await pool.query(
      'SELECT * FROM goals WHERE npc_id = $1 ORDER BY priority DESC, created_at',
      [npcId],
    );
    return result.rows;
  },

  async findActive(npcId: string): Promise<Goal[]> {
    const result = await pool.query(
      `SELECT * FROM goals WHERE npc_id = $1 AND status = 'active' ORDER BY priority DESC`,
      [npcId],
    );
    return result.rows;
  },

  async findById(id: string, npcId: string): Promise<Goal | null> {
    const result = await pool.query(
      'SELECT * FROM goals WHERE id = $1 AND npc_id = $2',
      [id, npcId],
    );
    return result.rows[0] || null;
  },

  async findSubGoals(parentId: string): Promise<Goal[]> {
    const result = await pool.query(
      'SELECT * FROM goals WHERE parent_goal_id = $1 ORDER BY priority DESC',
      [parentId],
    );
    return result.rows;
  },

  async create(npcId: string, data: {
    title: string;
    goal_type: string;
    priority?: number;
    success_criteria: string[];
    parent_goal_id?: string;
  }): Promise<Goal> {
    const result = await pool.query(
      `INSERT INTO goals (npc_id, title, goal_type, priority, success_criteria, parent_goal_id)
       VALUES ($1, $2, $3::goal_type, $4, $5, $6) RETURNING *`,
      [npcId, data.title, data.goal_type, data.priority ?? 5, data.success_criteria, data.parent_goal_id || null],
    );
    return result.rows[0];
  },

  async update(id: string, npcId: string, data: Partial<{
    title: string;
    priority: number;
    progress: number;
    status: string;
    success_criteria: string[];
  }>): Promise<Goal | null> {
    const updated = await dynamicUpdate<Goal>({
      table: 'goals',
      data,
      where: { id, npc_id: npcId },
      castMap: { status: 'goal_status' },
    });
    return updated ?? this.findById(id, npcId);
  },

  async delete(id: string, npcId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND npc_id = $2',
      [id, npcId],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
