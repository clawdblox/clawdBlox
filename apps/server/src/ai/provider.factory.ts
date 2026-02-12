import type { AIProvider, Project } from '@clawdblox/memoryweave-shared';
import { GroqProvider } from './providers/groq.provider';
import { decrypt } from '../utils/crypto';
import { env } from '../config/env';
import { ValidationError } from '../utils/errors';

export class AIProviderFactory {
  static async create(project: Project): Promise<AIProvider> {
    let apiKey: string | undefined;
    try {
      apiKey = project.groq_key_encrypted
        ? decrypt(project.groq_key_encrypted)
        : env.GROQ_API_KEY;
    } catch {
      throw new ValidationError('Failed to decrypt API key. Check ENCRYPTION_KEY.');
    }

    if (!apiKey) {
      throw new ValidationError('No AI API key configured. Set GROQ_API_KEY or configure BYOK.');
    }

    const chatModel = project.settings?.groq_chat_model || env.GROQ_CHAT_MODEL;
    const embedModel = project.settings?.groq_embed_model || env.GROQ_EMBED_MODEL;

    return new GroqProvider(apiKey, chatModel, embedModel);
  }
}
