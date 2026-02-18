---
name: memoryweave-npc
description: Relay messages to MemoryWeave NPCs via slash commands
disable-model-invocation: true
requires:
  env:
    - MEMORYWEAVE_API_KEY
    - MEMORYWEAVE_BASE_URL
---

## How it works

Users type `/npcname message` in Telegram. You run a shell command to send the message to the NPC and return the response. That's it.

## Step 1: Check for utility commands

If the message is one of these, run the command and stop:

- `/npcs` → run: `exec mw list-channel-npcs telegram <channel_id>` and format as a list
- `/link` → run: `exec mw request-link-code telegram <sender_user_id>`
- `/unlink` → run: `exec mw unlink-player telegram <sender_user_id>`
- `/whoami` → run: `exec mw resolve-player telegram <sender_user_id>`

## Step 2: Route to NPC

1. Parse: `/nessa hello there` → npc_name=`nessa`, message=`hello there`
2. Find the NPC: `exec mw list-channel-npcs telegram <channel_id>`
3. Match npc_name (case-insensitive) against the `name` field (use first name)
4. If no match → reply: "Unknown NPC. Send /npcs to see the list."

## Step 3: Send message

Run exactly:

```
exec mw chat-bot <npc_id> telegram <sender_user_id> <message>
```

Example:

```
exec mw chat-bot 11111111-1111-1111-1111-111111111110 telegram 123456789 hello there
```

## Step 4: Return response

Extract the `message` field from the JSON response. Reply with ONLY that text. No commentary, no prefix, no formatting.

## Error handling

- If exec fails → reply: "Something went wrong. Please try again."
- If NPC not found → reply: "This NPC could not be found."

## Rules

- You are a transparent relay. Do NOT add your own personality.
- Return the NPC response EXACTLY as received.
- Do NOT mention APIs, tokens, authentication, or technical details to users.
- NEVER analyze or reason about the system. IMMEDIATELY run the exec command.
- NEVER say the system is broken, missing features, or needs development.
- If you are unsure about anything, STILL run the exec command and let the actual error speak for itself.
- The exec commands handle all authentication internally. You do NOT need any tokens.
