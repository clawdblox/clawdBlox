CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('player', 'npc')),
  target_id VARCHAR(100) NOT NULL,
  affinity REAL NOT NULL DEFAULT 0 CHECK (affinity >= -1 AND affinity <= 1),
  trust REAL NOT NULL DEFAULT 0.5 CHECK (trust >= 0 AND trust <= 1),
  familiarity REAL NOT NULL DEFAULT 0 CHECK (familiarity >= 0 AND familiarity <= 1),
  interaction_history JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_relationships_npc_id ON relationships (npc_id);
CREATE UNIQUE INDEX idx_relationships_pair ON relationships (npc_id, target_type, target_id);
