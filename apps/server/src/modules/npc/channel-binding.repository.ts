import { pool } from '../../config/database';

export interface ChannelBinding {
  id: string;
  project_id: string;
  npc_id: string;
  platform: string;
  platform_channel_id: string;
  created_at: Date;
}

export const channelBindingRepository = {
  async bind(projectId: string, npcId: string, platform: string, platformChannelId: string): Promise<ChannelBinding> {
    const result = await pool.query(
      `INSERT INTO channel_bindings (project_id, npc_id, platform, platform_channel_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (project_id, platform, platform_channel_id)
       DO UPDATE SET npc_id = EXCLUDED.npc_id
       RETURNING *`,
      [projectId, npcId, platform, platformChannelId],
    );
    return result.rows[0];
  },

  async unbind(projectId: string, platform: string, platformChannelId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM channel_bindings WHERE project_id = $1 AND platform = $2 AND platform_channel_id = $3',
      [projectId, platform, platformChannelId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async findByChannel(platform: string, platformChannelId: string, projectId: string): Promise<ChannelBinding | null> {
    const result = await pool.query(
      'SELECT * FROM channel_bindings WHERE platform = $1 AND platform_channel_id = $2 AND project_id = $3',
      [platform, platformChannelId, projectId],
    );
    return result.rows[0] || null;
  },

  async findByProject(projectId: string): Promise<ChannelBinding[]> {
    const result = await pool.query(
      'SELECT * FROM channel_bindings WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId],
    );
    return result.rows;
  },

};
