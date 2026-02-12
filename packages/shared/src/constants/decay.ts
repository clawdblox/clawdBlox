import type { ImportanceLevel } from '../types/memory.types';

/** Fraction of vividness lost per day, by importance level */
export const DECAY_RATES: Record<ImportanceLevel, number> = {
  trivial: 0.10,
  minor: 0.05,
  moderate: 0.02,
  significant: 0.01,
  critical: 0.005,
};

export const VIVIDNESS_MIN = 0;
export const VIVIDNESS_MAX = 1;
export const VIVIDNESS_DEFAULT = 1;
