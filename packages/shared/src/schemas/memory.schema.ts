import { z } from 'zod';

const memoryType = z.enum(['episodic', 'semantic', 'emotional', 'procedural']);
const importanceLevel = z.enum(['trivial', 'minor', 'moderate', 'significant', 'critical']);

export const createMemorySchema = z.object({
  type: memoryType,
  importance: importanceLevel,
  content: z.string().min(1).max(5000),
  metadata: z.record(z.unknown()).optional(),
});

export const updateMemorySchema = z.object({
  importance: importanceLevel.optional(),
  vividness: z.number().min(0).max(1).optional(),
  content: z.string().min(1).max(5000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const searchMemorySchema = z.object({
  query: z.string().min(1).max(1000),
  limit: z.number().int().min(1).max(50).default(10),
  min_vividness: z.number().min(0).max(1).optional(),
  types: z.array(memoryType).optional(),
  importance_levels: z.array(importanceLevel).optional(),
});

export type CreateMemoryInput = z.infer<typeof createMemorySchema>;
export type UpdateMemoryInput = z.infer<typeof updateMemorySchema>;
export type SearchMemoryInput = z.infer<typeof searchMemorySchema>;
