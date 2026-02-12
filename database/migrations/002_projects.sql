CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  api_key_hash VARCHAR(255) NOT NULL,
  api_key_prefix VARCHAR(8) NOT NULL,
  previous_api_key_hash VARCHAR(255),
  key_rotation_expires_at TIMESTAMPTZ,
  groq_key_encrypted TEXT,
  player_signing_secret VARCHAR(64) NOT NULL,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_api_key_prefix ON projects (api_key_prefix);
