import type { Request, Response, NextFunction } from 'express';
import { redis } from '../config/database';
import { env } from '../config/env';
import { RateLimitError } from '../utils/errors';

interface RateLimitConfig {
  keyGenerator: (req: Request) => string;
  max: number;
  windowMinutes: number;
  message?: string;
}

function createRateLimit(config: RateLimitConfig) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const key = `rl:${config.keyGenerator(req)}`;
      const current = await redis.incr(key);
      await redis.expire(key, config.windowMinutes * 60);

      if (current > config.max) {
        res.set('Retry-After', String(config.windowMinutes * 60));
        next(new RateLimitError(config.message || 'Too many requests'));
        return;
      }

      next();
    } catch (err) {
      console.error('Rate limit Redis error:', err);
      res.status(503).json({ error: { code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' } });
    }
  };
}

export const loginRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const email = req.body?.email;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  const ipLimiter = createRateLimit({
    keyGenerator: () => `login:ip:${ip}`,
    max: env.RATE_LIMIT_LOGIN_PER_IP,
    windowMinutes: env.RATE_LIMIT_LOGIN_WINDOW_MINUTES,
    message: 'Too many login attempts from this IP',
  });

  await ipLimiter(req, res, async (err?: unknown) => {
    if (err) { next(err); return; }

    if (email) {
      const emailLimiter = createRateLimit({
        keyGenerator: () => `login:email:${email}`,
        max: env.RATE_LIMIT_LOGIN_PER_EMAIL,
        windowMinutes: env.RATE_LIMIT_LOGIN_WINDOW_MINUTES,
        message: 'Too many login attempts for this email',
      });
      await emailLimiter(req, res, next);
    } else {
      next();
    }
  });
};

export const apiRateLimit = createRateLimit({
  keyGenerator: (req) => `api:${req.projectId || 'unknown'}`,
  max: env.RATE_LIMIT_API_PER_KEY,
  windowMinutes: env.RATE_LIMIT_API_WINDOW_MINUTES,
});
