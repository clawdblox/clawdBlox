import { Router } from 'express';
import { conversationService } from './conversation.service';
import { conversationRepository } from './conversation.repository';
import { apiKeyMiddleware } from '../../middleware/apiKey.middleware';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import { playerAuthMiddleware } from '../../middleware/playerAuth.middleware';
import { sanitizeMiddleware } from '../../middleware/sanitize.middleware';
import { chatMessageSchema, botChatMessageSchema, paginationQuery } from '@clawdblox/memoryweave-shared';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { npcRepository } from '../npc/npc.repository';

export const conversationController = Router();

conversationController.get(
  '/npcs/:npcId/conversations',
  apiKeyMiddleware,
  apiRateLimit,
  async (req, res, next) => {
    try {
      const query = paginationQuery.safeParse(req.query);
      if (!query.success) throw new ValidationError('Invalid query', query.error.format());

      const npc = await npcRepository.findById(req.params.npcId, req.projectId!);
      if (!npc) throw new NotFoundError('NPC', req.params.npcId);

      const result = await conversationRepository.findByNpcId(req.params.npcId, query.data.page, query.data.limit);
      res.json({
        conversations: result.conversations,
        pagination: {
          page: query.data.page,
          limit: query.data.limit,
          total: result.total,
          pages: Math.ceil(result.total / query.data.limit),
        },
      });
    } catch (err) { next(err); }
  },
);

conversationController.get(
  '/conversations/:id/messages',
  apiKeyMiddleware,
  apiRateLimit,
  async (req, res, next) => {
    try {
      const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 50, 1), 200);

      const conversation = await conversationRepository.findById(req.params.id);
      if (!conversation) throw new NotFoundError('Conversation', req.params.id);

      const npc = await npcRepository.findById(conversation.npc_id, req.projectId!);
      if (!npc) throw new NotFoundError('NPC', conversation.npc_id);

      const messages = await conversationRepository.getMessages(req.params.id, limit);
      res.json({ messages });
    } catch (err) { next(err); }
  },
);

conversationController.post(
  '/npcs/:id/chat',
  apiKeyMiddleware,
  apiRateLimit,
  sanitizeMiddleware,
  playerAuthMiddleware,
  async (req, res, next) => {
    try {
      const body = chatMessageSchema.safeParse(req.body);
      if (!body.success) throw new ValidationError('Invalid input', body.error.format());

      const result = await conversationService.chat(
        req.params.id,
        req.project!,
        body.data.player_id,
        body.data.message,
      );

      res.json(result);
    } catch (err) { next(err); }
  },
);

conversationController.post(
  '/npcs/:id/chat/bot',
  apiKeyMiddleware,
  apiRateLimit,
  sanitizeMiddleware,
  async (req, res, next) => {
    try {
      const body = botChatMessageSchema.safeParse(req.body);
      if (!body.success) throw new ValidationError('Invalid input', body.error.format());

      const playerId = `${body.data.platform}:${body.data.platform_user_id}`;
      const result = await conversationService.chat(
        req.params.id,
        req.project!,
        playerId,
        body.data.message,
      );

      res.json(result);
    } catch (err) { next(err); }
  },
);
