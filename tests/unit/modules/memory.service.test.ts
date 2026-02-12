import { describe, it, expect } from 'vitest';
import { DECAY_RATES, VIVIDNESS_MIN, VIVIDNESS_MAX, VIVIDNESS_DEFAULT } from '@clawdblox/memoryweave-shared';
import { createMemorySchema, searchMemorySchema } from '@clawdblox/memoryweave-shared';

describe('Memory Service', () => {
  describe('Decay Constants', () => {
    it('should have correct decay rates', () => {
      expect(DECAY_RATES.trivial).toBe(0.10);
      expect(DECAY_RATES.minor).toBe(0.05);
      expect(DECAY_RATES.moderate).toBe(0.02);
      expect(DECAY_RATES.significant).toBe(0.01);
      expect(DECAY_RATES.critical).toBe(0.005);
    });

    it('should have higher decay for trivial than critical', () => {
      expect(DECAY_RATES.trivial).toBeGreaterThan(DECAY_RATES.critical);
      expect(DECAY_RATES.minor).toBeGreaterThan(DECAY_RATES.significant);
    });

    it('should have valid vividness bounds', () => {
      expect(VIVIDNESS_MIN).toBe(0);
      expect(VIVIDNESS_MAX).toBe(1);
      expect(VIVIDNESS_DEFAULT).toBe(1);
    });
  });

  describe('Memory Schema Validation', () => {
    it('should accept valid memory', () => {
      const result = createMemorySchema.safeParse({
        type: 'episodic',
        importance: 'moderate',
        content: 'The player helped me find my lost cat.',
      });
      expect(result.success).toBe(true);
    });

    it('should accept all memory types', () => {
      for (const type of ['episodic', 'semantic', 'emotional', 'procedural']) {
        const result = createMemorySchema.safeParse({
          type,
          importance: 'moderate',
          content: 'Test memory',
        });
        expect(result.success).toBe(true);
      }
    });

    it('should accept all importance levels', () => {
      for (const importance of ['trivial', 'minor', 'moderate', 'significant', 'critical']) {
        const result = createMemorySchema.safeParse({
          type: 'episodic',
          importance,
          content: 'Test memory',
        });
        expect(result.success).toBe(true);
      }
    });

    it('should reject invalid type', () => {
      const result = createMemorySchema.safeParse({
        type: 'invalid',
        importance: 'moderate',
        content: 'Test',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const result = createMemorySchema.safeParse({
        type: 'episodic',
        importance: 'moderate',
        content: '',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Search Schema Validation', () => {
    it('should accept valid search', () => {
      const result = searchMemorySchema.safeParse({
        query: 'lost cat',
        limit: 5,
      });
      expect(result.success).toBe(true);
    });

    it('should have default limit of 10', () => {
      const result = searchMemorySchema.safeParse({ query: 'test' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
      }
    });

    it('should reject limit > 50', () => {
      const result = searchMemorySchema.safeParse({ query: 'test', limit: 100 });
      expect(result.success).toBe(false);
    });

    it('should accept optional filters', () => {
      const result = searchMemorySchema.safeParse({
        query: 'test',
        min_vividness: 0.5,
        types: ['episodic', 'emotional'],
        importance_levels: ['significant', 'critical'],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Decay Simulation', () => {
    it('should decay trivial memories faster than critical', () => {
      let trivialVividness = 1;
      let criticalVividness = 1;

      // Simulate 10 days of decay
      for (let day = 0; day < 10; day++) {
        trivialVividness = Math.max(0, trivialVividness - DECAY_RATES.trivial);
        criticalVividness = Math.max(0, criticalVividness - DECAY_RATES.critical);
      }

      expect(trivialVividness).toBe(0); // Should be forgotten
      expect(criticalVividness).toBeGreaterThan(0.9); // Should still be vivid
    });

    it('should never go below 0', () => {
      let vividness = 0.01;
      vividness = Math.max(0, vividness - DECAY_RATES.trivial);
      expect(vividness).toBe(0);
    });
  });
});
