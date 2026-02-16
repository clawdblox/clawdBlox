import { Router } from 'express';
import { playerService } from './player.service';
import { apiKeyMiddleware } from '../../middleware/apiKey.middleware';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import { requestLinkCodeSchema, verifyLinkSchema, resolvePlayerQuery, unlinkPlayerSchema } from '@clawdblox/memoryweave-shared';
import { ValidationError } from '../../utils/errors';

export const playerController = Router();

playerController.use('/players', apiKeyMiddleware, apiRateLimit);

playerController.post('/players/request-code', async (req, res, next) => {
  try {
    const body = requestLinkCodeSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const result = await playerService.requestCode(req.projectId!, body.data.platform, body.data.platform_user_id);
    res.json(result);
  } catch (err) { next(err); }
});

playerController.post('/players/verify-link', async (req, res, next) => {
  try {
    const body = verifyLinkSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const result = await playerService.verifyAndLink(req.projectId!, body.data.code, body.data.platform, body.data.platform_user_id);
    res.json(result);
  } catch (err) { next(err); }
});

playerController.get('/players/resolve', async (req, res, next) => {
  try {
    const query = resolvePlayerQuery.safeParse(req.query);
    if (!query.success) throw new ValidationError('Invalid query', query.error.format());

    const result = await playerService.resolve(req.projectId!, query.data.platform, query.data.platform_user_id);
    res.json(result);
  } catch (err) { next(err); }
});

playerController.get('/players/:id/links', async (req, res, next) => {
  try {
    const result = await playerService.listLinks(req.projectId!, req.params.id);
    res.json(result);
  } catch (err) { next(err); }
});

playerController.delete('/players/unlink', async (req, res, next) => {
  try {
    const body = unlinkPlayerSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    await playerService.unlink(req.projectId!, body.data.platform, body.data.platform_user_id);
    res.json({ unlinked: true });
  } catch (err) { next(err); }
});
