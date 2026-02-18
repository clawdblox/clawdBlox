---
name: memoryweave-npc
description: Relay messages to a MemoryWeave NPC and return its in-character response. Used in dedicated NPC Discord/Telegram channels.
disable-model-invocation: true
requires:
  env:
    - MEMORYWEAVE_API_KEY
    - MEMORYWEAVE_BASE_URL
---

## When to use

This skill is activated in NPC channels (Discord or Telegram). When a user sends a message, you MUST resolve which NPC is bound to this channel, relay the message to the MemoryWeave chat endpoint, and return the NPC's response EXACTLY as received.

## Steps

### 0. Check for utility commands

Before any NPC routing, check if the message is a utility command:

- `/link` → See "Player Identity Commands" section below
- `/unlink` → See "Player Identity Commands" section below
- `/whoami` → See "Player Identity Commands" section below
- `/npcs` → See "NPC Discovery Commands" section below

If the message matches one of these, handle it and stop. Do NOT pass utility commands to NPCs.

### 1. Resolve the bound NPC

Extract the channel ID and platform (discord or telegram) from the incoming message context.

**Multi-NPC routing (Telegram with `npcRouting: "slash-command"`):**

If the channel config has `npcRouting: "slash-command"`, messages MUST start with `/npcname` to be routed:
1. Parse the message: if it starts with `/`, extract `npc_name` (the word after `/`) and the rest as `message`
   - `/elena Bonjour!` → npc_name=`elena`, message=`Bonjour!`
   - Message without `/` prefix → ignore entirely (do not respond)
2. List available NPCs: `exec mw list-channel-npcs <platform> <channel_id>`
3. Match `npc_name` against the `name` field (case-insensitive)
4. If no match → reply with the same formatted list as `/npcs` (see "NPC Discovery Commands"), prefixed with: "🤔 Unknown NPC. Here's who you can talk to:"
5. Use the matched `npc_id` for the chat call

**Single-NPC routing (default — Discord and Telegram without `npcRouting`):**

Resolve which NPC is bound to this channel:
```
exec mw resolve-channel <platform> <channel_id>
```

- If no NPC is bound (error or empty response), reply with: "No NPC is linked to this channel. An admin can bind one using the admin assistant."
- Extract the `npc_id` from the JSON response
- If `is_active` is `false`, reply with: "This NPC is currently unavailable." and stop processing

### 2. Build and send the message

Extract the sender's platform user ID from the incoming message context.

If the incoming message is a reply or is in a thread, extract the parent message content and prepend it as context: `"[Replying to: <parent_message>] <message>"`. This helps the NPC understand conversational context across multiple users.

Call the chat endpoint:
```
exec mw chat-bot <npc_id> <platform> <sender_user_id> "<message>"
```

### 3. Deliver the response

Parse the JSON response and extract the `message` field.

Check the response length against the platform limit:
- Discord: 2000 characters
- Telegram: 4096 characters

If the message exceeds the limit, split at sentence boundaries (`. ` or `\n\n`) to maintain readability. Each chunk must be within the platform's character limit. Send each chunk as a separate message with a short delay. Only as a last resort (no suitable split point found), truncate and append "...".

Reply with ONLY the NPC's message — no additional commentary, no formatting, no prefixes.

## NPC Discovery Commands

### `/npcs`
1. Call: `exec mw list-channel-npcs telegram <channel_id>` (or appropriate platform)
2. If no NPCs are bound, reply: "No NPCs available in this channel yet."
3. Format the response as a clean, scannable list using this exact template:

**For Telegram** (use HTML formatting):

```
🏰 <b>Villagers of Millhaven</b>

/<first_name> — <full_name> · <one_word_role>
/<first_name> — <full_name> · <one_word_role>
...

💬 Type <code>/name message</code> to talk to someone!
```

Rules for building the list:
- Use the **most distinctive single name** as the command (not titles like "Old", "Dame", "Brother", "Father" — use the proper name instead: `alaric`, `helga`, `marcus`, `cedric`)
- The one-word role should be the NPC's core identity (e.g. Sage, Knight, Baker, Bard, Miner, Healer, Merchant, Spy, Ranger, Seer, Butcher, etc.)
- Sort alphabetically by command name
- Keep it compact — no backstory, no descriptions, just name + role

**For Discord** (use markdown):
```
🏰 **Villagers of Millhaven**

`/name` — Full Name · Role
...

💬 Type `/name message` to talk to someone!
```

### Reminder behavior (multi-NPC slash-command mode only)

When a user sends a message **without** a `/` prefix in a channel with `npcRouting: "slash-command"`:
- Do NOT ignore silently. Instead, reply with a short nudge:
  "💬 To talk to an NPC, type `/name message` — e.g. `/lyra sing me a song!`\nSend `/npcs` to see everyone."
- Keep it to 1-2 lines maximum. Do not list all NPCs in the reminder.

## Player Identity Commands

These commands allow players to link their identities across platforms (Roblox, Discord, Telegram).

### `/link`
1. Call: `exec mw request-link-code <platform> <sender_user_id>`
2. Extract `code` and `expires_in` from the response
3. Reply with: "Your link code: **<CODE>**. Enter it in Roblox within the next 5 minutes."

### `/unlink`
1. Call: `exec mw unlink-player <platform> <sender_user_id>`
2. On success: reply with "Your account has been unlinked from the cross-platform identity."
3. On error (404): reply with "No linked identity found for your account."

### `/whoami`
1. Call: `exec mw resolve-player <platform> <sender_user_id>`
2. On success: extract `display_name` and `links` array, reply with:
   "Identity: **<display_name>** — Linked platforms: discord, telegram, roblox" (list actual linked platforms)
3. On error (404): reply with "No cross-platform identity found. Use /link to create one."

## Critical Rules

- You are a transparent message relay — do NOT add your own personality or commentary
- Return the NPC's response EXACTLY as-is from the `message` field in the API response
- Do NOT prefix the response with the NPC's name or any label
- Do NOT wrap the response in quotes or code blocks
- Do NOT reveal that you are relaying messages through an API
- The NPC has its own personality, memories, and conversation history — do not interfere with them
- If the chat-bot call fails, categorize the error and respond accordingly:
  - **Timeout (30s+)**: "The NPC is thinking... please try again in a moment."
  - **Network error**: "The service is temporarily unavailable. Please try again in a moment."
  - **404 (NPC not found)**: "This NPC could not be found. It may have been deleted."
  - **429 (rate limited)**: "Too many requests — please slow down and try again shortly."
  - **500 (server error)**: "Something went wrong on our end. Please try again later."
  - **Other errors**: "Sorry, I couldn't process that message. Please try again."

## Platform-Specific Formatting

When relaying the NPC's response, apply platform-appropriate formatting:

### Discord
- Preserve any markdown in the NPC's response as-is (Discord renders markdown natively)
- Bold (`**text**`), italic (`*text*`), and code blocks all work directly

### Telegram
- Convert markdown to Telegram-compatible formatting:
  - `**bold**` → `<b>bold</b>`
  - `*italic*` → `<i>italic</i>`
  - `` `code` `` → `<code>code</code>`
  - Code blocks → `<pre>code</pre>`
- Strip any formatting that Telegram does not support (e.g., strikethrough, spoiler tags)

### General
- Do not add any formatting that the NPC did not include in its response
- If in doubt about formatting support, send plain text
