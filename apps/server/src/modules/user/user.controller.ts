import { Router, type Response } from 'express';
import { userService } from './user.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { loginRateLimit } from '../../middleware/rateLimit.middleware';
import { verifyAccessToken, revokeAccessToken } from '../../utils/jwt';
import { setupSchema, loginSchema, createUserSchema, updateUserSchema } from '@clawdblox/memoryweave-shared';
import type { TokenPair } from '@clawdblox/memoryweave-shared';
import { ValidationError } from '../../utils/errors';
import { env } from '../../config/env';

const isProduction = env.NODE_ENV === 'production';
const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function setAuthCookies(res: Response, tokens: TokenPair): void {
  res.cookie('access_token', tokens.accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });
  res.cookie('refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    path: '/api/auth/refresh',
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export const userController = Router();

userController.post('/admin/setup', loginRateLimit, async (req, res, next) => {
  try {
    const body = setupSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const result = await userService.setup(body.data);
    setAuthCookies(res, result.tokens);

    res.status(201).json({ user: result.user, api_key: result.apiKey });
  } catch (err) { next(err); }
});

userController.post('/api/auth/login', loginRateLimit, async (req, res, next) => {
  try {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const result = await userService.login(body.data.email, body.data.password);
    setAuthCookies(res, result.tokens);

    res.json({ user: result.user });
  } catch (err) { next(err); }
});

userController.post('/api/auth/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) throw new ValidationError('Refresh token required');

    const tokens = await userService.refresh(refreshToken);
    setAuthCookies(res, tokens);

    res.json({ message: 'Tokens refreshed' });
  } catch (err) { next(err); }
});

userController.post('/api/auth/logout', async (req, res) => {
  const accessToken = req.cookies?.access_token;
  if (accessToken) {
    try {
      const payload = verifyAccessToken(accessToken);
      if (payload.jti && payload.exp) {
        await revokeAccessToken(payload.jti, payload.exp);
      }
    } catch {
      // Token already expired/invalid, no need to revoke
    }
  }

  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    await userService.revokeRefreshToken(refreshToken);
  }

  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
  res.json({ message: 'Logged out' });
});

userController.get('/api/auth/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await userService.getById(req.user!.sub);
    res.json({ user });
  } catch (err) { next(err); }
});

userController.get('/admin/users', authMiddleware, requireRole('owner'), async (req, res, next) => {
  try {
    const users = await userService.listByProject(req.user!.project_id);
    res.json({ users });
  } catch (err) { next(err); }
});

userController.post('/admin/users', authMiddleware, requireRole('owner'), async (req, res, next) => {
  try {
    const body = createUserSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const user = await userService.createUser(body.data, req.user!.project_id);
    res.status(201).json({ user });
  } catch (err) { next(err); }
});

userController.put('/admin/users/:id', authMiddleware, requireRole('owner'), async (req, res, next) => {
  try {
    const body = updateUserSchema.safeParse(req.body);
    if (!body.success) throw new ValidationError('Invalid input', body.error.format());

    const user = await userService.updateUser(req.params.id, req.user!.project_id, body.data);
    res.json({ user });
  } catch (err) { next(err); }
});

userController.delete('/admin/users/:id', authMiddleware, requireRole('owner'), async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id, req.user!.project_id);
    res.status(204).send();
  } catch (err) { next(err); }
});
