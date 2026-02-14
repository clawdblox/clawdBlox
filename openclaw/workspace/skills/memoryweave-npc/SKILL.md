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

## How it works

The NPC linked to each channel is resolved dynamically via the MemoryWeave API. The channel ID and platform are available from the message context.

## Steps

1. Extract the channel ID and platform (discord or telegram) from the incoming message context
2. Resolve which NPC is bound to this channel:
   ```
   exec mw resolve-channel <platform> <channel_id>
   ```
3. If no NPC is bound (error or empty response), reply with: "No NPC is linked to this channel. An admin can bind one using the admin assistant."
4. Extract the `npc_id` from the JSON response
5. Check the `is_active` field in the response. If `is_active` is `false`, reply with: "This NPC is currently unavailable." and stop processing.
6. Extract the sender's platform user ID from the incoming message context
7. Call the MemoryWeave bot chat endpoint:
   ```
   exec mw chat-bot <npc_id> <platform> <sender_user_id> "<message>"
   ```
8. Parse the JSON response and extract the `message` field
9. Check the response length against the platform limit:
   - Discord: 2000 characters
   - Telegram: 4096 characters
   - If the message exceeds the limit, truncate it and append "..." to indicate the response was cut short
10. Reply with ONLY the NPC's message — no additional commentary, no formatting, no prefixes

## Critical Rules

- You are a transparent message relay — do NOT add your own personality or commentary
- Return the NPC's response EXACTLY as-is from the `message` field in the API response
- Do NOT prefix the response with the NPC's name or any label
- Do NOT wrap the response in quotes or code blocks
- If the resolve-channel call fails, respond with: "No NPC is linked to this channel. An admin can bind one using the admin assistant."
- If the chat-bot call fails, categorize the error and respond accordingly:
  - **Network error / timeout**: "The service is temporarily unavailable. Please try again in a moment."
  - **404 (NPC not found)**: "This NPC could not be found. It may have been deleted."
  - **429 (rate limited)**: "Too many requests — please slow down and try again shortly."
  - **500 (server error)**: "Something went wrong on our end. Please try again later."
  - **Other errors**: "Sorry, I couldn't process that message. Please try again."
- Do NOT reveal that you are relaying messages through an API
- The NPC has its own personality, memories, and conversation history — do not interfere with them
