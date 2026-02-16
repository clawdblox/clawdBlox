import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { userRepository } from './user.repository';
import { projectRepository } from '../project/project.repository';
import { generateTokenPair, verifyRefreshToken } from '../../utils/jwt';
import { generateApiKey, hashApiKey } from '../../utils/api-key';
import { redis } from '../../config/database';
import type { TokenPair, UserPublic, User } from '@clawdblox/memoryweave-shared';
import { encrypt, decrypt } from '../../utils/crypto';
import { ConflictError, AuthError, NotFoundError, ForbiddenError } from '../../utils/errors';

const BCRYPT_ROUNDS = 12;
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

function toPublic(user: User): UserPublic {
  return {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    role: user.role as UserPublic['role'],
    project_id: user.project_id,
    is_active: user.is_active,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
  };
}

export const userService = {
  async setup(data: {
    email: string;
    password: string;
    display_name: string;
    project_name: string;
  }): Promise<{ user: UserPublic; apiKey: string; tokens: TokenPair }> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists. Use login instead.');
    }

    const { key, prefix } = generateApiKey();
    const apiKeyHash = await hashApiKey(key);
    const signingSecret = crypto.randomBytes(32).toString('hex');

    const project = await projectRepository.create({
      name: data.project_name,
      api_key_hash: apiKeyHash,
      api_key_prefix: prefix,
      player_signing_secret: signingSecret,
      api_key_encrypted: encrypt(key),
    });

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      email: data.email,
      password_hash: passwordHash,
      display_name: data.display_name,
      role: 'owner',
      project_id: project.id,
    });

    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: 'owner',
      project_id: project.id,
    });

    return { user: toPublic(user), apiKey: key, tokens };
  },

  async login(email: string, password: string): Promise<{ user: UserPublic; apiKey?: string; tokens: TokenPair }> {
    const user = await userRepository.findByEmail(email);

    const valid = await bcrypt.compare(password, user?.password_hash || DUMMY_HASH);
    if (!user || !user.is_active || !valid) {
      throw new AuthError('Invalid email or password');
    }

    await userRepository.update(user.id, { last_login_at: new Date() });

    const tokens = generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      project_id: user.project_id,
    });

    let apiKey: string | undefined;
    const project = await projectRepository.findById(user.project_id);
    if (project?.api_key_encrypted) {
      apiKey = decrypt(project.api_key_encrypted);
    }

    return { user: toPublic(user), apiKey, tokens };
  },

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== 'refresh' || !payload.jti) {
      throw new AuthError('Invalid refresh token');
    }

    const isRevoked = await redis.get(`revoked:refresh:${payload.jti}`);
    if (isRevoked) {
      throw new AuthError('Refresh token has been revoked');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.is_active) {
      throw new AuthError('User not found or inactive');
    }

    await this.revokeRefreshToken(refreshToken);

    return generateTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
      project_id: user.project_id,
    });
  },

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      const payload = verifyRefreshToken(refreshToken);
      if (!payload.jti) return;

      const ttl = payload.exp
        ? payload.exp - Math.floor(Date.now() / 1000)
        : 7 * 24 * 60 * 60;

      if (ttl > 0) {
        await redis.setex(`revoked:refresh:${payload.jti}`, ttl, '1');
      }
    } catch {
      // Token already invalid/expired -- nothing to revoke
    }
  },

  async getById(id: string): Promise<UserPublic> {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return toPublic(user);
  },

  async listByProject(projectId: string): Promise<UserPublic[]> {
    const users = await userRepository.findByProjectId(projectId);
    return users.map(toPublic);
  },

  async createUser(data: {
    email: string;
    password: string;
    display_name: string;
    role: string;
  }, projectId: string): Promise<UserPublic> {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new ConflictError('Email already in use');

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      email: data.email,
      password_hash: passwordHash,
      display_name: data.display_name,
      role: data.role,
      project_id: projectId,
    });

    return toPublic(user);
  },

  async updateUser(id: string, projectId: string, data: {
    email?: string;
    password?: string;
    display_name?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<UserPublic> {
    const user = await userRepository.findById(id);
    if (!user || user.project_id !== projectId) throw new NotFoundError('User', id);

    // Prevent downgrading or deactivating the last owner
    const isLosingOwner = (data.role && data.role !== 'owner' && user.role === 'owner')
      || (data.is_active === false && user.role === 'owner');
    if (isLosingOwner) {
      const ownerCount = await userRepository.countOwners(projectId);
      if (ownerCount <= 1) {
        throw new ForbiddenError('Cannot remove the last owner of the project');
      }
    }

    const { password, ...fields } = data;
    const updateData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) updateData[key] = value;
    }
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    }

    const updated = await userRepository.update(id, updateData);
    if (!updated) throw new NotFoundError('User', id);
    return toPublic(updated);
  },

  async deleteUser(id: string, projectId: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user || user.project_id !== projectId) throw new NotFoundError('User', id);

    if (user.role === 'owner') {
      const ownerCount = await userRepository.countOwners(projectId);
      if (ownerCount <= 1) {
        throw new ForbiddenError('Cannot delete the last owner of the project');
      }
    }

    await userRepository.delete(id);
  },
};
