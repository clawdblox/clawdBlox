import type { Context } from 'grammy';
import type { ApiClient } from './api-client.js';
import type { TtlCache } from './cache.js';
import { logger } from './logger.js';

interface Npc {
  npc_id: string;
  name: string;
  backstory: string;
}

const UTILITY_COMMANDS = new Set(['npcs', 'link', 'unlink', 'whoami', 'start', 'help']);
const TG_MAX_LENGTH = 4096;

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function createHandlers(api: ApiClient, npcCache: TtlCache<Npc[]>) {
  function userId(ctx: Context): string {
    return String(ctx.from!.id);
  }

  function channelId(ctx: Context): string {
    return String(ctx.chat!.id);
  }

  async function getNpcs(ctx: Context): Promise<Npc[]> {
    const cid = channelId(ctx);
    const cached = npcCache.get(cid);
    if (cached) return cached;
    const npcs = await api.listChannelNpcs(cid);
    npcCache.set(cid, npcs);
    return npcs;
  }

  function truncateBackstory(backstory: string): string {
    if (!backstory) return '';
    const sentences = backstory.split('.');
    const snippet = sentences.slice(0, 2).join('.').trim();
    if (!snippet) return '';
    const result = snippet.endsWith('.') ? snippet : snippet + '.';
    if (result.length > 200) return result.slice(0, 197) + '…';
    return result;
  }

  async function handleNpcs(ctx: Context): Promise<void> {
    let npcs: Npc[];
    try {
      npcs = await getNpcs(ctx);
    } catch (err) {
      logger.error('handleNpcs failed', { error: String(err) });
      await ctx.reply('Failed to fetch NPC list. Try again later.');
      return;
    }
    if (npcs.length === 0) {
      await ctx.reply('No NPCs are bound to this channel.');
      return;
    }
    const blocks = npcs.map((n) => {
      const cmd = n.name.split(' ')[0].toLowerCase();
      let entry = `/<b>${escapeHtml(cmd)}</b> — ${escapeHtml(n.name)}`;
      const snippet = truncateBackstory(n.backstory);
      if (snippet) entry += `\n${escapeHtml(snippet)}`;
      return entry;
    });
    const header = '<b>Available NPCs:</b>\n\n';
    const separator = '\n\n';
    const chunks: string[][] = [];
    let current: string[] = [];
    let currentLen = header.length;
    for (const block of blocks) {
      const added = current.length === 0 ? block.length : separator.length + block.length;
      if (currentLen + added > TG_MAX_LENGTH && current.length > 0) {
        chunks.push(current);
        current = [block];
        currentLen = header.length + block.length;
      } else {
        current.push(block);
        currentLen += added;
      }
    }
    if (current.length > 0) chunks.push(current);
    try {
      for (let i = 0; i < chunks.length; i++) {
        const prefix = i === 0 ? header : '';
        await ctx.reply(`${prefix}${chunks[i].join(separator)}`, { parse_mode: 'HTML' });
      }
    } catch {
      const plain = npcs.map((n) => {
        const cmd = n.name.split(' ')[0].toLowerCase();
        let line = `/${cmd} — ${n.name}`;
        const snippet = truncateBackstory(n.backstory);
        if (snippet) line += `\n${snippet}`;
        return line;
      });
      const text = `Available NPCs:\n\n${plain.join('\n\n')}`;
      for (let i = 0; i < text.length; i += TG_MAX_LENGTH) {
        await ctx.reply(text.slice(i, i + TG_MAX_LENGTH));
      }
    }
  }

  async function handleLink(ctx: Context): Promise<void> {
    try {
      const result = await api.requestLinkCode(userId(ctx));
      await ctx.reply(
        `Your link code: <code>${result.code}</code>\nExpires in ${Math.floor(result.expires_in / 60)} minutes.`,
        { parse_mode: 'HTML' },
      );
    } catch (err) {
      logger.error('handleLink failed', { error: String(err) });
      await ctx.reply('Failed to generate link code. Try again later.');
    }
  }

  async function handleUnlink(ctx: Context): Promise<void> {
    try {
      await api.unlinkPlayer(userId(ctx));
      await ctx.reply('Your identity has been unlinked.');
    } catch (err) {
      logger.error('handleUnlink failed', { error: String(err) });
      await ctx.reply('Failed to unlink. You may not have a linked identity.');
    }
  }

  async function handleWhoami(ctx: Context): Promise<void> {
    try {
      const result = await api.resolvePlayer(userId(ctx));
      if (result.canonical_id) {
        await ctx.reply(`Player ID: <code>${result.player_id}</code>`, { parse_mode: 'HTML' });
      } else {
        await ctx.reply('No linked identity found. Use /link to get a link code.');
      }
    } catch (err) {
      logger.error('handleWhoami failed', { error: String(err) });
      await ctx.reply('Failed to resolve identity. Try again later.');
    }
  }

  async function handleNpcChat(ctx: Context, commandName: string, message: string): Promise<void> {
    try {
      const npcs = await getNpcs(ctx);
      const match = npcs.find(
        (n) => n.name.split(' ')[0].toLowerCase() === commandName.toLowerCase(),
      );

      if (!match) {
        await ctx.reply('Unknown NPC. Send /npcs to see the list.');
        return;
      }

      const result = await api.chatBot(match.npc_id, userId(ctx), message);
      await ctx.reply(result.message, { reply_parameters: { message_id: ctx.message!.message_id } });
    } catch (err) {
      logger.error('handleNpcChat failed', { error: String(err), npc: commandName });
      await ctx.reply('Something went wrong. Try again later.');
    }
  }

  function handleMessage(ctx: Context): Promise<void> | undefined {
    const text = ctx.message?.text;
    if (!text || !text.startsWith('/')) return;

    // Parse /command[@botname] message
    const match = text.match(/^\/([a-zA-Z0-9_]+)(?:@\S+)?\s*(.*)/s);
    if (!match) return;

    const [, command, rest] = match;
    if (UTILITY_COMMANDS.has(command.toLowerCase())) return;

    const message = rest.trim();
    if (!message) return;

    return handleNpcChat(ctx, command, message);
  }

  return { handleNpcs, handleLink, handleUnlink, handleWhoami, handleMessage };
}
