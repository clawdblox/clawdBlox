CREATE TABLE channel_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('discord', 'telegram')),
  channel_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, platform, channel_id)
);

CREATE INDEX idx_channel_bindings_lookup ON channel_bindings (platform, channel_id);
CREATE INDEX idx_channel_bindings_project ON channel_bindings (project_id);
