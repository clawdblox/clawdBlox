import { playerRepository } from './player.repository';
import { NotFoundError } from '../../utils/errors';

const LINK_CODE_TTL_SECONDS = 300;

export const playerService = {
  async requestCode(projectId: string, platform: string, platformUserId: string) {
    const { code } = await playerRepository.createLinkCode(projectId, platform, platformUserId);
    return { code, expires_in: LINK_CODE_TTL_SECONDS };
  },

  async verifyAndLink(projectId: string, code: string, platform: string, platformUserId: string) {
    const result = await playerRepository.verifyAndLinkTransaction(projectId, code, platform, platformUserId);
    if (!result) throw new NotFoundError('Link code');

    return {
      player_id: result.canonicalId,
      linked_platforms: result.links.map((l) => l.platform),
    };
  },

  async resolve(projectId: string, platform: string, platformUserId: string) {
    const link = await playerRepository.findByPlatform(projectId, platform, platformUserId);
    if (!link) throw new NotFoundError('Player link');

    const identity = await playerRepository.findIdentity(link.player_id, projectId);
    if (!identity) throw new NotFoundError('Player identity', link.player_id);

    const links = await playerRepository.listLinks(projectId, link.player_id);
    return {
      player_id: identity.id,
      display_name: identity.display_name,
      links: links.map((l) => ({
        platform: l.platform,
        platform_user_id: l.platform_user_id,
        linked_at: l.linked_at,
      })),
    };
  },

  async listLinks(projectId: string, playerId: string) {
    const identity = await playerRepository.findIdentity(playerId, projectId);
    if (!identity) throw new NotFoundError('Player identity', playerId);

    const links = await playerRepository.listLinks(projectId, playerId);
    return { links };
  },

  async unlink(projectId: string, platform: string, platformUserId: string) {
    const link = await playerRepository.findByPlatform(projectId, platform, platformUserId);
    if (!link) throw new NotFoundError('Player link');

    await playerRepository.removeLink(projectId, platform, platformUserId);

    // Cleanup orphaned identity (Bug #6)
    const remaining = await playerRepository.listLinks(projectId, link.player_id);
    if (remaining.length === 0) {
      await playerRepository.deleteIdentity(link.player_id);
    }
  },
};
