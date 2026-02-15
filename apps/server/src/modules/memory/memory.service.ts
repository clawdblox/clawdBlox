import { memoryRepository } from './memory.repository';
import { AIProviderFactory } from '../../ai/provider.factory';
import { projectRepository } from '../project/project.repository';
import { NotFoundError } from '../../utils/errors';
import { sanitizeText } from '../../middleware/sanitize.middleware';
import { DECAY_RATES, createMemorySchema } from '@clawdblox/memoryweave-shared';
import { env } from '../../config/env';
import type { Memory, MemoryType, ImportanceLevel, MemorySearchResult } from '@clawdblox/memoryweave-shared';

let decayInterval: NodeJS.Timeout | null = null;
let isDecayRunning = false;

export const memoryService = {
  async list(npcId: string, page: number, limit: number) {
    return memoryRepository.findAll(npcId, page, limit);
  },

  async getById(id: string, npcId: string): Promise<Memory> {
    const memory = await memoryRepository.findById(id, npcId);
    if (!memory) throw new NotFoundError('Memory', id);
    return memory;
  },

  async create(npcId: string, projectId: string, data: {
    type: MemoryType;
    importance: ImportanceLevel;
    content: string;
    metadata?: Record<string, unknown>;
  }): Promise<Memory> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project', projectId);

    const provider = await AIProviderFactory.create(project);
    const embedding = await provider.embed(data.content);

    return memoryRepository.create(npcId, {
      ...data,
      embedding,
    });
  },

  async update(id: string, npcId: string, data: {
    importance?: ImportanceLevel;
    vividness?: number;
    content?: string;
    metadata?: Record<string, unknown>;
  }): Promise<Memory> {
    const memory = await memoryRepository.update(id, npcId, data);
    if (!memory) throw new NotFoundError('Memory', id);
    return memory;
  },

  async delete(id: string, npcId: string): Promise<void> {
    const deleted = await memoryRepository.delete(id, npcId);
    if (!deleted) throw new NotFoundError('Memory', id);
  },

  async search(npcId: string, projectId: string, data: {
    query: string;
    limit?: number;
    min_vividness?: number;
    types?: MemoryType[];
    importance_levels?: ImportanceLevel[];
  }): Promise<MemorySearchResult[]> {
    const project = await projectRepository.findById(projectId);
    if (!project) throw new NotFoundError('Project', projectId);

    const provider = await AIProviderFactory.create(project);
    const queryEmbedding = await provider.embed(data.query);

    return memoryRepository.searchSemantic(npcId, queryEmbedding, {
      limit: data.limit,
      minVividness: data.min_vividness,
      types: data.types,
      importanceLevels: data.importance_levels,
    });
  },

  async runDecay(): Promise<number> {
    console.log('🧠 Running memory decay...');
    const updated = await memoryRepository.batchDecay(DECAY_RATES);
    console.log(`  Decayed ${updated} memories`);
    return updated;
  },

  startDecayWorker(): void {
    if (decayInterval) return;
    const intervalMs = env.MEMORY_DECAY_INTERVAL_MINUTES * 60 * 1000;
    decayInterval = setInterval(async () => {
      if (isDecayRunning) {
        console.log('🧠 Decay already running, skipping');
        return;
      }
      isDecayRunning = true;
      try {
        await this.runDecay();
      } catch (err) {
        console.error('Decay worker error:', err);
      } finally {
        isDecayRunning = false;
      }
    }, intervalMs);
    console.log(`🕐 Memory decay worker started (every ${env.MEMORY_DECAY_INTERVAL_MINUTES}min)`);
  },

  stopDecayWorker(): void {
    if (decayInterval) {
      clearInterval(decayInterval);
      decayInterval = null;
    }
  },

  async extractMemories(npcId: string, projectId: string, messages: { role: string; content: string }[]): Promise<Memory[]> {
    const project = await projectRepository.findById(projectId);
    if (!project) return [];

    const provider = await AIProviderFactory.create(project);

    const prompt = `Analyze this conversation and extract key memories for the NPC. For each memory, determine:
- type: episodic (events), semantic (facts), emotional (feelings), procedural (skills/habits)
- importance: trivial, minor, moderate, significant, critical
- content: concise summary of the memory

Conversation:
${messages.map(m => `${sanitizeText(m.role)}: ${sanitizeText(m.content)}`).join('\n')}

Respond with ONLY a JSON array:
[{"type":"...","importance":"...","content":"..."}]
Return an empty array [] if no notable memories.`;

    let fullResponse = '';
    const aiTimeout = AbortSignal.timeout(30_000);
    for await (const token of provider.chat([
      { role: 'system', content: 'You extract NPC memories from conversations. Respond with ONLY valid JSON.' },
      { role: 'user', content: prompt },
    ], { temperature: 0.3, max_tokens: 1000 })) {
      if (aiTimeout.aborted) throw new Error('AI response timeout');
      fullResponse += token;
    }

    const match = fullResponse.match(/\[[\s\S]*\]/);
    if (!match) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(match[0]);
    } catch (err) {
      console.error('extractMemories: failed to parse JSON from AI response:', (err as Error).message);
      return [];
    }

    if (!Array.isArray(parsed)) return [];

    const memories: Memory[] = [];
    for (const item of parsed) {
      const result = createMemorySchema.safeParse(item);
      if (!result.success) {
        console.warn('extractMemories: skipping invalid memory item:', result.error.format());
        continue;
      }
      try {
        const memory = await this.create(npcId, projectId, result.data);
        memories.push(memory);
      } catch (err) {
        console.error('extractMemories: failed to create memory:', (err as Error).message);
      }
    }
    return memories;
  },
};
