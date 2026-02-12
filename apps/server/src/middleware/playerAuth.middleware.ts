import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { verifyHMAC } from '../utils/hmac';
import { AuthError, ValidationError } from '../utils/errors';

const MAX_TIMESTAMP_DRIFT_MS = 5 * 60 * 1000; // 5 minutes

export function playerAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.project) {
      throw new AuthError('Project context required');
    }

    const { player_id, player_token, message } = req.body;

    if (!player_id || !player_token || !message) {
      throw new ValidationError('player_id, player_token, and message are required');
    }

    // player_token format: "timestamp:hmac_signature"
    const parts = player_token.split(':');
    if (parts.length !== 2) {
      throw new AuthError('Invalid player_token format');
    }

    const [timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp)) {
      throw new AuthError('Invalid timestamp in player_token');
    }

    // Check timestamp freshness
    const now = Date.now();
    if (Math.abs(now - timestamp) > MAX_TIMESTAMP_DRIFT_MS) {
      throw new AuthError('Player token expired');
    }

    // HMAC payload includes message hash to prevent message tampering
    const messageHash = crypto.createHash('sha256').update(message).digest('hex');
    const payload = `${player_id}:${timestampStr}:${messageHash}`;
    const valid = verifyHMAC(req.project.player_signing_secret, payload, signature);

    if (!valid) {
      throw new AuthError('Invalid player token signature');
    }

    next();
  } catch (err) {
    next(err);
  }
}
