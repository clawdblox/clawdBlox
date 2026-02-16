-- Allow multiple NPCs per channel (was 1-to-1, now many-to-1)
ALTER TABLE channel_bindings
  DROP CONSTRAINT channel_bindings_project_id_platform_platform_channel_id_key;

-- Prevent duplicate: same NPC bound twice to the same channel
ALTER TABLE channel_bindings
  ADD CONSTRAINT channel_bindings_unique_npc_channel
  UNIQUE(project_id, platform, platform_channel_id, npc_id);
