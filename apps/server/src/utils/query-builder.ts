import { pool } from '../config/database';

const ALLOWED_TABLES = new Set(['memories', 'routines', 'goals', 'relationships']);

const ALLOWED_COLUMNS: Record<string, Set<string>> = {
  memories: new Set(['importance', 'vividness', 'content', 'metadata']),
  routines: new Set(['name', 'start_hour', 'end_hour', 'day_of_week', 'location', 'activity', 'interruptible', 'priority']),
  relationships: new Set(['affinity', 'trust', 'familiarity']),
  goals: new Set(['title', 'priority', 'progress', 'status', 'success_criteria']),
};

interface DynamicUpdateOptions {
  table: string;
  data: Record<string, unknown>;
  where: { id: string; npc_id: string };
  returning?: string;
  castMap?: Record<string, string>;
  serializeJson?: string[];
}

/**
 * Builds and executes a dynamic UPDATE query from a partial data object.
 * Returns the updated row or null if not found.
 */
export async function dynamicUpdate<T>(options: DynamicUpdateOptions): Promise<T | null> {
  const { table, data, where, returning = '*', castMap = {}, serializeJson = [] } = options;

  if (!ALLOWED_TABLES.has(table)) {
    throw new Error(`dynamicUpdate: table "${table}" is not in the allowed tables list`);
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  const allowedCols = ALLOWED_COLUMNS[table];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
    if (!allowedCols?.has(key)) {
      throw new Error(`dynamicUpdate: column "${key}" is not allowed for table "${table}"`);
    }
    const cast = castMap[key] ? `::${castMap[key]}` : '';
    fields.push(`${key} = $${idx}${cast}`);
    values.push(serializeJson.includes(key) ? JSON.stringify(value) : value);
    idx++;
  }

  if (fields.length === 0) return null;

  fields.push('updated_at = NOW()');
  values.push(where.id, where.npc_id);

  const result = await pool.query(
    `UPDATE ${table} SET ${fields.join(', ')} WHERE id = $${idx} AND npc_id = $${idx + 1} RETURNING ${returning}`,
    values,
  );
  return result.rows[0] || null;
}
