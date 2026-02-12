import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, isAccessTokenRevoked } from '../utils/jwt';
import { AuthError } from '../utils/errors';
import type { JWTPayload } from '@clawdblox/memoryweave-shared';

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.access_token;
    if (!token) {
      throw new AuthError('Access token required');
    }

    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      throw new AuthError('Invalid token type');
    }

    if (!payload.jti) {
      throw new AuthError('Invalid token: missing jti');
    }

    if (await isAccessTokenRevoked(payload.jti)) {
      throw new AuthError('Token has been revoked');
    }

    req.user = payload;
    next();
  } catch (err) {
    next(err instanceof AuthError ? err : new AuthError('Invalid or expired token'));
  }
}
