import { Router } from 'express';
import { memoryService } from './memory.service';
import { apiKeyMiddleware } from '../../middleware/apiKey.middleware';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import { createMemorySchema, updateMemorySchema, searchMemorySchema, paginationQuery } from '@clawdblox/memoryweave-shared';
import { ValidationError } from '../../utils/errors';

export const memoryController = Router();

memoryController.use('/npcs/:npcId/memories', apiKeyMiddleware, apiRateLimit);

memoryController.get('/npcs/:npcId/memories', async (req, res, next) => {
  try {
    const query = paginationQuery.safeParse(req.query);
    if (!query.success) throw new ValidationError('Invalid query', query.error.format());

    const result = await memoryService.list(req.params.npcId, query.data.page, query.data.limit);
    res.json({
      memories: result.memories,
      pagination: {
        page: query.data.page,
        limit: query.data.limit,
        total: result.total,
        pages: Math.ceil(result.total / query.data.limit),
      },
    });
  } catch (err) { next(err); }
});

memoryController.post('/npcs/:npcId/memories', async (req, res, next) => {
  try {
    const body = createMemorySchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const memory = await memoryService.create(req.params.npcId, req.projectId!, body.data);
    res.status(201).json({ memory });
  } catch (err) { next(err); }
});

memoryController.post('/npcs/:npcId/memories/search', async (req, res, next) => {
  try {
    const body = searchMemorySchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const memories = await memoryService.search(req.params.npcId, req.projectId!, body.data);
    res.json({ memories });
  } catch (err) { next(err); }
});

memoryController.get('/npcs/:npcId/memories/:id', async (req, res, next) => {
  try {
    const memory = await memoryService.getById(req.params.id, req.params.npcId);
    res.json({ memory });
  } catch (err) { next(err); }
});

memoryController.put('/npcs/:npcId/memories/:id', async (req, res, next) => {
  try {
    const body = updateMemorySchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const memory = await memoryService.update(req.params.id, req.params.npcId, body.data);
    res.json({ memory });
  } catch (err) { next(err); }
});

memoryController.delete('/npcs/:npcId/memories/:id', async (req, res, next) => {
  try {
    await memoryService.delete(req.params.id, req.params.npcId);
    res.status(204).send();
  } catch (err) { next(err); }
});
