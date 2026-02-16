import crypto from 'node:crypto';
import { pool } from '../../config/database';
import { ConflictError } from '../../utils/errors';

const LINK_CODE_TTL_MS = 5 * 60 * 1000;

export const playerRepository = {
  async findCanonicalId(projectId: string, platform: string, platformUserId: string): Promise<string | null> {
    const result = await pool.query(
      'SELECT player_id FROM player_links WHERE project_id = $1 AND platform = $2 AND platform_user_id = $3',
      [projectId, platform, platformUserId],
    );
    return result.rows[0]?.player_id || null;
  },

  async findByPlatform(projectId: string, platform: string, platformUserId: string) {
    const result = await pool.query(
      'SELECT * FROM player_links WHERE project_id = $1 AND platform = $2 AND platform_user_id = $3',
      [projectId, platform, platformUserId],
    );
    return result.rows[0] || null;
  },

  async createLink(projectId: string, playerId: string, platform: string, platformUserId: string) {
    const result = await pool.query(
      'INSERT INTO player_links (project_id, player_id, platform, platform_user_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [projectId, playerId, platform, platformUserId],
    );
    return result.rows[0];
  },

  async removeLink(projectId: string, platform: string, platformUserId: string): Promise<boolean> {
    const result = await pool.query(
      'DELETE FROM player_links WHERE project_id = $1 AND platform = $2 AND platform_user_id = $3',
      [projectId, platform, platformUserId],
    );
    return (result.rowCount ?? 0) > 0;
  },

  async listLinks(projectId: string, playerId: string) {
    const result = await pool.query(
      'SELECT * FROM player_links WHERE project_id = $1 AND player_id = $2 ORDER BY linked_at',
      [projectId, playerId],
    );
    return result.rows;
  },

  async createLinkCode(projectId: string, platform: string, platformUserId: string) {
    // Opportunistic cleanup (~10% of calls)
    if (Math.random() < 0.1) {
      pool.query('DELETE FROM link_codes WHERE expires_at < NOW() OR used = true').catch(() => {});
    }

    const code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS);
    const result = await pool.query(
      'INSERT INTO link_codes (project_id, code, platform, platform_user_id, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING code, expires_at',
      [projectId, code, platform, platformUserId, expiresAt],
    );
    return result.rows[0];
  },

  async claimCode(code: string) {
    const result = await pool.query(
      `UPDATE link_codes SET used = true
       WHERE code = $1 AND used = false AND expires_at > NOW()
       RETURNING *`,
      [code],
    );
    return result.rows[0] || null;
  },

  async createIdentity(projectId: string, displayName?: string) {
    const result = await pool.query(
      'INSERT INTO player_identities (project_id, display_name) VALUES ($1, $2) RETURNING *',
      [projectId, displayName || null],
    );
    return result.rows[0];
  },

  async findIdentity(playerId: string, projectId?: string) {
    if (projectId) {
      const result = await pool.query(
        'SELECT * FROM player_identities WHERE id = $1 AND project_id = $2',
        [playerId, projectId],
      );
      return result.rows[0] || null;
    }
    const result = await pool.query('SELECT * FROM player_identities WHERE id = $1', [playerId]);
    return result.rows[0] || null;
  },

  async deleteIdentity(playerId: string): Promise<void> {
    await pool.query('DELETE FROM player_identities WHERE id = $1', [playerId]);
  },

  async migratePlayerId(oldId: string, newId: string, client: import('pg').PoolClient): Promise<void> {
    await client.query('UPDATE conversations SET player_id = $1 WHERE player_id = $2', [newId, oldId]);
    await client.query(
      "UPDATE relationships SET target_id = $1 WHERE target_id = $2 AND target_type = 'player'",
      [newId, oldId],
    );
  },

  async verifyAndLinkTransaction(
    projectId: string,
    code: string,
    platform: string,
    platformUserId: string,
  ): Promise<{ canonicalId: string; links: Array<{ platform: string; platform_user_id: string; linked_at: string }> } | null> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Claim code atomically (Bug #1)
      const linkCode = await client.query(
        `UPDATE link_codes SET used = true
         WHERE code = $1 AND used = false AND expires_at > NOW()
         RETURNING *`,
        [code],
      );
      const claimed = linkCode.rows[0];
      if (!claimed) {
        await client.query('ROLLBACK');
        return null;
      }

      // 2. Verify code belongs to this project (Bug #5)
      if (claimed.project_id !== projectId) {
        await client.query('ROLLBACK');
        return null;
      }

      // 3. Find origin/target links
      const originResult = await client.query(
        'SELECT * FROM player_links WHERE project_id = $1 AND platform = $2 AND platform_user_id = $3',
        [projectId, claimed.platform, claimed.platform_user_id],
      );
      const originLink = originResult.rows[0] || null;

      const targetResult = await client.query(
        'SELECT * FROM player_links WHERE project_id = $1 AND platform = $2 AND platform_user_id = $3',
        [projectId, platform, platformUserId],
      );
      const targetLink = targetResult.rows[0] || null;

      let canonicalId: string;

      if (originLink && targetLink) {
        if (originLink.player_id === targetLink.player_id) {
          await client.query('ROLLBACK');
          throw new ConflictError('These platforms are already linked to the same identity');
        }
        // Merge: migrate target into origin's identity
        canonicalId = originLink.player_id;
        await this.migratePlayerId(targetLink.player_id, canonicalId, client);
        // Re-link the target platform to the canonical identity
        await client.query(
          'DELETE FROM player_links WHERE project_id = $1 AND platform = $2 AND platform_user_id = $3',
          [projectId, platform, platformUserId],
        );
        await client.query(
          'INSERT INTO player_links (project_id, player_id, platform, platform_user_id) VALUES ($1, $2, $3, $4)',
          [projectId, canonicalId, platform, platformUserId],
        );
        // Delete orphaned identity after merge
        await client.query('DELETE FROM player_identities WHERE id = $1', [targetLink.player_id]);
      } else if (originLink) {
        canonicalId = originLink.player_id;
        await client.query(
          'INSERT INTO player_links (project_id, player_id, platform, platform_user_id) VALUES ($1, $2, $3, $4)',
          [projectId, canonicalId, platform, platformUserId],
        );
      } else if (targetLink) {
        canonicalId = targetLink.player_id;
        await client.query(
          'INSERT INTO player_links (project_id, player_id, platform, platform_user_id) VALUES ($1, $2, $3, $4)',
          [projectId, canonicalId, claimed.platform, claimed.platform_user_id],
        );
      } else {
        const identityResult = await client.query(
          'INSERT INTO player_identities (project_id) VALUES ($1) RETURNING *',
          [projectId],
        );
        canonicalId = identityResult.rows[0].id;
        await client.query(
          'INSERT INTO player_links (project_id, player_id, platform, platform_user_id) VALUES ($1, $2, $3, $4)',
          [projectId, canonicalId, claimed.platform, claimed.platform_user_id],
        );
        await client.query(
          'INSERT INTO player_links (project_id, player_id, platform, platform_user_id) VALUES ($1, $2, $3, $4)',
          [projectId, canonicalId, platform, platformUserId],
        );
      }

      // 4. List final links
      const linksResult = await client.query(
        'SELECT platform, platform_user_id, linked_at FROM player_links WHERE project_id = $1 AND player_id = $2 ORDER BY linked_at',
        [projectId, canonicalId],
      );

      await client.query('COMMIT');
      return { canonicalId, links: linksResult.rows };
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  },
};
