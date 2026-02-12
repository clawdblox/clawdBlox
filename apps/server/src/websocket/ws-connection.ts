import type WebSocket from 'ws';
import { env } from '../config/env';
import { WS_CLOSE_CODES, closeWithCode } from './ws-codes';

interface ConnectionInfo {
  projectId: string;
  apiKey: string;
  lastActivity: number;
  messageCount: number;
  messageWindowStart: number;
}

const connections = new Map<WebSocket, ConnectionInfo>();

export function getConnectionCount(): number {
  return connections.size;
}

export function registerConnection(ws: WebSocket, projectId: string, apiKey: string): boolean {
  if (connections.size >= env.WS_MAX_CONNECTIONS_GLOBAL) {
    closeWithCode(ws, WS_CLOSE_CODES.CONNECTION_LIMIT);
    return false;
  }

  let keyCount = 0;
  for (const conn of connections.values()) {
    if (conn.apiKey === apiKey) keyCount++;
  }
  if (keyCount >= env.WS_MAX_CONNECTIONS_PER_KEY) {
    closeWithCode(ws, WS_CLOSE_CODES.CONNECTION_LIMIT);
    return false;
  }

  const now = Date.now();
  connections.set(ws, {
    projectId,
    apiKey,
    lastActivity: now,
    messageCount: 0,
    messageWindowStart: now,
  });

  return true;
}

export function unregisterConnection(ws: WebSocket): void {
  connections.delete(ws);
}

export function checkMessageRate(ws: WebSocket): boolean {
  const conn = connections.get(ws);
  if (!conn) return false;

  const now = Date.now();

  if (now - conn.messageWindowStart > 60000) {
    conn.messageCount = 0;
    conn.messageWindowStart = now;
  }

  conn.messageCount++;
  conn.lastActivity = now;

  if (conn.messageCount > env.WS_MAX_MESSAGES_PER_MINUTE) {
    closeWithCode(ws, WS_CLOSE_CODES.RATE_LIMITED);
    return false;
  }

  return true;
}

export function checkMessageSize(data: Buffer | string): boolean {
  const size = typeof data === 'string' ? Buffer.byteLength(data) : data.length;
  return size <= env.WS_MAX_MESSAGE_SIZE_BYTES;
}

export function getConnection(ws: WebSocket): ConnectionInfo | undefined {
  return connections.get(ws);
}

export function getAllConnections(): Map<WebSocket, ConnectionInfo> {
  return connections;
}

export function checkInactivity(): void {
  const now = Date.now();
  for (const [ws, conn] of connections) {
    if (now - conn.lastActivity > env.WS_INACTIVITY_TIMEOUT_MS) {
      closeWithCode(ws, WS_CLOSE_CODES.INACTIVITY_TIMEOUT);
    }
  }
}
