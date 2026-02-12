import { npcRepository } from './npc.repository';
import { AIProviderFactory } from '../../ai/provider.factory';
import { projectRepository } from '../project/project.repository';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { OCEAN_TRAITS, OCEAN_RANGE } from '@clawdblox/memoryweave-shared';
import type { NPC, OceanPersonality } from '@clawdblox/memoryweave-shared';

function validateOcean(personality: Partial<OceanPersonality>): void {
  for (const trait of OCEAN_TRAITS) {
    const value = personality[trait];
    if (value !== undefined && (value < OCEAN_RANGE.min || value > OCEAN_RANGE.max)) {
      throw new ValidationError(`OCEAN trait "${trait}" must be between ${OCEAN_RANGE.min} and ${OCEAN_RANGE.max}`);
    }
  }
}

export const npcService = {
  async list(projectId: string, page: number, limit: number) {
    return npcRepository.findAll(projectId, page, limit);
  },

  async getById(id: string, projectId: string): Promise<NPC> {
    const npc = await npcRepository.findById(id, projectId);
    if (!npc) throw new NotFoundError('NPC', id);
    return npc;
  },

  async create(projectId: string, data: {
    name: string;
    personality: OceanPersonality;
    speaking_style: Record<string, unknown>;
    backstory: string;
    system_prompt?: string;
    mood?: string;
  }): Promise<NPC> {
    validateOcean(data.personality);
    return npcRepository.create(projectId, data);
  },

  async update(id: string, projectId: string, data: {
    name?: string;
    personality?: Partial<OceanPersonality>;
    speaking_style?: Record<string, unknown>;
    backstory?: string;
    system_prompt?: string;
    mood?: string;
    is_active?: boolean;
  }): Promise<NPC> {
    if (data.personality) {
      validateOcean(data.personality);

      if (Object.keys(data.personality).length < OCEAN_TRAITS.length) {
        const existing = await npcRepository.findById(id, projectId);
        if (!existing) throw new NotFoundError('NPC', id);
        data.personality = { ...existing.personality, ...data.personality };
      }
    }

    const npc = await npcRepository.update(id, projectId, data as Record<string, unknown>);
    if (!npc) throw new NotFoundError('NPC', id);
    return npc;
  },

  async delete(id: string, projectId: string): Promise<void> {
    const deleted = await npcRepository.delete(id, projectId);
    if (!deleted) throw new NotFoundError('NPC', id);
  },

  async generate(projectId: string, data: {
    description: string;
    traits?: Partial<OceanPersonality>;
    setting?: string;
  }): Promise<NPC> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project', projectId);

    const provider = await AIProviderFactory.create(project);

    const prompt = `Generate a detailed NPC character for a video game based on this description:
"${data.description}"
${data.setting ? `Setting: ${data.setting}` : ''}
${data.traits ? `Personality hints: ${JSON.stringify(data.traits)}` : ''}

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "name": "character name",
  "personality": {
    "openness": 0.0-1.0,
    "conscientiousness": 0.0-1.0,
    "extraversion": 0.0-1.0,
    "agreeableness": 0.0-1.0,
    "neuroticism": 0.0-1.0
  },
  "speaking_style": {
    "vocabulary_level": "simple|moderate|advanced|archaic",
    "formality": "casual|neutral|formal",
    "humor": "none|subtle|frequent|sarcastic",
    "verbosity": "terse|concise|normal|verbose",
    "quirks": ["quirk1"],
    "catchphrases": ["phrase1"]
  },
  "backstory": "2-3 paragraph backstory",
  "mood": "current mood"
}`;

    let fullResponse = '';
    for await (const token of provider.chat([
      { role: 'system', content: 'You are a creative NPC character designer. Respond ONLY with valid JSON.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.8, max_tokens: 2000 })) {
      fullResponse += token;
    }

    const jsonMatch = fullResponse.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new ValidationError('AI did not return valid JSON');

    let generated: Record<string, unknown>;
    try {
      generated = JSON.parse(jsonMatch[0]);
    } catch {
      throw new ValidationError('AI returned malformed JSON');
    }

    if (!generated.name || !generated.personality || !generated.backstory) {
      throw new ValidationError('AI response missing required fields (name, personality, backstory)');
    }

    if (data.traits) {
      generated.personality = { ...generated.personality, ...data.traits };
    }

    return this.create(projectId, generated);
  },
};
