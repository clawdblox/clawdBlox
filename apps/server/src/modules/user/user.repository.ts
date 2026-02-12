import { pool } from '../../config/database';
import type { User } from '@clawdblox/memoryweave-shared';

export const userRepository = {
  async findByEmail(email: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByProjectId(projectId: string): Promise<User[]> {
    const result = await pool.query(
      'SELECT * FROM users WHERE project_id = $1 ORDER BY created_at',
      [projectId],
    );
    return result.rows;
  },

  async create(data: {
    email: string;
    password_hash: string;
    display_name: string;
    role: string;
    project_id: string;
  }): Promise<User> {
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, project_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.email, data.password_hash, data.display_name, data.role, data.project_id],
    );
    return result.rows[0];
  },

  async update(id: string, data: Partial<{
    email: string;
    password_hash: string;
    display_name: string;
    role: string;
    is_active: boolean;
    last_login_at: Date;
  }>): Promise<User | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values,
    );
    return result.rows[0] || null;
  },

  async delete(id: string): Promise<boolean> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  },

  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) FROM users');
    return parseInt(result.rows[0].count, 10);
  },
};
