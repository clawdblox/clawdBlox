CREATE TABLE routines (
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

CREATE INDEX idx_routines_npc_id ON routines (npc_id);
