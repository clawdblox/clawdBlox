import { pool } from '../../config/database';
import type { NPC, OceanPersonality } from '@clawdblox/memoryweave-shared';

const JSON_FIELDS = new Set(['personality', 'speaking_style']);

export const npcRepository = {
  async findAll(projectId: string, page: number, limit: number): Promise<{ npcs: NPC[]; total: number }> {
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        'SELECT * FROM npcs WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [projectId, limit, offset],
      ),
      pool.query('SELECT COUNT(*) FROM npcs WHERE project_id = $1', [projectId]),
    ]);
    return {
      npcs: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  async findById(id: string, projectId: string): Promise<NPC | null> {
    const result = await pool.query(
      'SELECT * FROM npcs WHERE id = $1 AND project_id = $2',
      [id, projectId],
    );
    return result.rows[0] || null;
  },

  async create(projectId: string, data: {
    name: string;
    personality: OceanPersonality;
    speaking_style: Record<string, unknown>;
    backstory: string;
    system_prompt?: string;
    mood?: string;
  }): Promise<NPC> {
    const result = await pool.query(
      `INSERT INTO npcs (project_id, name, personality, speaking_style, backstory, system_prompt, mood)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        projectId,
        data.name,
        JSON.stringify(data.personality),
        JSON.stringify(data.speaking_style),
        data.backstory,
        data.system_prompt || '',
        data.mood || 'neutral',
      ],
    );
    return result.rows[0];
  },

  async update(id: string, projectId: string, data: Partial<{
    name: string;
    personality: OceanPersonality;
    speaking_style: Record<string, unknown>;
    backstory: string;
    system_prompt: string;
    mood: string;
    is_active: boolean;
  }>): Promise<NPC | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(JSON_FIELDS.has(key) ? JSON.stringify(value) : value);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id, projectId);

    fields.push('updated_at = NOW()');
    values.push(id, projectId);

    const result = await pool.query(
      `UPDATE npcs SET ${fields.join(', ')} WHERE id = $${idx} AND project_id = $${idx + 1} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  async delete(id: string, projectId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM npcs WHERE id = $1 AND project_id = $2',
      [id, projectId],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
