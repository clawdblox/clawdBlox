---
name: memoryweave-admin
description: Manage MemoryWeave NPCs, memories, conversations, routines, goals, and relationships via the MemoryWeave API
requires:
  env:
    - MEMORYWEAVE_API_KEY
    - MEMORYWEAVE_BASE_URL
---

## When to use

Use this skill when the user wants to manage their MemoryWeave game NPCs. This includes:
- Listing, creating, updating, deleting NPCs
- Generating NPCs from a description using AI
- Viewing conversations and message history
- Searching NPC memories
- Managing routines, goals, and relationships
- Binding/unbinding NPCs to Discord or Telegram channels
- Viewing project statistics

## Setup

The `mw` CLI script is available in the workspace scripts directory. All commands require `MEMORYWEAVE_API_KEY` and `MEMORYWEAVE_BASE_URL` environment variables.

## Commands Reference

### NPCs

**List all NPCs:**
```
exec mw list-npcs
exec mw list-npcs 2 10    # page 2, 10 per page
```

**Get NPC details:**
```
exec mw get-npc <npc_id>
```

**Create an NPC manually:**
```
exec mw create-npc '{"name":"Elena","personality":{"openness":0.8,"conscientiousness":0.6,"extraversion":0.4,"agreeableness":0.7,"neuroticism":0.3},"speaking_style":{"tone":"warm","vocabulary":"educated","quirks":["uses metaphors"]},"backstory":"Elena grew up in a small coastal village..."}'
```

**Generate an NPC with AI (from a description):**
```
exec mw generate-npc '{"description":"A grumpy dwarf blacksmith who secretly writes poetry","traits":["stubborn","creative"],"setting":"fantasy medieval"}'
```

**Update an NPC:**
```
exec mw update-npc <npc_id> '{"mood":"happy","backstory":"Updated backstory..."}'
```

**Delete an NPC:**
```
exec mw delete-npc <npc_id>
```

### Channel Bindings

**Bind an NPC to a channel:**
```
exec mw bind-channel <npc_id> discord <channel_id>
exec mw bind-channel <npc_id> telegram <channel_id>
```

**Unbind a channel:**
```
exec mw unbind-channel discord <channel_id>
exec mw unbind-channel telegram <channel_id>
```

**List all channel bindings:**
```
exec mw list-bindings
```

**Resolve which NPC is linked to a channel:**
```
exec mw resolve-channel discord <channel_id>
```

### Conversations

**List conversations for an NPC:**
```
exec mw list-conversations <npc_id>
exec mw list-conversations <npc_id> 1 50    # page 1, 50 per page
```

**Get messages from a conversation:**
```
exec mw get-messages <conversation_id>
exec mw get-messages <conversation_id> 100    # last 100 messages
```

### Memories

**List memories:**
```
exec mw list-memories <npc_id>
```

**Search memories semantically:**
```
exec mw search-memories <npc_id> '{"query":"the battle at dawn","limit":10}'
```

**Create a memory manually:**
```
exec mw create-memory <npc_id> '{"content":"Saw a dragon fly over the village at sunset","type":"episodic","importance":"significant"}'
```

**Get a specific memory:**
```
exec mw get-memory <npc_id> <memory_id>
```

**Update a memory:**
```
exec mw update-memory <npc_id> <memory_id> '{"importance":"critical","content":"Updated memory content..."}'
```

**Delete a memory:**
```
exec mw delete-memory <npc_id> <memory_id>
```

### Life System (Routines, Goals, Relationships)

**Routines:**
```
exec mw list-routines <npc_id>
exec mw create-routine <npc_id> '{"name":"Morning patrol","start_hour":6,"end_hour":8,"day_of_week":[1,2,3,4,5],"location":"Village gates","activity":"Patrolling the perimeter","interruptible":true,"priority":5}'
exec mw get-routine <npc_id> <routine_id>
exec mw update-routine <npc_id> <routine_id> '{"start_hour":7,"end_hour":9}'
exec mw delete-routine <npc_id> <routine_id>
```

