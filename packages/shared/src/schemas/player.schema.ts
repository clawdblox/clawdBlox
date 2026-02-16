import { z } from 'zod';

const platformField = z.enum(['discord', 'telegram', 'roblox', 'web']);

export const requestLinkCodeSchema = z.object({
  platform: platformField,
  platform_user_id: z.string().min(1).max(255),
});

export const verifyLinkSchema = z.object({
  code: z.string().length(6),
  platform: platformField,
  platform_user_id: z.string().min(1).max(255),
});

export const resolvePlayerQuery = z.object({
  platform: platformField,
  platform_user_id: z.string().min(1).max(255),
});

export const unlinkPlayerSchema = z.object({
  platform: platformField,
  platform_user_id: z.string().min(1).max(255),
});

export type RequestLinkCodeInput = z.infer<typeof requestLinkCodeSchema>;
export type VerifyLinkInput = z.infer<typeof verifyLinkSchema>;
export type ResolvePlayerQuery = z.infer<typeof resolvePlayerQuery>;
export type UnlinkPlayerInput = z.infer<typeof unlinkPlayerSchema>;
