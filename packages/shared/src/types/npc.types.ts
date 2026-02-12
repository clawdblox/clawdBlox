import type { OceanTrait } from '../constants/ocean';

export interface OceanPersonality {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  traits?: string[];
  values?: string[];
  fears?: string[];
  desires?: string[];
}

export interface SpeakingStyle {
  vocabulary_level: 'simple' | 'moderate' | 'advanced' | 'archaic';
  formality: 'casual' | 'neutral' | 'formal';
  humor: 'none' | 'subtle' | 'frequent' | 'sarcastic';
  verbosity: 'terse' | 'concise' | 'normal' | 'verbose';
  quirks: string[];
  catchphrases: string[];
  speech_patterns?: string[];
  accent?: string;
}

export interface NPC {
  id: string;
  project_id: string;
  name: string;
  personality: OceanPersonality;
  speaking_style: SpeakingStyle;
  backstory: string;
  system_prompt: string;
  mood: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNPCInput {
  name: string;
  personality: OceanPersonality;
  speaking_style: SpeakingStyle;
  backstory: string;
  system_prompt?: string;
  mood?: string;
}

export interface UpdateNPCInput {
  name?: string;
  personality?: Partial<OceanPersonality>;
  speaking_style?: Partial<SpeakingStyle>;
  backstory?: string;
  system_prompt?: string;
  mood?: string;
  is_active?: boolean;
}

export interface GenerateNPCInput {
  description: string;
  traits?: Partial<Record<OceanTrait, number>>;
  setting?: string;
}
