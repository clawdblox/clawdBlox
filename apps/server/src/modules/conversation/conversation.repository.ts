import { pool } from '../../config/database';
import type { Conversation, Message } from '@clawdblox/memoryweave-shared';

export const conversationRepository = {
  async findActive(npcId: string, playerId: string): Promise<Conversation | null> {
    const result = await pool.query(
      `SELECT * FROM conversations WHERE npc_id = $1 AND player_id = $2 AND status = 'active'`,
      [npcId, playerId],
    );
    return result.rows[0] || null;
  },

  async findById(id: string, projectId?: string): Promise<Conversation | null> {
    if (projectId) {
      const result = await pool.query(
        'SELECT c.* FROM conversations c JOIN npcs n ON c.npc_id = n.id WHERE c.id = $1 AND n.project_id = $2',
        [id, projectId],
      );
      return result.rows[0] || null;
    }
    const result = await pool.query('SELECT * FROM conversations WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async findByNpcId(npcId: string, page: number, limit: number): Promise<{ conversations: Conversation[]; total: number }> {
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        'SELECT * FROM conversations WHERE npc_id = $1 ORDER BY updated_at DESC LIMIT $2 OFFSET $3',
        [npcId, limit, offset],
      ),
      pool.query('SELECT COUNT(*) FROM conversations WHERE npc_id = $1', [npcId]),
    ]);
    return {
      conversations: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  async create(npcId: string, playerId: string): Promise<Conversation> {
    const result = await pool.query(
      `INSERT INTO conversations (npc_id, player_id, status)
       VALUES ($1, $2, 'active')
       ON CONFLICT (npc_id, player_id) WHERE status = 'active'
       DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [npcId, playerId],
    );
    return result.rows[0];
  },

  async addMessage(conversationId: string, role: string, content: string, metadata?: Record<string, unknown>): Promise<Message> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const msgResult = await client.query(
        `INSERT INTO messages (conversation_id, role, content, metadata)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [conversationId, role, content, JSON.stringify(metadata || {})],
      );

      await client.query(
        'UPDATE conversations SET message_count = message_count + 1, updated_at = NOW() WHERE id = $1',
        [conversationId],
      );

      await client.query('COMMIT');
      return msgResult.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async getMessages(conversationId: string, limit = 50): Promise<Message[]> {
    const result = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT $2',
      [conversationId, limit],
    );
    return result.rows;
  },

  async endConversation(id: string, summary?: string): Promise<Conversation | null> {
    const result = await pool.query(
      `UPDATE conversations SET status = 'ended', summary = $2, updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id, summary || null],
    );
    return result.rows[0] || null;
  },
};
