import { Router } from 'express';
import { channelBindingRepository } from './channel-binding.repository';
import { npcRepository } from './npc.repository';
import { apiKeyMiddleware } from '../../middleware/apiKey.middleware';
import { apiRateLimit } from '../../middleware/rateLimit.middleware';
import { bindChannelSchema, unbindChannelSchema, resolveChannelQuery } from '@clawdblox/memoryweave-shared';
import { ValidationError, NotFoundError } from '../../utils/errors';

export const channelBindingController = Router();

channelBindingController.use('/channels', apiKeyMiddleware, apiRateLimit);

channelBindingController.post('/channels/bind', async (req, res, next) => {
  try {
    const body = bindChannelSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const { npc_id, platform, platform_channel_id } = body.data;

    const npc = await npcRepository.findById(npc_id, req.projectId!);
    if (!npc) throw new NotFoundError('NPC not found');

    const binding = await channelBindingRepository.bind(req.projectId!, npc_id, platform, platform_channel_id);
    res.status(201).json({ binding });
  } catch (err) { next(err); }
});

channelBindingController.delete('/channels/bind', async (req, res, next) => {
  try {
    const body = unbindChannelSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const deleted = await channelBindingRepository.unbind(req.projectId!, body.data.platform, body.data.platform_channel_id);
    if (!deleted) throw new NotFoundError('Binding not found');

    res.status(204).send();
  } catch (err) { next(err); }
});

channelBindingController.get('/channels/bindings', async (req, res, next) => {
  try {
    const bindings = await channelBindingRepository.findByProject(req.projectId!);
    res.json({ bindings });
  } catch (err) { next(err); }
});

channelBindingController.get('/channels/resolve', async (req, res, next) => {
  try {
    const query = resolveChannelQuery.safeParse(req.query);
    if (!query.success) throw new ValidationError('Invalid query', query.error.format());

    const binding = await channelBindingRepository.findByChannel(query.data.platform, query.data.platform_channel_id, req.projectId!);
    if (!binding) throw new NotFoundError('No NPC bound to this channel');

    res.json({ npc_id: binding.npc_id, project_id: binding.project_id });
  } catch (err) { next(err); }
});
