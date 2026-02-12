import { z } from 'zod';

export const uuidParam = z.object({
  id: z.string().uuid('Invalid UUID'),
});

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export const errorResponse = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type PaginationQuery = z.infer<typeof paginationQuery>;
export type ErrorResponse = z.infer<typeof errorResponse>;
