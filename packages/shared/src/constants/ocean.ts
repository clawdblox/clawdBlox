export const OCEAN_TRAITS = ['openness', 'conscientiousness', 'extraversion', 'agreeableness', 'neuroticism'] as const;

export type OceanTrait = typeof OCEAN_TRAITS[number];

export const OCEAN_RANGE = { min: 0, max: 1 } as const;

export const OCEAN_LABELS: Record<OceanTrait, { low: string; high: string }> = {
  openness: { low: 'Conventional, practical', high: 'Curious, creative, open to new experiences' },
  conscientiousness: { low: 'Spontaneous, flexible', high: 'Organized, disciplined, reliable' },
  extraversion: { low: 'Reserved, solitary', high: 'Outgoing, energetic, talkative' },
  agreeableness: { low: 'Competitive, challenging', high: 'Cooperative, trusting, helpful' },
  neuroticism: { low: 'Calm, emotionally stable', high: 'Anxious, moody, easily stressed' },
};

export const OCEAN_DEFAULTS: Record<OceanTrait, number> = {
  openness: 0.5,
  conscientiousness: 0.5,
  extraversion: 0.5,
  agreeableness: 0.5,
  neuroticism: 0.5,
};
