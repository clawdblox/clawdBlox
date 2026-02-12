import { z } from 'zod';

export const createRoutineSchema = z.object({
  name: z.string().min(1).max(100),
  start_hour: z.number().int().min(0).max(23),
  end_hour: z.number().int().min(0).max(23),
  day_of_week: z.array(z.number().int().min(0).max(6)).min(1).max(7),
  location: z.string().min(1).max(200),
  activity: z.string().min(1).max(500),
  interruptible: z.boolean().default(true),
  priority: z.number().int().min(1).max(10).default(5),
});

export const updateRoutineSchema = createRoutineSchema.partial();

export const createGoalSchema = z.object({
  title: z.string().min(1).max(200),
  goal_type: z.enum(['personal', 'professional', 'social', 'survival', 'secret']),
  priority: z.number().int().min(1).max(10).default(5),
  success_criteria: z.array(z.string().min(1).max(1000)).min(1).max(50),
  parent_goal_id: z.string().uuid().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  priority: z.number().int().min(1).max(10).optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.enum(['active', 'completed', 'failed', 'abandoned', 'paused']).optional(),
  success_criteria: z.array(z.string().min(1).max(1000)).min(1).optional(),
});

export const createRelationshipSchema = z.object({
  target_type: z.enum(['player', 'npc']),
  target_id: z.string().min(1).max(100),
  affinity: z.number().min(-1).max(1).default(0),
  trust: z.number().min(0).max(1).default(0.5),
});

export const updateRelationshipSchema = z.object({
  affinity: z.number().min(-1).max(1).optional(),
  trust: z.number().min(0).max(1).optional(),
  familiarity: z.number().min(0).max(1).optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type CreateRelationshipInput = z.infer<typeof createRelationshipSchema>;
export type UpdateRelationshipInput = z.infer<typeof updateRelationshipSchema>;
