-- Rename channel_id to platform_channel_id for consistency with frontend conventions
ALTER TABLE channel_bindings RENAME COLUMN channel_id TO platform_channel_id;

-- Recreate the unique constraint and indexes with the new column name
ALTER TABLE channel_bindings DROP CONSTRAINT IF EXISTS channel_bindings_project_id_platform_channel_id_key;
ALTER TABLE channel_bindings ADD CONSTRAINT channel_bindings_project_id_platform_platform_channel_id_key
  UNIQUE (project_id, platform, platform_channel_id);

DROP INDEX IF EXISTS idx_channel_bindings_lookup;
CREATE INDEX idx_channel_bindings_lookup ON channel_bindings (platform, platform_channel_id);
