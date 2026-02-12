import { pool } from '../../config/database';
import { dynamicUpdate } from '../../utils/query-builder';
import type { Memory, MemorySearchResult, MemoryType, ImportanceLevel } from '@clawdblox/memoryweave-shared';

const MEMORY_COLUMNS = 'id, npc_id, type, importance, vividness, content, metadata, access_count, last_accessed_at, created_at, updated_at';

export const memoryRepository = {
  async findAll(npcId: string, page: number, limit: number): Promise<{ memories: Memory[]; total: number }> {
    const offset = (page - 1) * limit;
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT ${MEMORY_COLUMNS} FROM memories WHERE npc_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [npcId, limit, offset],
      ),
      pool.query('SELECT COUNT(*) FROM memories WHERE npc_id = $1', [npcId]),
    ]);
    return {
      memories: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  },

  async findById(id: string, npcId: string): Promise<Memory | null> {
    const result = await pool.query(
      `SELECT ${MEMORY_COLUMNS} FROM memories WHERE id = $1 AND npc_id = $2`,
      [id, npcId],
    );
    return result.rows[0] || null;
  },

  async recordAccess(id: string): Promise<void> {
    await pool.query(
      'UPDATE memories SET access_count = access_count + 1, last_accessed_at = NOW() WHERE id = $1',
      [id],
    );
  },

  async create(npcId: string, data: {
    type: MemoryType;
    importance: ImportanceLevel;
    content: string;
    embedding: number[];
    metadata?: Record<string, unknown>;
  }): Promise<Memory> {
    const result = await pool.query(
      `INSERT INTO memories (npc_id, type, importance, content, embedding, metadata)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING ${MEMORY_COLUMNS}`,
      [npcId, data.type, data.importance, data.content, `[${data.embedding.join(',')}]`, JSON.stringify(data.metadata || {})],
    );
    return result.rows[0];
  },

  async update(id: string, npcId: string, data: Partial<{
    importance: ImportanceLevel;
    vividness: number;
    content: string;
    metadata: Record<string, unknown>;
  }>): Promise<Memory | null> {
    const updated = await dynamicUpdate<Memory>({
      table: 'memories',
      data,
      where: { id, npc_id: npcId },
      returning: MEMORY_COLUMNS,
      serializeJson: ['metadata'],
    });
    return updated ?? this.findById(id, npcId);
  },

  async delete(id: string, npcId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM memories WHERE id = $1 AND npc_id = $2',
      [id, npcId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async searchSemantic(npcId: string, embedding: number[], options: {
    limit?: number;
    minVividness?: number;
    types?: MemoryType[];
    importanceLevels?: ImportanceLevel[];
  }): Promise<MemorySearchResult[]> {
    const conditions = ['npc_id = $1', 'embedding IS NOT NULL'];
    const values: unknown[] = [npcId];
    let idx = 2;

    if (options.minVividness !== undefined) {
      conditions.push(`vividness >= $${idx}`);
      values.push(options.minVividness);
      idx++;
    }

    if (options.types?.length) {
      conditions.push(`type = ANY($${idx}::memory_type[])`);
      values.push(options.types);
      idx++;
    }

    if (options.importanceLevels?.length) {
      conditions.push(`importance = ANY($${idx}::importance_level[])`);
      values.push(options.importanceLevels);
      idx++;
    }

    const vectorIdx = idx;
    values.push(`[${embedding.join(',')}]`);
    idx++;

    values.push(options.limit || 10);

    const result = await pool.query(
      `SELECT ${MEMORY_COLUMNS},
              (1 - (embedding <=> $${vectorIdx}::vector)) * CASE WHEN access_count > 0 THEN 1.3 ELSE 1.0 END AS similarity
       FROM memories
       WHERE ${conditions.join(' AND ')}
       ORDER BY similarity DESC
       LIMIT $${idx}`,
      values,
    );

    if (result.rows.length > 0) {
      const ids = result.rows.map(r => r.id);
      pool.query(
        'UPDATE memories SET access_count = access_count + 1, last_accessed_at = NOW() WHERE id = ANY($1::uuid[])',
        [ids],
      ).catch(err => console.error('Failed to batch update access_count:', err.message));
    }

    return result.rows;
  },

  async batchDecay(decayRates: Record<ImportanceLevel, number>): Promise<number> {
    let totalUpdated = 0;

    for (const [importance, rate] of Object.entries(decayRates)) {
      const result = await pool.query(
        `UPDATE memories SET
           vividness = GREATEST(0, vividness - $1),
           updated_at = NOW()
         WHERE importance = $2::importance_level AND vividness > 0`,
        [rate, importance],
      );
      totalUpdated += result.rowCount ?? 0;
    }

    return totalUpdated;
  },
};
