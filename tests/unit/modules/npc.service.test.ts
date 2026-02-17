import { describe, it, expect } from 'vitest';
import { OCEAN_TRAITS, OCEAN_RANGE, OCEAN_DEFAULTS, OCEAN_LABELS } from '@clawdblox/memoryweave-shared';
import { createNpcSchema, oceanPersonalitySchema, generateNpcSchema } from '@clawdblox/memoryweave-shared';

describe('NPC Service - OCEAN Validation', () => {
  describe('OCEAN Constants', () => {
    it('should have 5 traits', () => {
      expect(OCEAN_TRAITS).toHaveLength(5);
      expect(OCEAN_TRAITS).toContain('openness');
      expect(OCEAN_TRAITS).toContain('conscientiousness');
      expect(OCEAN_TRAITS).toContain('extraversion');
      expect(OCEAN_TRAITS).toContain('agreeableness');
      expect(OCEAN_TRAITS).toContain('neuroticism');
    });

    it('should have range 0-1', () => {
      expect(OCEAN_RANGE.min).toBe(0);
      expect(OCEAN_RANGE.max).toBe(1);
    });

    it('should have defaults of 0.5', () => {
      for (const trait of OCEAN_TRAITS) {
        expect(OCEAN_DEFAULTS[trait]).toBe(0.5);
      }
    });

    it('should have labels for all traits', () => {
      for (const trait of OCEAN_TRAITS) {
        expect(OCEAN_LABELS[trait]).toBeDefined();
        expect(OCEAN_LABELS[trait].low).toBeTruthy();
        expect(OCEAN_LABELS[trait].high).toBeTruthy();
      }
    });
  });

  describe('OCEAN Schema Validation', () => {
    it('should accept valid personality', () => {
      const result = oceanPersonalitySchema.safeParse({
        openness: 0.8,
        conscientiousness: 0.5,
        extraversion: 0.3,
        agreeableness: 0.9,
        neuroticism: 0.1,
      });
      expect(result.success).toBe(true);
    });

    it('should accept boundary values (0 and 1)', () => {
      const result = oceanPersonalitySchema.safeParse({
        openness: 0,
        conscientiousness: 1,
        extraversion: 0,
        agreeableness: 1,
        neuroticism: 0,
      });
      expect(result.success).toBe(true);
    });

    it('should reject values > 1', () => {
      const result = oceanPersonalitySchema.safeParse({
        openness: 1.5,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject values < 0', () => {
      const result = oceanPersonalitySchema.safeParse({
        openness: -0.1,
        conscientiousness: 0.5,
        extraversion: 0.5,
        agreeableness: 0.5,
        neuroticism: 0.5,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing traits', () => {
      const result = oceanPersonalitySchema.safeParse({
        openness: 0.5,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Create NPC Schema', () => {
    const validNpc = {
      name: 'Eldric the Wise',
      personality: {
        openness: 0.9,
        conscientiousness: 0.7,
        extraversion: 0.3,
        agreeableness: 0.8,
        neuroticism: 0.2,
      },
      speaking_style: {
        vocabulary_level: 'advanced' as const,
        formality: 'formal' as const,
        humor: 'subtle' as const,
        verbosity: 'verbose' as const,
        quirks: ['strokes beard'],
        catchphrases: ['Wisdom comes to those who wait'],
      },
      backstory: 'An ancient wizard who has seen centuries pass.',
    };

    it('should accept valid NPC', () => {
      const result = createNpcSchema.safeParse(validNpc);
      expect(result.success).toBe(true);
    });

    it('should reject empty name', () => {
      const result = createNpcSchema.safeParse({ ...validNpc, name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject name > 100 chars', () => {
      const result = createNpcSchema.safeParse({ ...validNpc, name: 'A'.repeat(101) });
      expect(result.success).toBe(false);
    });

    it('should reject empty backstory', () => {
      const result = createNpcSchema.safeParse({ ...validNpc, backstory: '' });
      expect(result.success).toBe(false);
    });
  });

  describe('Generate NPC Schema', () => {
    it('should accept description only', () => {
      const result = generateNpcSchema.safeParse({
        description: 'A mysterious wandering merchant',
      });
      expect(result.success).toBe(true);
    });

    it('should accept description with optional name', () => {
      const result = generateNpcSchema.safeParse({
        description: 'A mysterious wandering merchant',
        name: 'Shadowbane',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Shadowbane');
      }
    });

    it('should trim whitespace from name', () => {
      const result = generateNpcSchema.safeParse({
        description: 'A mysterious wandering merchant',
        name: '  Shadowbane  ',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Shadowbane');
      }
    });

    it('should reject empty string name', () => {
      const result = generateNpcSchema.safeParse({
        description: 'A mysterious wandering merchant',
        name: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject whitespace-only name', () => {
      const result = generateNpcSchema.safeParse({
        description: 'A mysterious wandering merchant',
        name: '   ',
      });
      expect(result.success).toBe(false);
    });

    it('should reject name longer than 100 characters', () => {
      const result = generateNpcSchema.safeParse({
        description: 'A mysterious wandering merchant',
        name: 'A'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('should accept name with setting and traits', () => {
      const result = generateNpcSchema.safeParse({
        description: 'A mysterious wandering merchant',
        name: 'Eldric',
        setting: 'Medieval fantasy village',
        traits: { openness: 0.8, extraversion: 0.3 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Eldric');
        expect(result.data.setting).toBe('Medieval fantasy village');
      }
    });
  });
});
