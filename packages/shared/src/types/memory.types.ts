export type MemoryType = 'episodic' | 'semantic' | 'emotional' | 'procedural';

export type ImportanceLevel = 'trivial' | 'minor' | 'moderate' | 'significant' | 'critical';

export interface Memory {
  id: string;
  npc_id: string;
  type: MemoryType;
  importance: ImportanceLevel;
  vividness: number;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  access_count: number;
  last_accessed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface MemorySearchInput {
  query: string;
  limit?: number;
  min_vividness?: number;
  types?: MemoryType[];
  importance_levels?: ImportanceLevel[];
}

export interface MemorySearchResult extends Memory {
  similarity: number;
}
