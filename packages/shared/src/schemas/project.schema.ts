import { z } from 'zod';

export const projectSettingsSchema = z.object({
  groq_chat_model: z.string().optional(),
  groq_embed_model: z.string().optional(),
  max_npcs: z.number().int().min(1).max(10000).optional(),
  max_memories_per_npc: z.number().int().min(100).max(100000).optional(),
  memory_decay_enabled: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  groq_api_key: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  groq_api_key: z.string().optional(),
  settings: projectSettingsSchema.optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
