import { z } from 'zod';
import { ROLES } from '../constants/roles';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  display_name: z.string().trim().min(1).max(100),
  role: z.enum(ROLES),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional(),
  display_name: z.string().trim().min(1).max(100).optional(),
  role: z.enum(ROLES).optional(),
  is_active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const setupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  display_name: z.string().trim().min(1).max(100),
  project_name: z.string().trim().min(1).max(200),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
