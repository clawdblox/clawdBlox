import { z } from 'zod';

export const chatMessageSchema = z.object({
  player_id: z.string().min(1).max(100),
  player_token: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;

export const botChatMessageSchema = z.object({
  platform: z.enum(['discord', 'telegram', 'web']),
  platform_user_id: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
});

export type BotChatMessageInput = z.infer<typeof botChatMessageSchema>;
