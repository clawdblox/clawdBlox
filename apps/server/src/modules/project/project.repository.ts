import { pool } from '../../config/database';
import type { Project } from '@clawdblox/memoryweave-shared';

const ALLOWED_COLUMNS = new Set(['name', 'api_key_hash', 'api_key_prefix', 'previous_api_key_hash', 'key_rotation_expires_at', 'groq_key_encrypted', 'api_key_encrypted', 'player_signing_secret', 'settings']);

export const projectRepository = {
  async findById(id: string): Promise<Project | null> {
    const result = await pool.query('SELECT * FROM projects WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByApiKeyPrefix(prefix: string): Promise<Project | null> {
    const result = await pool.query('SELECT * FROM projects WHERE api_key_prefix = $1', [prefix]);
    return result.rows[0] || null;
  },

  async create(data: {
    name: string;
    api_key_hash: string;
    api_key_prefix: string;
    player_signing_secret: string;
    groq_key_encrypted?: string;
    api_key_encrypted?: string;
    settings?: Record<string, unknown>;
  }): Promise<Project> {
    const result = await pool.query(
      `INSERT INTO projects (name, api_key_hash, api_key_prefix, player_signing_secret, groq_key_encrypted, api_key_encrypted, settings)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [data.name, data.api_key_hash, data.api_key_prefix, data.player_signing_secret, data.groq_key_encrypted || null, data.api_key_encrypted || null, JSON.stringify(data.settings || {})],
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<{
    name: string;
    api_key_hash: string;
    api_key_prefix: string;
    previous_api_key_hash: string | null;
    key_rotation_expires_at: Date | null;
    groq_key_encrypted: string | null;
    api_key_encrypted: string | null;
    player_signing_secret: string;
    settings: Record<string, unknown>;
  }>): Promise<Project | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        if (!ALLOWED_COLUMNS.has(key)) throw new Error(`Invalid column: ${key}`);
        fields.push(`${key} = $${idx}`);
        values.push(key === 'settings' ? JSON.stringify(value) : value);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push('updated_at = NOW()');
    values.push(id);

    const result = await pool.query(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM projects WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },
};
