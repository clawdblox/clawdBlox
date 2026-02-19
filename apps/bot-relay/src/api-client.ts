import { logger } from './logger.js';

const TIMEOUT_MS = 15_000;
const PLATFORM = 'telegram';

interface Npc {
  npc_id: string;
  name: string;
  platform: string;
  platform_channel_id: string;
}

interface ChatResponse {
  message: string;
  conversation_id: string;
  player_id: string;
}

interface LinkCodeResponse {
  code: string;
  expires_in: number;
}

interface ResolveResponse {
  player_id: string;
  canonical_id: string | null;
}

export class ApiClient {
  constructor(
    private baseUrl: string,
    private apiKey: string,
  ) {}

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    logger.debug(`API ${method} ${path}`);

    const res = await fetch(url, {
      method,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${text}`);
    }

    return res.json() as Promise<T>;
  }

  async listChannelNpcs(channelId: string): Promise<Npc[]> {
    const params = new URLSearchParams({
      platform: PLATFORM,
      platform_channel_id: channelId,
    });
    const data = await this.request<{ npcs: Npc[] }>(
      'GET',
      `/api/v1/channels/npcs?${params}`,
    );
    return data.npcs;
  }

  async chatBot(npcId: string, userId: string, message: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('POST', `/api/v1/npcs/${npcId}/chat/bot`, {
      platform: PLATFORM,
      platform_user_id: userId,
      message,
    });
  }

  async requestLinkCode(userId: string): Promise<LinkCodeResponse> {
    return this.request<LinkCodeResponse>('POST', '/api/v1/players/request-code', {
      platform: PLATFORM,
      platform_user_id: userId,
    });
  }

  async unlinkPlayer(userId: string): Promise<void> {
    await this.request('DELETE', '/api/v1/players/unlink', {
      platform: PLATFORM,
      platform_user_id: userId,
    });
  }

  async resolvePlayer(userId: string): Promise<ResolveResponse> {
    const params = new URLSearchParams({
      platform: PLATFORM,
      platform_user_id: userId,
    });
    return this.request<ResolveResponse>(
      'GET',
      `/api/v1/players/resolve?${params}`,
    );
  }
}
