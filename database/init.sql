-- ============================================================
-- MemoryWeave — Full database initialization
-- Generates all tables, indexes, types, and extensions
-- from scratch in a single transaction.
--
-- Usage:
--   psql -U memoryweave -d memoryweave -f database/init.sql
--   docker exec -i memoryweave-pg-dev psql -U memoryweave -d memoryweave < database/init.sql
-- ============================================================

BEGIN;

-- 001: Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 002: Projects
CREATE TABLE IF NOT EXISTS projects (
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

CREATE INDEX IF NOT EXISTS idx_projects_api_key_prefix ON projects (api_key_prefix);

-- 003: NPCs
CREATE TABLE IF NOT EXISTS npcs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  personality JSONB NOT NULL DEFAULT '{"openness":0.5,"conscientiousness":0.5,"extraversion":0.5,"agreeableness":0.5,"neuroticism":0.5}',
  speaking_style JSONB NOT NULL DEFAULT '{}',
  backstory TEXT NOT NULL DEFAULT '',
  system_prompt TEXT NOT NULL DEFAULT '',
  mood VARCHAR(50) NOT NULL DEFAULT 'neutral',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_npcs_project_id ON npcs (project_id);
CREATE INDEX IF NOT EXISTS idx_npcs_is_active ON npcs (project_id, is_active);

-- 004: Conversations & Messages
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  player_id VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  summary TEXT,
  message_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_active
  ON conversations (npc_id, player_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_conversations_npc_id ON conversations (npc_id);
CREATE INDEX IF NOT EXISTS idx_conversations_player_id ON conversations (player_id);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(10) NOT NULL CHECK (role IN ('player', 'npc', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id, created_at);

-- 005: Memories (with pgvector)
DO $$ BEGIN
  CREATE TYPE memory_type AS ENUM ('episodic', 'semantic', 'emotional', 'procedural');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE importance_level AS ENUM ('trivial', 'minor', 'moderate', 'significant', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS memories (
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

CREATE INDEX IF NOT EXISTS idx_memories_npc_id ON memories (npc_id);
CREATE INDEX IF NOT EXISTS idx_memories_type ON memories (npc_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_vividness ON memories (npc_id, vividness DESC);

-- IVFFlat index requires data to exist; create only if table is new
-- Run manually after seeding: CREATE INDEX idx_memories_embedding ON memories USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 006: Routines
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  start_hour SMALLINT NOT NULL CHECK (start_hour >= 0 AND start_hour <= 23),
  end_hour SMALLINT NOT NULL CHECK (end_hour >= 0 AND end_hour <= 23),
  day_of_week INTEGER[] NOT NULL DEFAULT '{}',
  location VARCHAR(200) NOT NULL,
  activity VARCHAR(500) NOT NULL,
  interruptible BOOLEAN NOT NULL DEFAULT true,
  priority SMALLINT NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_routines_npc_id ON routines (npc_id);

-- 007: Goals
DO $$ BEGIN
  CREATE TYPE goal_type AS ENUM ('personal', 'professional', 'social', 'survival', 'secret');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE goal_status AS ENUM ('active', 'completed', 'failed', 'abandoned', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  goal_type goal_type NOT NULL,
  priority SMALLINT NOT NULL DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
  progress REAL NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  status goal_status NOT NULL DEFAULT 'active',
  success_criteria TEXT[] NOT NULL DEFAULT '{}',
  parent_goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_npc_id ON goals (npc_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals (npc_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals (parent_goal_id);

-- 008: Relationships
CREATE TABLE IF NOT EXISTS relationships (
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

CREATE INDEX IF NOT EXISTS idx_relationships_npc_id ON relationships (npc_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_relationships_pair ON relationships (npc_id, target_type, target_id);

-- 009: Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_project_id ON users (project_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- 010: Channel bindings
CREATE TABLE IF NOT EXISTS channel_bindings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  npc_id UUID NOT NULL REFERENCES npcs(id) ON DELETE CASCADE,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('discord', 'telegram')),
  platform_channel_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, platform, platform_channel_id)
);

CREATE INDEX IF NOT EXISTS idx_channel_bindings_lookup ON channel_bindings (platform, platform_channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_bindings_project ON channel_bindings (project_id);

-- Migration tracking (so `pnpm migrate` knows these have been applied)
CREATE TABLE IF NOT EXISTS schema_migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO schema_migrations (filename) VALUES
  ('001_extensions.sql'),
  ('002_projects.sql'),
  ('003_npcs.sql'),
  ('004_conversations.sql'),
  ('005_memories.sql'),
  ('006_routines.sql'),
  ('007_goals.sql'),
  ('008_relationships.sql'),
  ('009_users.sql'),
  ('010_channel_bindings.sql')
ON CONFLICT (filename) DO NOTHING;

COMMIT;
