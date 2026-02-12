import { pool } from '../../config/database';
import { dynamicUpdate } from '../../utils/query-builder';
import type { Relationship, InteractionEntry } from '@clawdblox/memoryweave-shared';

const MAX_INTERACTION_HISTORY = 50;

export const relationshipRepository = {
  async findAll(npcId: string): Promise<Relationship[]> {
    const result = await pool.query(
      'SELECT * FROM relationships WHERE npc_id = $1 ORDER BY familiarity DESC',
      [npcId],
    );
    return result.rows;
  },

  async findById(id: string, npcId: string): Promise<Relationship | null> {
    const result = await pool.query(
      'SELECT * FROM relationships WHERE id = $1 AND npc_id = $2',
      [id, npcId],
    );
    return result.rows[0] || null;
  },

  async findByTarget(npcId: string, targetType: string, targetId: string): Promise<Relationship | null> {
    const result = await pool.query(
      'SELECT * FROM relationships WHERE npc_id = $1 AND target_type = $2 AND target_id = $3',
      [npcId, targetType, targetId],
    );
    return result.rows[0] || null;
  },

  async create(npcId: string, data: {
    target_type: string;
    target_id: string;
    affinity?: number;
    trust?: number;
  }): Promise<Relationship> {
    const result = await pool.query(
      `INSERT INTO relationships (npc_id, target_type, target_id, affinity, trust)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [npcId, data.target_type, data.target_id, data.affinity ?? 0, data.trust ?? 0.5],
    );
    return result.rows[0];
  },

  async update(id: string, npcId: string, data: Partial<{
    affinity: number;
    trust: number;
    familiarity: number;
  }>): Promise<Relationship | null> {
    const updated = await dynamicUpdate<Relationship>({
      table: 'relationships',
      data,
      where: { id, npc_id: npcId },
    });
    return updated ?? this.findById(id, npcId);
  },

  async incrementFamiliarity(npcId: string, targetType: string, targetId: string, increment = 0.02): Promise<void> {
    await pool.query(
      `UPDATE relationships
       SET familiarity = LEAST(1, familiarity + $4), updated_at = NOW()
       WHERE npc_id = $1 AND target_type = $2 AND target_id = $3`,
      [npcId, targetType, targetId, increment],
    );
  },

  async addInteraction(npcId: string, targetType: string, targetId: string, entry: InteractionEntry): Promise<void> {
    await pool.query(
      `UPDATE relationships
       SET interaction_history = (
         SELECT jsonb_agg(elem)
         FROM (
           SELECT elem FROM jsonb_array_elements(
             interaction_history || $4::jsonb
           ) AS elem
           ORDER BY elem->>'timestamp' DESC
           LIMIT $5
         ) sub
       ),
       updated_at = NOW()
       WHERE npc_id = $1 AND target_type = $2 AND target_id = $3`,
      [npcId, targetType, targetId, JSON.stringify(entry), MAX_INTERACTION_HISTORY],
    );
  },

  async delete(id: string, npcId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM relationships WHERE id = $1 AND npc_id = $2',
      [id, npcId],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
