import type { Request, Response, NextFunction } from 'express';
import { projectRepository } from '../modules/project/project.repository';
import { verifyApiKey, isValidApiKeyFormat } from '../utils/api-key';
import { AuthError } from '../utils/errors';
import type { Project } from '@clawdblox/memoryweave-shared';

declare global {
  namespace Express {
    interface Request {
      project?: Project;
      projectId?: string;
    }
  }
}

export async function apiKeyMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      throw new AuthError('API key required (x-api-key header)');
    }

    if (!isValidApiKeyFormat(apiKey)) {
      throw new AuthError('Invalid API key format');
    }

    const prefix = apiKey.slice(0, 8);
    const project = await projectRepository.findByApiKeyPrefix(prefix);
    if (!project) {
      throw new AuthError('Invalid API key');
    }

    const valid = await verifyApiKey(apiKey, project.api_key_hash);

    if (!valid) {
      const canUsePreviousKey =
        project.previous_api_key_hash &&
        project.key_rotation_expires_at &&
        new Date() < project.key_rotation_expires_at;

      if (!canUsePreviousKey || !await verifyApiKey(apiKey, project.previous_api_key_hash!)) {
        throw new AuthError('Invalid API key');
      }
    }

    req.project = project;
    req.projectId = project.id;
    next();
  } catch (err) {
    next(err instanceof AuthError ? err : new AuthError('API key validation failed'));
  }
}
