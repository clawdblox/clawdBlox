import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // PostgreSQL
  DATABASE_URL: z.string().url(),
  PG_POOL_MIN: z.coerce.number().default(2),
  PG_POOL_MAX: z.coerce.number().default(10),
  PG_SSL: z.coerce.boolean().default(false),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Encryption
  ENCRYPTION_KEY: z.string().min(32),

  // Groq (chat)
  GROQ_API_KEY: z.string().optional(),
  GROQ_CHAT_MODEL: z.string().default('llama-3.1-70b-versatile'),
  GROQ_TRANSLATE_MODEL: z.string().default('gemma2-9b-it'),

  // OpenAI (embeddings)
  OPENAI_API_KEY: z.string().optional(),
  GROQ_EMBED_MODEL: z.string().default('text-embedding-3-small'),

  // Player auth
  PLAYER_AUTH_REQUIRED: z.coerce.boolean().default(true),
  PLAYER_TOKEN_MAX_AGE_MS: z.coerce.number().default(5 * 60 * 1000),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Rate Limiting
  RATE_LIMIT_LOGIN_PER_EMAIL: z.coerce.number().default(5),
  RATE_LIMIT_LOGIN_PER_IP: z.coerce.number().default(20),
  RATE_LIMIT_LOGIN_WINDOW_MINUTES: z.coerce.number().default(15),
  RATE_LIMIT_API_PER_KEY: z.coerce.number().default(100),
  RATE_LIMIT_API_WINDOW_MINUTES: z.coerce.number().default(1),

  // WebSocket
  WS_AUTH_TIMEOUT_MS: z.coerce.number().default(5000),
  WS_HEARTBEAT_INTERVAL_MS: z.coerce.number().default(30000),
  WS_INACTIVITY_TIMEOUT_MS: z.coerce.number().default(300000),
  WS_MAX_CONNECTIONS_PER_KEY: z.coerce.number().default(100),
  WS_MAX_CONNECTIONS_GLOBAL: z.coerce.number().default(10000),
  WS_MAX_MESSAGE_SIZE_BYTES: z.coerce.number().default(16384),
  WS_MAX_MESSAGES_PER_MINUTE: z.coerce.number().default(30),

  // Memory
  MEMORY_DECAY_INTERVAL_MINUTES: z.coerce.number().default(60),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// Known insecure default values that must never be used in production
const INSECURE_DEFAULTS = [
  'dev-access-secret-change-in-production!!',
  'dev-refresh-secret-change-in-production!',
  'dev-encryption-key-change-in-prod!!!!',
];

function loadEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(formatted, null, 2));

    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  const envData = result.success ? result.data : envSchema.parse({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://memoryweave:memoryweave_dev@localhost:5432/memoryweave',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-in-production!!',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production!',
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY || 'dev-encryption-key-change-in-prod!!!!',
  });

  if (envData.NODE_ENV !== 'development') {
    const secrets = [envData.JWT_ACCESS_SECRET, envData.JWT_REFRESH_SECRET, envData.ENCRYPTION_KEY];
    for (const secret of secrets) {
      if (INSECURE_DEFAULTS.includes(secret)) {
        console.error(`❌ Insecure default secret detected in ${envData.NODE_ENV}. Aborting.`);
        process.exit(1);
      }
    }
  }

  return envData;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
