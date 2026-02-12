CREATE TYPE memory_type AS ENUM ('episodic', 'semantic', 'emotional', 'procedural');
CREATE TYPE importance_level AS ENUM ('trivial', 'minor', 'moderate', 'significant', 'critical');

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  type memory_type NOT NULL,
  importance importance_level NOT NULL DEFAULT 'moderate',
  vividness REAL NOT NULL DEFAULT 1.0 CHECK (vividness >= 0 AND vividness <= 1),
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  access_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memories_npc_id ON memories (npc_id);
CREATE INDEX idx_memories_type ON memories (npc_id, type);
CREATE INDEX idx_memories_vividness ON memories (npc_id, vividness DESC);

-- IVFFlat index for vector similarity search
CREATE INDEX idx_memories_embedding ON memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
