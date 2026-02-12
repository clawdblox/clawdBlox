export type ConversationStatus = 'active' | 'ended' | 'archived';

export type MessageRole = 'player' | 'npc' | 'system';

export interface Conversation {
  id: string;
  npc_id: string;
  player_id: string;
  status: ConversationStatus;
  summary?: string;
  message_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface ChatResponse {
  conversation_id: string;
  message: string;
  npc_mood?: string;
}
