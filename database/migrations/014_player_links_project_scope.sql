-- Add project_id to player_links (derived from player_identities)
ALTER TABLE player_links ADD COLUMN project_id UUID;

UPDATE player_links pl
  SET project_id = pi.project_id
  FROM player_identities pi
  WHERE pl.player_id = pi.id;

ALTER TABLE player_links ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE player_links ADD CONSTRAINT fk_player_links_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

-- Replace global unique with per-project unique
ALTER TABLE player_links DROP CONSTRAINT player_links_platform_platform_user_id_key;
ALTER TABLE player_links ADD CONSTRAINT player_links_project_platform_unique
  UNIQUE(project_id, platform, platform_user_id);

-- Update index
DROP INDEX idx_player_links_lookup;
CREATE INDEX idx_player_links_lookup ON player_links (project_id, platform, platform_user_id);