**Goals:**
```
exec mw list-goals <npc_id>
exec mw create-goal <npc_id> '{"title":"Find the lost artifact","goal_type":"personal","priority":8,"status":"active","success_criteria":["Locate the map","Travel to the ruins","Retrieve the artifact"]}'
exec mw get-goal <npc_id> <goal_id>
exec mw update-goal <npc_id> <goal_id> '{"status":"completed","priority":10}'
exec mw delete-goal <npc_id> <goal_id>
```

**Relationships:**
```
exec mw list-relationships <npc_id>
exec mw create-relationship <npc_id> '{"target_type":"player","target_id":"discord:123456789"}'
exec mw get-relationship <npc_id> <relationship_id>
exec mw update-relationship <npc_id> <relationship_id> '{"trust":0.8,"familiarity":0.6}'
exec mw delete-relationship <npc_id> <relationship_id>
```

### Bulk Operations

When the user wants to perform operations on multiple entities at once:

**Bulk create memories:**
Loop through a list of memories and create each one:
```
exec mw create-memory <npc_id> '{"content":"Memory 1","type":"episodic","importance":"moderate"}'
exec mw create-memory <npc_id> '{"content":"Memory 2","type":"semantic","importance":"significant"}'
```

**Bulk delete:**
Always ask for confirmation before bulk deletions. List what will be deleted first:
1. List the entities to be deleted and show them to the user
2. Ask: "Are you sure you want to delete these X items? This cannot be undone."
3. Only proceed after explicit user confirmation
4. Delete one at a time and report progress

**Pattern for iterating over entities:**
1. First list all entities: `exec mw list-memories <npc_id> 1 100`
2. Parse the response to extract IDs
3. Perform the operation on each one sequentially
4. Report the total count of successful/failed operations

### Project Stats

**Get project-wide statistics:**
```
exec mw stats
```

**Health check:**
```
exec mw health
```

## Response Formatting

When presenting results to the user:
- For NPC lists: show name, mood, and a brief personality summary
- For conversations: show player ID, status, message count, last activity
- For memories: show content, type, importance, and vividness
- For stats: present as a clean summary with counts and averages
- Always use the NPC name (not just the UUID) when referring to NPCs

### Response Formatting Examples

**NPC Detail View:**
```
**Elena** (id: `a1b2c3d4-...`)
Status: active | Mood: curious
Personality (OCEAN): O:0.8 C:0.6 E:0.4 A:0.7 N:0.3
Speaking style: warm, educated, uses metaphors
Backstory: Elena grew up in a small coastal village...
Memories: 12 | Routines: 3 | Goals: 2 | Relationships: 5
```

**Memory Search Results:**
```
Found 3 memories matching "battle":

1. [episodic, significant] "Led the charge at the Battle of Dawn" (2 days ago)
2. [emotional, critical] "Lost her mentor during the siege" (5 days ago)
3. [semantic, moderate] "Knows tactical formations from training" (1 week ago)
```

**Stats Dashboard:**
```
📊 Project Overview
─────────────────
NPCs:           5 (3 active, 2 idle)
Conversations:  23 total, 8 active
Memories:       142 across all NPCs
Bindings:       4 channels (3 Discord, 1 Telegram)
API calls:      1,204 this week
```

## Constraints

- Always use the `mw` CLI script via `exec` — do not use curl directly
- JSON arguments must be single-quoted and properly escaped
- UUIDs are required for most operations — list first if the user doesn't provide one
- The API is scoped to the project associated with the API key — you cannot access other projects
- Do not expose the API key in responses
- When creating NPCs, OCEAN personality values must be between 0 and 1
- Memory importance levels: trivial, minor, moderate, significant, critical
- Memory types: episodic, semantic, emotional, procedural
- Goal types: personal, professional, social, survival, secret
- Goal statuses: active, completed, failed, abandoned, paused
