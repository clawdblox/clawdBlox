import { Pool } from 'pg';
import Redis from 'ioredis';
import { env } from './env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  min: env.PG_POOL_MIN,
  max: env.PG_POOL_MAX,
  statement_timeout: 30000, // 30s query timeout
  ...(env.PG_SSL && {
    ssl: { rejectUnauthorized: true },
  }),
});

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 10) return null;
    return Math.min(times * 200, 2000);
  },
});

export async function connectDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('✅ PostgreSQL connected');
  } finally {
    client.release();
  }
}

export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') {
    console.log('✅ Redis already connected');
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Redis connection timeout after 10s'));
    }, 10_000);

    redis.once('ready', () => {
      clearTimeout(timeout);
      console.log('✅ Redis connected');
      resolve();
    });
    redis.once('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

export async function gracefulShutdown(): Promise<void> {
  console.log('Shutting down database connections...');
  await pool.end();
  redis.disconnect();
  console.log('Database connections closed');
}
