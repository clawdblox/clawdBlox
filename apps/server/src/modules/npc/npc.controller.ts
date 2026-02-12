import { Router } from 'express';
import { npcService } from './npc.service';
import { apiKeyMiddleware } from '../../middleware/apiKey.middleware';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import { createNpcSchema, updateNpcSchema, generateNpcSchema, paginationQuery } from '@clawdblox/memoryweave-shared';
import { ValidationError } from '../../utils/errors';

export const npcController = Router();

npcController.use('/npcs', apiKeyMiddleware, apiRateLimit);

npcController.get('/npcs', async (req, res, next) => {
  try {
    const query = paginationQuery.safeParse(req.query);
    if (!query.success) throw new ValidationError('Invalid query', query.error.format());

    const { page, limit } = query.data;
    const result = await npcService.list(req.projectId!, page, limit);

    res.json({
      npcs: result.npcs,
      pagination: { page, limit, total: result.total, pages: Math.ceil(result.total / limit) },
    });
  } catch (err) { next(err); }
});

npcController.post('/npcs', async (req, res, next) => {
  try {
    const body = createNpcSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const npc = await npcService.create(req.projectId!, body.data);
    res.status(201).json({ npc });
  } catch (err) { next(err); }
});

npcController.post('/npcs/generate', async (req, res, next) => {
  try {
    const body = generateNpcSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const npc = await npcService.generate(req.projectId!, body.data);
    res.status(201).json({ npc });
  } catch (err) { next(err); }
});

npcController.get('/npcs/:id', async (req, res, next) => {
  try {
    const npc = await npcService.getById(req.params.id, req.projectId!);
    res.json({ npc });
  } catch (err) { next(err); }
});

npcController.put('/npcs/:id', async (req, res, next) => {
  try {
    const body = updateNpcSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const npc = await npcService.update(req.params.id, req.projectId!, body.data);
    res.json({ npc });
  } catch (err) { next(err); }
});

npcController.delete('/npcs/:id', async (req, res, next) => {
  try {
    await npcService.delete(req.params.id, req.projectId!);
    res.status(204).send();
  } catch (err) { next(err); }
});
