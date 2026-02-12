CREATE TYPE goal_type AS ENUM ('personal', 'professional', 'social', 'survival', 'secret');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'failed', 'abandoned', 'paused');

CREATE TABLE goals (
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

CREATE INDEX idx_goals_npc_id ON goals (npc_id);
CREATE INDEX idx_goals_status ON goals (npc_id, status);
CREATE INDEX idx_goals_parent ON goals (parent_goal_id);
