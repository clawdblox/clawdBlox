import crypto from 'node:crypto';
import { z } from 'zod';
import { WebSocketServer, WebSocket } from 'ws';
import type { Server, IncomingMessage } from 'http';
import type { Duplex } from 'stream';
import { projectRepository } from '../modules/project/project.repository';
import { verifyApiKey, isValidApiKeyFormat } from '../utils/api-key';
import { sanitizeText } from '../middleware/sanitize.middleware';
import { verifyHMAC } from '../utils/hmac';
import { env } from '../config/env';
import { WS_CLOSE_CODES, closeWithCode } from './ws-codes';
import {
  registerConnection,
  unregisterConnection,
  checkMessageRate,
  checkMessageSize,
  checkInactivity,
  getConnection,
  getAllConnections,
} from './ws-connection';
import { streamChat } from './ws-streaming';

// Schema for game client messages (with HMAC player_token)
const wsPlayerChatSchema = z.object({
  npc_id: z.string().uuid(),
  player_id: z.string().min(1).max(100),
  player_token: z.string().min(1).max(256),
  message: z.string().min(1).max(4000),
});

// Schema for dashboard messages (no HMAC — already authenticated via API key)
const wsDashboardChatSchema = z.object({
  npc_id: z.string().uuid(),
  player_id: z.string().min(1).max(100).optional(),
  message: z.string().min(1).max(4000),
});

let heartbeatInterval: NodeJS.Timeout | null = null;
let inactivityInterval: NodeJS.Timeout | null = null;

function extractApiKeyFromRequest(req: IncomingMessage): string | null {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const keyFromQuery = url.searchParams.get('api_key');
  if (keyFromQuery) return keyFromQuery;

  const authHeader = req.headers['authorization'];
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

function sendError(ws: WebSocket, error: string): void {
  ws.send(JSON.stringify({ type: 'error', data: { code: 'ERROR', message: error } }));
}

async function handleChatMessage(ws: WebSocket, parsed: unknown): Promise<void> {
  // Unwrap `data` envelope if the client sends { type: 'chat', data: {...} }
  const payload = (parsed as any)?.data ?? parsed;

  const conn = getConnection(ws);
  if (!conn) return;

  const project = await projectRepository.findById(conn.projectId);
  if (!project) {
    sendError(ws, 'Project not found');
    return;
  }

  // Try player auth schema first (has player_token for HMAC)
  const playerResult = wsPlayerChatSchema.safeParse(payload);
  if (playerResult.success) {
    const { npc_id, player_id, player_token, message } = playerResult.data;

    const parts = player_token.split(':');
    if (parts.length !== 2) {
      sendError(ws, 'Invalid player_token');
      return;
    }

    const [timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp) || Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      sendError(ws, 'Token expired');
      return;
    }

    const messageHash = crypto.createHash('sha256').update(message).digest('hex');
    const hmacPayload = `${player_id}:${timestampStr}:${messageHash}`;
    if (!verifyHMAC(project.player_signing_secret, hmacPayload, signature)) {
      sendError(ws, 'Invalid signature');
      return;
    }

    const sanitizedMessage = sanitizeText(message);
    await streamChat(ws, project, npc_id, player_id, sanitizedMessage);
    return;
  }

  // Fall back to dashboard schema (no HMAC — connection already authenticated by API key)
  const dashboardResult = wsDashboardChatSchema.safeParse(payload);
  if (!dashboardResult.success) {
    sendError(ws, 'Invalid chat message format');
    return;
  }

  const { npc_id, player_id, message } = dashboardResult.data;
  const sanitizedMessage = sanitizeText(message);
  await streamChat(ws, project, npc_id, player_id || 'dashboard', sanitizedMessage);
}

export function createWSServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true, path: '/ws' });

  server.on('upgrade', async (req: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname !== '/ws') {
      socket.destroy();
      return;
    }

    const apiKey = extractApiKeyFromRequest(req);
    if (!apiKey || !isValidApiKeyFormat(apiKey)) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const prefix = apiKey.slice(0, 8);
    let project;
    try {
      project = await projectRepository.findByApiKeyPrefix(prefix);
    } catch (err) {
      console.error('WS upgrade: database error during auth:', err);
      socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
      socket.destroy();
      return;
    }

    let keyValid = false;
    if (project) {
      try {
        keyValid = await verifyApiKey(apiKey, project.api_key_hash);
      } catch (err) {
        console.error('WS upgrade: error verifying API key:', err);
        socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
        socket.destroy();
        return;
      }
    }

    if (!project || !keyValid) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    (req as any)._preAuthProject = project;
    (req as any)._preAuthApiKey = apiKey;

    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  });

  heartbeatInterval = setInterval(() => {
    for (const [ws] of getAllConnections()) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }
  }, env.WS_HEARTBEAT_INTERVAL_MS);

  inactivityInterval = setInterval(checkInactivity, 60000);

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const preAuthProject = (req as any)._preAuthProject;
    const preAuthApiKey = (req as any)._preAuthApiKey;

    if (!preAuthProject || !preAuthApiKey) {
      closeWithCode(ws, WS_CLOSE_CODES.AUTH_FAILED);
      return;
    }

    if (!registerConnection(ws, preAuthProject.id, preAuthApiKey)) {
      return;
    }
    ws.send(JSON.stringify({ type: 'auth:success', data: { project_id: preAuthProject.id } }));

    ws.on('message', async (data: Buffer) => {
      try {
        if (!checkMessageSize(data)) {
          closeWithCode(ws, WS_CLOSE_CODES.INVALID_FORMAT);
          return;
        }

        let parsed: unknown;
        try {
          parsed = JSON.parse(data.toString());
        } catch {
          closeWithCode(ws, WS_CLOSE_CODES.INVALID_FORMAT);
          return;
        }

        if (!checkMessageRate(ws)) return;

        const messageType = (parsed as any)?.type;
        if (messageType === 'chat') {
          await handleChatMessage(ws, parsed);
        } else if (messageType === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        } else {
          sendError(ws, `Unknown message type: ${messageType}`);
        }
      } catch (err) {
        console.error('WS message error:', err);
        if (ws.readyState === WebSocket.OPEN) {
          const detail = env.NODE_ENV === 'production'
            ? 'Internal error'
            : (err instanceof Error ? err.message : 'Internal error');
          sendError(ws, detail);
        }
      }
    });

    ws.on('close', () => unregisterConnection(ws));

    ws.on('error', (err) => {
      console.error('WS error:', err);
      unregisterConnection(ws);
    });
  });

  // Graceful shutdown: close all connections before stopping
  const originalClose = wss.close.bind(wss);
  wss.close = ((cb?: (err?: Error) => void) => {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    if (inactivityInterval) clearInterval(inactivityInterval);

    for (const [ws] of getAllConnections()) {
      closeWithCode(ws, WS_CLOSE_CODES.SERVER_SHUTDOWN);
    }

    originalClose(cb);
  }) as any;

  console.log('🔌 WebSocket server ready on /ws');
  return wss;
}
