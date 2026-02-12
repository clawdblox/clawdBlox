import { pool } from '../config/database';

const ALLOWED_TABLES = new Set(['memories', 'routines', 'goals', 'relationships']);

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

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined) continue;
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
