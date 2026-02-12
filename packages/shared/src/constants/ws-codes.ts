export const WS_CLOSE_CODES = {
  AUTH_FAILED: 4000,
  INACTIVITY_TIMEOUT: 4001,
  CONNECTION_LIMIT: 4002,
  RATE_LIMITED: 4003,
  INVALID_FORMAT: 4004,
  SERVER_SHUTDOWN: 4005,
} as const;

export const WS_CLOSE_REASONS: Record<number, string> = {
  [WS_CLOSE_CODES.AUTH_FAILED]: 'Authentication failed or timed out',
  [WS_CLOSE_CODES.INACTIVITY_TIMEOUT]: 'Inactivity timeout',
  [WS_CLOSE_CODES.CONNECTION_LIMIT]: 'Connection limit reached',
  [WS_CLOSE_CODES.RATE_LIMITED]: 'Rate limit exceeded',
  [WS_CLOSE_CODES.INVALID_FORMAT]: 'Invalid message format',
  [WS_CLOSE_CODES.SERVER_SHUTDOWN]: 'Server shutting down',
};
