import { redis } from '../../config/database';
import { RateLimitError } from '../../utils/errors';

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /you\s+are\s+now\s+a/i,
  /act\s+as\s+if\s+you\s+are/i,
  /forget\s+(all\s+)?your\s+(previous\s+)?instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /override\s+(your\s+)?system\s+prompt/i,
  /new\s+system\s+prompt/i,
  /\[system\]/i,
  /\[assistant\]/i,
  /\<system\>/i,
  /\<assistant\>/i,
  /```system/i,
  /---\s*system/i,
  /ADMIN\s*OVERRIDE/i,
  /jailbreak/i,
  /DAN\s+mode/i,
];

const RATE_LIMIT_KEY_PREFIX = 'injection:';
const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 600;

export async function detectInjection(playerId: string, message: string): Promise<{ detected: boolean; pattern?: string }> {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(message)) {
      const key = `${RATE_LIMIT_KEY_PREFIX}${playerId}`;
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, WINDOW_SECONDS);
      }

      if (count > MAX_ATTEMPTS) {
        throw new RateLimitError('Too many suspicious messages. Please try again later.');
      }

      return { detected: true, pattern: pattern.source };
    }
  }

  return { detected: false };
}
