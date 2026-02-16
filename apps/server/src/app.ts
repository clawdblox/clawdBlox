import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { pool, redis } from './config/database';
import { AppError } from './utils/errors';
import { userController } from './modules/user/user.controller';
import { projectController } from './modules/project/project.controller';
import { npcController } from './modules/npc/npc.controller';
import { memoryController } from './modules/memory/memory.controller';
import { conversationController } from './modules/conversation/conversation.controller';
import { lifeController } from './modules/life/life.controller';
import { statsController } from './modules/project/stats.controller';
import { channelBindingController } from './modules/npc/channel-binding.controller';
import { playerController } from './modules/player/player.controller';

function getCorsOrigin(): cors.CorsOptions['origin'] {
  if (env.NODE_ENV === 'production' && env.CORS_ORIGIN === '*') {
    return false;
  }
  if (env.CORS_ORIGIN.includes(',')) {
    return env.CORS_ORIGIN.split(',').map((o) => o.trim());
  }
  return env.CORS_ORIGIN;
}

export function createApp(): express.Express {
  const app = express();

  // Required for correct req.ip behind reverse proxy
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ credentials: true, origin: getCorsOrigin() }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Health check
  app.get('/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      await redis.ping();
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    } catch (err) {
      const message = env.NODE_ENV === 'production' || !(err instanceof Error)
        ? 'Health check failed'
        : err.message;
      res.status(503).json({ status: 'degraded', timestamp: new Date().toISOString(), error: message });
    }
  });

  // JWT-protected routes
  app.use('/', userController);
  app.use('/', projectController);

  // API key-protected routes
  app.use('/api/v1', npcController);
  app.use('/api/v1', memoryController);
  app.use('/api/v1', conversationController);
  app.use('/api/v1', lifeController);
  app.use('/api/v1', statsController);
  app.use('/api/v1', channelBindingController);
  app.use('/api/v1', playerController);

  app.use((_req, res) => {
    res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        error: {
          code: err.code,
          message: err.message,
          ...(err.details ? { details: err.details } : {}),
        },
      });
      return;
    }

    console.error('Unhandled error:', err);
    res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
      },
    });
  });

  return app;
}
