import { pool } from '../../config/database';

export interface ChannelBinding {
  id: string;
  project_id: string;
  npc_id: string;
  platform: string;
  platform_channel_id: string;
  created_at: Date;
}

export interface ChannelBindingWithNpc extends ChannelBinding {
  npc_name: string;
}

export const channelBindingRepository = {
  async bind(projectId: string, npcId: string, platform: string, platformChannelId: string): Promise<ChannelBinding> {
    const result = await pool.query(
      `INSERT INTO channel_bindings (project_id, npc_id, platform, platform_channel_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, platform, platform_channel_id, npc_id)
       DO NOTHING
       RETURNING *`,
      [projectId, npcId, platform, platformChannelId],
    );
    // If DO NOTHING triggered, fetch the existing row
    if (result.rows.length === 0) {
      const existing = await pool.query(
        'SELECT * FROM channel_bindings WHERE project_id = $1 AND npc_id = $2 AND platform = $3 AND platform_channel_id = $4',
        [projectId, npcId, platform, platformChannelId],
      );
      return existing.rows[0];
    }
    return result.rows[0];
  },

  async unbind(projectId: string, platform: string, platformChannelId: string, npcId?: string): Promise<boolean> {
    if (npcId) {
      const result = await pool.query(
        'DELETE FROM channel_bindings WHERE project_id = $1 AND platform = $2 AND platform_channel_id = $3 AND npc_id = $4',
        [projectId, platform, platformChannelId, npcId],
      );
      return (result.rowCount ?? 0) > 0;
    }
    const result = await pool.query(
      'DELETE FROM channel_bindings WHERE project_id = $1 AND platform = $2 AND platform_channel_id = $3',
      [projectId, platform, platformChannelId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async findByChannel(platform: string, platformChannelId: string, projectId: string): Promise<ChannelBinding | null> {
    const result = await pool.query(
      'SELECT * FROM channel_bindings WHERE platform = $1 AND platform_channel_id = $2 AND project_id = $3 LIMIT 1',
      [platform, platformChannelId, projectId],
    );
    return result.rows[0] || null;
  },

  async findAllByChannel(projectId: string, platform: string, platformChannelId: string): Promise<ChannelBindingWithNpc[]> {
    const result = await pool.query(
      `SELECT cb.*, n.name AS npc_name
       FROM channel_bindings cb
       JOIN npcs n ON n.id = cb.npc_id
       WHERE cb.project_id = $1 AND cb.platform = $2 AND cb.platform_channel_id = $3
       ORDER BY cb.created_at ASC`,
      [projectId, platform, platformChannelId],
    );
    return result.rows;
  },

  async findByProject(projectId: string): Promise<ChannelBinding[]> {
    const result = await pool.query(
      'SELECT * FROM channel_bindings WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId],
    );
    return result.rows;
  },

};
