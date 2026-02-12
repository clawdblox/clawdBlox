import type WebSocket from 'ws';
import { conversationService } from '../modules/conversation/conversation.service';
import { env } from '../config/env';
import type { Project } from '@clawdblox/memoryweave-shared';

const AI_TIMEOUT_MS = 30_000;

export async function streamChat(
  ws: WebSocket,
  project: Project,
  npcId: string,
  playerId: string,
  message: string,
): Promise<void> {
  try {
    ws.send(JSON.stringify({ type: 'chat:start', data: { npc_id: npcId } }));

    const stream = conversationService.chatStream(npcId, project, playerId, message);

    let lastTokenTime = Date.now();
    let timedOut = false;
    const timeoutCheck = setInterval(() => {
      if (Date.now() - lastTokenTime > AI_TIMEOUT_MS) {
        timedOut = true;
        clearInterval(timeoutCheck);
        if (ws.readyState === ws.OPEN) {
          ws.send(JSON.stringify({ type: 'chat:error', data: { code: 'TIMEOUT', message: 'AI response timeout' } }));
        }
      }
    }, 5000);

    try {
      for await (const token of stream) {
        if (timedOut || ws.readyState !== ws.OPEN) break;
        lastTokenTime = Date.now();
        ws.send(JSON.stringify({ type: 'chat:token', data: { token } }));
      }
    } finally {
      clearInterval(timeoutCheck);
    }

    if (!timedOut && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'chat:end', data: { conversation_id: npcId } }));
    }
  } catch (err) {
    if (ws.readyState === ws.OPEN) {
      const detail = env.NODE_ENV === 'production'
        ? 'Internal error'
        : (err instanceof Error ? err.message : 'Unknown error');
      ws.send(JSON.stringify({ type: 'chat:error', data: { code: 'ERROR', message: detail } }));
    }
  }
}
