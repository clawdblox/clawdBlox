export interface ProjectSettings {
  groq_chat_model?: string;
  groq_embed_model?: string;
  max_npcs?: number;
  max_memories_per_npc?: number;
  memory_decay_enabled?: boolean;
}

export interface Project {
  id: string;
  name: string;
  api_key_hash: string;
  api_key_prefix: string;
  previous_api_key_hash: string | null;
  key_rotation_expires_at: Date | null;
  groq_key_encrypted: string | null;
  api_key_encrypted: string | null;
  player_signing_secret: string;
  settings: ProjectSettings;
  created_at: Date;
  updated_at: Date;
}

export interface APIKey {
  id: string;
  project_id: string;
  prefix: string;
  hash: string;
  name: string;
  is_active: boolean;
  last_used_at: Date | null;
  created_at: Date;
}
