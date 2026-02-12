import { Router } from 'express';
import { projectService } from './project.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { updateProjectSchema } from '@clawdblox/memoryweave-shared';
import { ValidationError } from '../../utils/errors';

export const projectController = Router();

projectController.get('/admin/project', authMiddleware, requireRole('viewer'), async (req, res, next) => {
  try {
    const project = await projectService.getById(req.user!.project_id);
    res.json({ project });
  } catch (err) { next(err); }
});

projectController.put('/admin/project', authMiddleware, requireRole('owner'), async (req, res, next) => {
  try {
    const body = updateProjectSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const project = await projectService.update(req.user!.project_id, body.data);
    res.json({ project });
  } catch (err) { next(err); }
});

projectController.post('/admin/project/rotate-api-key', authMiddleware, requireRole('owner'), async (req, res, next) => {
  try {
    const result = await projectService.rotateApiKey(req.user!.project_id);
    res.json({
      api_key: result.apiKey,
      message: 'API key rotated. Store this key safely — it cannot be retrieved later.',
    });
  } catch (err) { next(err); }
});

projectController.post('/admin/project/rotate-signing-secret', authMiddleware, requireRole('owner'), async (req, res, next) => {
  try {
    const result = await projectService.rotateSigningSecret(req.user!.project_id);
    res.json({
      signing_secret: result.signingSecret,
      message: 'Player signing secret rotated.',
    });
  } catch (err) { next(err); }
});
