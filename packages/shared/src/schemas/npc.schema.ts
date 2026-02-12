import { z } from 'zod';

const oceanTrait = z.number().min(0).max(1);

export const oceanPersonalitySchema = z.object({
  openness: oceanTrait,
  conscientiousness: oceanTrait,
  extraversion: oceanTrait,
  agreeableness: oceanTrait,
  neuroticism: oceanTrait,
  traits: z.array(z.string().max(200)).max(20).optional(),
  values: z.array(z.string().max(200)).max(20).optional(),
  fears: z.array(z.string().max(200)).max(20).optional(),
  desires: z.array(z.string().max(200)).max(20).optional(),
});

export const speakingStyleSchema = z.object({
  vocabulary_level: z.enum(['simple', 'moderate', 'advanced', 'archaic']),
  formality: z.enum(['casual', 'neutral', 'formal']),
  humor: z.enum(['none', 'subtle', 'frequent', 'sarcastic']),
  verbosity: z.enum(['terse', 'concise', 'normal', 'verbose']),
  quirks: z.array(z.string().max(200)).max(20).default([]),
  catchphrases: z.array(z.string().max(200)).max(20).default([]),
  speech_patterns: z.array(z.string().max(200)).max(20).optional(),
  accent: z.string().max(100).optional(),
});

export const createNpcSchema = z.object({
  name: z.string().min(1).max(100),
  personality: oceanPersonalitySchema,
  speaking_style: speakingStyleSchema,
  backstory: z.string().min(1).max(5000),
  system_prompt: z.string().max(2000).optional(),
  mood: z.string().max(50).optional(),
});

export const updateNpcSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  personality: oceanPersonalitySchema.partial().optional(),
  speaking_style: speakingStyleSchema.partial().optional(),
  backstory: z.string().min(1).max(5000).optional(),
  system_prompt: z.string().max(2000).optional(),
  mood: z.string().max(50).optional(),
  is_active: z.boolean().optional(),
});

export const generateNpcSchema = z.object({
  description: z.string().min(10).max(1000),
  traits: oceanPersonalitySchema.partial().optional(),
  setting: z.string().max(500).optional(),
});

const channelFields = {
  platform: z.enum(['discord', 'telegram']),
  platform_channel_id: z.string().min(1).max(255),
};

export const bindChannelSchema = z.object({
  npc_id: z.string().uuid(),
  ...channelFields,
});

export const unbindChannelSchema = z.object(channelFields);

export const resolveChannelQuery = z.object(channelFields);

export type CreateNpcInput = z.infer<typeof createNpcSchema>;
export type UpdateNpcInput = z.infer<typeof updateNpcSchema>;
export type GenerateNpcInput = z.infer<typeof generateNpcSchema>;
export type BindChannelInput = z.infer<typeof bindChannelSchema>;
export type UnbindChannelInput = z.infer<typeof unbindChannelSchema>;
export type ResolveChannelQuery = z.infer<typeof resolveChannelQuery>;
