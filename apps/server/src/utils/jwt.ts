import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { JWTPayload, TokenPair } from '@clawdblox/memoryweave-shared';
import { env } from '../config/env';
import { redis } from '../config/database';

const JWT_ALGORITHM = 'HS256' as const;
const JWT_ISSUER = 'memoryweave';

function signToken(
  payload: Omit<JWTPayload, 'type' | 'jti'>,
  type: 'access' | 'refresh',
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign({ ...payload, type, jti: crypto.randomUUID() }, secret, {
    algorithm: JWT_ALGORITHM,
    expiresIn,
    issuer: JWT_ISSUER,
  });
}

export function generateAccessToken(payload: Omit<JWTPayload, 'type' | 'jti'>): string {
  return signToken(payload, 'access', env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'type' | 'jti'>): string {
  return signToken(payload, 'refresh', env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);
}

export function generateTokenPair(payload: Omit<JWTPayload, 'type' | 'jti'>): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
  }) as JWTPayload;
}

export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    algorithms: [JWT_ALGORITHM],
    issuer: JWT_ISSUER,
  }) as JWTPayload;
}

export async function isAccessTokenRevoked(jti: string): Promise<boolean> {
  return await redis.get(`revoked:access:${jti}`) !== null;
}

export async function revokeAccessToken(jti: string, expSeconds: number): Promise<void> {
  const ttl = expSeconds - Math.floor(Date.now() / 1000);
  if (ttl > 0) {
    await redis.setex(`revoked:access:${jti}`, ttl, '1');
  }
}
