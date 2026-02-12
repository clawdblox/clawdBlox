import crypto from 'node:crypto';
import { projectRepository } from './project.repository';
import { generateApiKey, hashApiKey } from '../../utils/api-key';
import { encrypt, decrypt } from '../../utils/crypto';
import { NotFoundError } from '../../utils/errors';
import type { Project } from '@clawdblox/memoryweave-shared';

function toSafe(project: Project) {
  const { api_key_hash, groq_key_encrypted, player_signing_secret, ...safe } = project;
  return {
    ...safe,
    has_groq_key: !!groq_key_encrypted,
  };
}

export const projectService = {
  async getById(id: string) {
    const project = await projectRepository.findById(id);
    if (!project) throw new NotFoundError('Project', id);
    return toSafe(project);
  },

  async update(id: string, data: {
    name?: string;
    groq_api_key?: string;
    settings?: Record<string, unknown>;
  }) {
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.settings) updateData.settings = data.settings;
    if (data.groq_api_key) {
      updateData.groq_key_encrypted = encrypt(data.groq_api_key);
    }

    const project = await projectRepository.update(id, updateData);
    if (!project) throw new NotFoundError('Project', id);
    return toSafe(project);
  },

  async rotateApiKey(id: string): Promise<{ apiKey: string }> {
    const currentProject = await projectRepository.findById(id);
    if (!currentProject) throw new NotFoundError('Project', id);

    const { key, prefix } = generateApiKey();
    const hash = await hashApiKey(key);
    const rotationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await projectRepository.update(id, {
      previous_api_key_hash: currentProject.api_key_hash,
      key_rotation_expires_at: rotationExpiry,
      api_key_hash: hash,
      api_key_prefix: prefix,
    });

    return { apiKey: key };
  },

  async rotateSigningSecret(id: string): Promise<{ signingSecret: string }> {
    const secret = crypto.randomBytes(32).toString('hex');
    const updated = await projectRepository.update(id, { player_signing_secret: secret });
    if (!updated) throw new NotFoundError('Project', id);

    return { signingSecret: secret };
  },

  async getGroqKey(project: Project): Promise<string | null> {
    if (!project.groq_key_encrypted) return null;
    return decrypt(project.groq_key_encrypted);
  },
};
