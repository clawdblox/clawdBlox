import http from 'node:http';
import { env } from './config/env';
import { connectDatabase, connectRedis, gracefulShutdown } from './config/database';
import { runMigrations } from './utils/migrations';
import { createApp } from './app';
import { createWSServer } from './websocket/ws-server';
import { memoryService } from './modules/memory/memory.service';

const SHUTDOWN_TIMEOUT_MS = 10_000;

async function main(): Promise<void> {
  console.log(`🧠 MemoryWeave server starting (${env.NODE_ENV})...`);

  if (env.NODE_ENV === 'production' && !env.PLAYER_AUTH_REQUIRED) {
    console.error('❌ PLAYER_AUTH_REQUIRED must be true in production. Aborting.');
    process.exit(1);
  }

  await connectDatabase();
  await connectRedis();

  console.log('🔄 Running migrations...');
  await runMigrations();

  const app = createApp();
  const server = http.createServer(app);
  createWSServer(server);

  server.listen(env.PORT, env.HOST, () => {
    console.log(`🚀 MemoryWeave server running on http://${env.HOST}:${env.PORT}`);
  });

  memoryService.startDecayWorker();

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received, shutting down gracefully...`);
    memoryService.stopDecayWorker();
    server.close(async () => {
      await gracefulShutdown();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught exception:', err);
    shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled rejection:', reason);
    shutdown('unhandledRejection');
  });
}

main().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
