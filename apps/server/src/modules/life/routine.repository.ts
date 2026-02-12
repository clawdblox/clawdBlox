import { pool } from '../../config/database';
import { dynamicUpdate } from '../../utils/query-builder';
import type { Routine } from '@clawdblox/memoryweave-shared';

export const routineRepository = {
  async findAll(npcId: string): Promise<Routine[]> {
    const result = await pool.query(
      'SELECT * FROM routines WHERE npc_id = $1 ORDER BY priority DESC, start_hour',
      [npcId],
    );
    return result.rows;
  },

  async findById(id: string, npcId: string): Promise<Routine | null> {
    const result = await pool.query(
      'SELECT * FROM routines WHERE id = $1 AND npc_id = $2',
      [id, npcId],
    );
    return result.rows[0] || null;
  },

  async findCurrent(npcId: string, hour: number, dayOfWeek: number): Promise<Routine | null> {
    const result = await pool.query(
      `SELECT * FROM routines
       WHERE npc_id = $1 AND start_hour <= $2 AND end_hour > $2
         AND $3 = ANY(day_of_week)
       ORDER BY priority DESC
       LIMIT 1`,
      [npcId, hour, dayOfWeek],
    );
    return result.rows[0] || null;
  },

  async create(npcId: string, data: {
    name: string;
    start_hour: number;
    end_hour: number;
    day_of_week: number[];
    location: string;
    activity: string;
    interruptible?: boolean;
    priority?: number;
  }): Promise<Routine> {
    const result = await pool.query(
      `INSERT INTO routines (npc_id, name, start_hour, end_hour, day_of_week, location, activity, interruptible, priority)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [npcId, data.name, data.start_hour, data.end_hour, data.day_of_week, data.location, data.activity, data.interruptible ?? true, data.priority ?? 5],
    );
    return result.rows[0];
  },

  async update(id: string, npcId: string, data: Partial<{
    name: string;
    start_hour: number;
    end_hour: number;
    day_of_week: number[];
    location: string;
    activity: string;
    interruptible: boolean;
    priority: number;
  }>): Promise<Routine | null> {
    const updated = await dynamicUpdate<Routine>({
      table: 'routines',
      data,
      where: { id, npc_id: npcId },
    });
    return updated ?? this.findById(id, npcId);
  },

  async delete(id: string, npcId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM routines WHERE id = $1 AND npc_id = $2',
      [id, npcId],
    );
    return (result.rowCount ?? 0) > 0;
  },
};
