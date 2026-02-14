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

### 1. Resolve the bound NPC

Extract the channel ID and platform (discord or telegram) from the incoming message context, then resolve which NPC is bound:
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
