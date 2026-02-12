import { WS_CLOSE_CODES, WS_CLOSE_REASONS } from '@clawdblox/memoryweave-shared';

export { WS_CLOSE_CODES, WS_CLOSE_REASONS };

export function closeWithCode(ws: { close: (code: number, reason: string) => void }, code: number): void {
  const reason = WS_CLOSE_REASONS[code] || 'Unknown';
  ws.close(code, reason);
}
