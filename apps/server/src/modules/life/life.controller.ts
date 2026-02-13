import { Router } from 'express';
import { lifeService } from './life.service';
import { apiKeyMiddleware } from '../../middleware/apiKey.middleware';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import { createRoutineSchema, updateRoutineSchema, createGoalSchema, updateGoalSchema, createRelationshipSchema, updateRelationshipSchema } from '@clawdblox/memoryweave-shared';
import { ValidationError, NotFoundError } from '../../utils/errors';
import { npcRepository } from '../npc/npc.repository';

export const lifeController = Router();

lifeController.use('/npcs/:npcId', apiKeyMiddleware, apiRateLimit, async (req, _res, next) => {
  try {
    const npc = await npcRepository.findById(req.params.npcId, req.projectId!);
    if (!npc) throw new NotFoundError('NPC', req.params.npcId);
    next();
  } catch (err) { next(err); }
});

lifeController.get('/npcs/:npcId/routines', async (req, res, next) => {
  try {
    const routines = await lifeService.listRoutines(req.params.npcId);
    res.json({ routines });
  } catch (err) { next(err); }
});

lifeController.post('/npcs/:npcId/routines', async (req, res, next) => {
  try {
    const body = createRoutineSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const routine = await lifeService.createRoutine(req.params.npcId, body.data);
    res.status(201).json({ routine });
  } catch (err) { next(err); }
});

lifeController.get('/npcs/:npcId/routines/:id', async (req, res, next) => {
  try {
    const routine = await lifeService.getRoutine(req.params.id, req.params.npcId);
    res.json({ routine });
  } catch (err) { next(err); }
});

lifeController.put('/npcs/:npcId/routines/:id', async (req, res, next) => {
  try {
    const body = updateRoutineSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const routine = await lifeService.updateRoutine(req.params.id, req.params.npcId, body.data);
    res.json({ routine });
  } catch (err) { next(err); }
});

lifeController.delete('/npcs/:npcId/routines/:id', async (req, res, next) => {
  try {
    await lifeService.deleteRoutine(req.params.id, req.params.npcId);
    res.status(204).send();
  } catch (err) { next(err); }
});

lifeController.get('/npcs/:npcId/goals', async (req, res, next) => {
  try {
    const goals = await lifeService.listGoals(req.params.npcId);
    res.json({ goals });
  } catch (err) { next(err); }
});

lifeController.post('/npcs/:npcId/goals', async (req, res, next) => {
  try {
    const body = createGoalSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const goal = await lifeService.createGoal(req.params.npcId, body.data);
    res.status(201).json({ goal });
  } catch (err) { next(err); }
});

lifeController.get('/npcs/:npcId/goals/:id', async (req, res, next) => {
  try {
    const goal = await lifeService.getGoal(req.params.id, req.params.npcId);
    res.json({ goal });
  } catch (err) { next(err); }
});

lifeController.put('/npcs/:npcId/goals/:id', async (req, res, next) => {
  try {
    const body = updateGoalSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const goal = await lifeService.updateGoal(req.params.id, req.params.npcId, body.data);
    res.json({ goal });
  } catch (err) { next(err); }
});

lifeController.delete('/npcs/:npcId/goals/:id', async (req, res, next) => {
  try {
    await lifeService.deleteGoal(req.params.id, req.params.npcId);
    res.status(204).send();
  } catch (err) { next(err); }
});

lifeController.get('/npcs/:npcId/relationships', async (req, res, next) => {
  try {
    const relationships = await lifeService.listRelationships(req.params.npcId);
    res.json({ relationships });
  } catch (err) { next(err); }
});

lifeController.post('/npcs/:npcId/relationships', async (req, res, next) => {
  try {
    const body = createRelationshipSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const relationship = await lifeService.createRelationship(req.params.npcId, body.data);
    res.status(201).json({ relationship });
  } catch (err) { next(err); }
});

lifeController.get('/npcs/:npcId/relationships/:id', async (req, res, next) => {
  try {
    const relationship = await lifeService.getRelationshipById(req.params.id, req.params.npcId);
    res.json({ relationship });
  } catch (err) { next(err); }
});

lifeController.put('/npcs/:npcId/relationships/:id', async (req, res, next) => {
  try {
    const body = updateRelationshipSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const relationship = await lifeService.updateRelationship(req.params.id, req.params.npcId, body.data);
    res.json({ relationship });
  } catch (err) { next(err); }
});

lifeController.delete('/npcs/:npcId/relationships/:id', async (req, res, next) => {
  try {
    await lifeService.deleteRelationship(req.params.id, req.params.npcId);
    res.status(204).send();
  } catch (err) { next(err); }
});
