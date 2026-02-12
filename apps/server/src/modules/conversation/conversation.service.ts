import { conversationRepository } from './conversation.repository';
import { npcRepository } from '../npc/npc.repository';
import { memoryService } from '../memory/memory.service';
import { lifeService } from '../life/life.service';
import { AIProviderFactory } from '../../ai/provider.factory';
import { buildSystemPrompt, buildMessages } from './prompt-builder';
import { detectInjection } from './injection-detector';
import { NotFoundError, ValidationError } from '../../utils/errors';
import type { ChatMessage, ChatResponse, NPC, Project } from '@clawdblox/memoryweave-shared';

const INJECTION_REPLY = "I don't understand what you mean. Could you rephrase that?";

interface ChatSetup {
  npc: NPC;
  conversationId: string;
  messages: ChatMessage[];
  relationship: Awaited<ReturnType<typeof lifeService.getRelationship>>;
}

async function prepareChatContext(
  npcId: string,
  project: Project,
  playerId: string,
  message: string,
): Promise<ChatSetup> {
  const npc = await npcRepository.findById(npcId, project.id);
  if (!npc) throw new NotFoundError('NPC', npcId);
  if (!npc.is_active) throw new ValidationError('NPC is not active');

  const conversation = await conversationRepository.create(npcId, playerId);
  const [history, memories, lifeContext, relationship] = await Promise.all([
    conversationRepository.getMessages(conversation.id, 20),
    memoryService.search(npcId, project.id, { query: message, limit: 5, min_vividness: 0.1 }),
    lifeService.getContextForConversation(npcId),
    lifeService.getRelationship(npcId, 'player', playerId),
  ]);

  const { prompt: systemPrompt, nonce } = buildSystemPrompt(npc, memories, {
    currentRoutine: lifeContext.currentRoutine,
    activeGoals: lifeContext.activeGoals,
    relationship: relationship ? {
      affinity: relationship.affinity,
      trust: relationship.trust,
      familiarity: relationship.familiarity,
    } : undefined,
  });

  const messages = buildMessages(
    systemPrompt,
    nonce,
    history.map(m => ({ role: m.role, content: m.content })),
    message,
  );

  return { npc, conversationId: conversation.id, messages, relationship };
}

async function finalizeChatResponse(
  npcId: string,
  project: Project,
  playerId: string,
  conversationId: string,
  playerMessage: string,
  fullResponse: string,
  relationship: ChatSetup['relationship'],
): Promise<void> {
  await conversationRepository.addMessage(conversationId, 'player', playerMessage);
  await conversationRepository.addMessage(conversationId, 'npc', fullResponse);

  if (relationship) {
    await lifeService.incrementFamiliarity(npcId, 'player', playerId);
  } else {
    await lifeService.createRelationship(npcId, { target_type: 'player', target_id: playerId, affinity: 0, trust: 0.5 });
  }

  memoryService.extractMemories(npcId, project.id, [
    { role: 'player', content: playerMessage },
    { role: 'npc', content: fullResponse },
  ]).catch(err => console.error('Memory extraction error:', err));
}

export const conversationService = {
  async chat(
    npcId: string,
    project: Project,
    playerId: string,
    message: string,
  ): Promise<ChatResponse> {
    const injection = await detectInjection(playerId, message);
    if (injection.detected) {
      console.warn(`Injection attempt blocked from player ${playerId}: ${injection.pattern}`);
      const npc = await npcRepository.findById(npcId, project.id);
      return { conversation_id: '', message: INJECTION_REPLY, npc_mood: npc?.mood ?? 'neutral' };
    }

    const { npc, conversationId, messages, relationship } = await prepareChatContext(npcId, project, playerId, message);

    const provider = await AIProviderFactory.create(project);
    let fullResponse = '';
    const aiTimeout = AbortSignal.timeout(30_000);
    for await (const token of provider.chat(messages, { temperature: 0.7, max_tokens: 512 })) {
      if (aiTimeout.aborted) throw new Error('AI response timeout');
      fullResponse += token;
    }

    await finalizeChatResponse(npcId, project, playerId, conversationId, message, fullResponse, relationship);

    return { conversation_id: conversationId, message: fullResponse, npc_mood: npc.mood };
  },

  async *chatStream(
    npcId: string,
    project: Project,
    playerId: string,
    message: string,
  ): AsyncGenerator<string, void, unknown> {
    const injection = await detectInjection(playerId, message);
    if (injection.detected) {
      console.warn(`Injection attempt blocked from player ${playerId}: ${injection.pattern}`);
      yield INJECTION_REPLY;
      return;
    }

    const { npc, conversationId, messages, relationship } = await prepareChatContext(npcId, project, playerId, message);

    const provider = await AIProviderFactory.create(project);
    let fullResponse = '';
    const aiTimeout = AbortSignal.timeout(30_000);

    for await (const token of provider.chat(messages, { temperature: 0.7, max_tokens: 512 })) {
      if (aiTimeout.aborted) throw new Error('AI response timeout');
      fullResponse += token;
      yield token;
    }

    await finalizeChatResponse(npcId, project, playerId, conversationId, message, fullResponse, relationship);
  },
};
