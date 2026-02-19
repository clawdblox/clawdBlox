import { Bot } from 'grammy';
import { loadConfig } from './config.js';
import { logger, setLogLevel } from './logger.js';
import { ApiClient } from './api-client.js';
import { TtlCache } from './cache.js';
import { createHandlers } from './handlers.js';

const config = loadConfig();
setLogLevel(config.LOG_LEVEL);

const api = new ApiClient(config.MEMORYWEAVE_BASE_URL, config.MEMORYWEAVE_API_KEY);
const npcCache = new TtlCache<{ npc_id: string; name: string }[]>(config.NPC_CACHE_TTL_MS);
const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

const { handleNpcs, handleLink, handleUnlink, handleWhoami, handleMessage } =
  createHandlers(api, npcCache);

bot.command('npcs', (ctx) => handleNpcs(ctx));
bot.command('link', (ctx) => handleLink(ctx));
bot.command('unlink', (ctx) => handleUnlink(ctx));
bot.command('whoami', (ctx) => handleWhoami(ctx));

bot.on('message:text', (ctx) => handleMessage(ctx));

bot.catch((err) => {
  logger.error('Unhandled bot error', { error: String(err.error) });
});

function shutdown(signal: string) {
  logger.info(`Received ${signal}, shutting down...`);
  bot.stop();
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('Bot relay starting...');
bot.start({ drop_pending_updates: true }).then(() => {
  logger.info('Bot relay stopped.');
});
logger.info('Bot relay started.');
