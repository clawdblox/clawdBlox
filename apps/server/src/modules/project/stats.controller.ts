import { Router } from 'express';
import { pool } from '../../config/database';
import { apiKeyMiddleware } from '../../middleware/apiKey.middleware';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';

function toInt(value: string): number {
  return parseInt(value, 10);
}

function toFixed2(value: string): number {
  return Math.round(parseFloat(value) * 100) / 100;
}

export const statsController = Router();

statsController.get('/stats', apiKeyMiddleware, apiRateLimit, async (req, res, next) => {
  try {
    const projectId = req.projectId!;
    const projectFilter = 'npc_id IN (SELECT id FROM npcs WHERE project_id = $1)';

    const [npcs, conversations, memories, relationships] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM npcs WHERE project_id = $1', [projectId]),
      pool.query(
        `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active
         FROM conversations WHERE ${projectFilter}`,
        [projectId],
      ),
      pool.query(
        `SELECT COUNT(*) AS total, COALESCE(AVG(vividness), 0) AS avg_vividness
         FROM memories WHERE ${projectFilter}`,
        [projectId],
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                COALESCE(AVG(affinity), 0) AS avg_affinity,
                COALESCE(AVG(trust), 0) AS avg_trust,
                COALESCE(AVG(familiarity), 0) AS avg_familiarity
         FROM relationships WHERE ${projectFilter}`,
        [projectId],
      ),
    ]);

    const npc = npcs.rows[0];
    const conv = conversations.rows[0];
    const mem = memories.rows[0];
    const rel = relationships.rows[0];

    res.json({
      npcs: { total: toInt(npc.count) },
      conversations: { total: toInt(conv.total), active: toInt(conv.active) },
      memories: { total: toInt(mem.total), avg_vividness: toFixed2(mem.avg_vividness) },
      relationships: {
        total: toInt(rel.total),
        avg_affinity: toFixed2(rel.avg_affinity),
        avg_trust: toFixed2(rel.avg_trust),
        avg_familiarity: toFixed2(rel.avg_familiarity),
      },
    });
  } catch (err) { next(err); }
});
