-- Canonical player identity (unifies cross-platform accounts)
CREATE TABLE player_identities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Platform -> canonical player mapping
CREATE TABLE player_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES player_identities(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('discord', 'telegram', 'roblox', 'web')),
  platform_user_id VARCHAR(255) NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(platform, platform_user_id)
);

-- Temporary verification codes (TTL 5 min)
CREATE TABLE link_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  code VARCHAR(6) NOT NULL UNIQUE,
  platform VARCHAR(20) NOT NULL,
  platform_user_id VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_link_codes_code ON link_codes (code) WHERE used = false;
CREATE INDEX idx_player_links_lookup ON player_links (platform, platform_user_id);
CREATE INDEX idx_player_identities_project ON player_identities (project_id);
