# MemoryWeave Roblox SDK

Luau SDK for integrating MemoryWeave NPC memory into Roblox experiences. Uses `HttpService:RequestAsync()` — no WebSocket dependency.

## Installation

1. Copy the `src/` folder into your Roblox project's `ServerStorage`
2. Rename it to `MemoryWeave`

Your ServerStorage should look like:

```
ServerStorage/
└── MemoryWeave/
    ├── init.lua
    ├── SHA256.lua
    └── HttpClient.lua
```

3. Enable `HttpService` in Game Settings → Security → Allow HTTP Requests

## Quick Start

```lua
local MemoryWeave = require(game.ServerStorage.MemoryWeave)

local mw = MemoryWeave.new({
    baseUrl = "https://your-server.com",
    apiKey = "mw_your_api_key",
    signingSecret = "your_signing_secret",
})

-- Check server health
local health = mw:Health()
print(health.status) -- "ok"

-- Chat with an NPC
local response = mw:Chat("npc-uuid", tostring(player.UserId), "Hello!")
print(response.message)    -- NPC's reply
print(response.npc_mood)   -- NPC's current mood
```

> **Important:** This SDK must only be used in **ServerScripts**. Never expose your API key or signing secret to the client.

## Configuration

| Parameter | Required | Description |
|-----------|----------|-------------|
| `baseUrl` | Yes | Your MemoryWeave server URL |
| `apiKey` | Yes | Project API key (starts with `mw_`) |
| `signingSecret` | For chat | Player signing secret from dashboard |
| `debug` | No | Print HTTP requests to output (default: false) |

## API Reference

### Chat

```lua
local response = mw:Chat(npcId, playerId, message)
-- response: { conversation_id, message, npc_mood }
```

Sends a player message to an NPC. The SDK automatically generates the HMAC player token using the signing secret.

- `npcId` — NPC UUID
- `playerId` — `tostring(player.UserId)`
- `message` — Player's message string

### NPCs

```lua
-- List NPCs
local result = mw:GetNPCs({ page = 1, limit = 20 })
-- result: { npcs = {...}, pagination = {...} }

-- Get single NPC
local npc = mw:GetNPC("npc-uuid")
-- npc: { id, display_name, personality, ... }
```

### Player Linking

Link Roblox players to Discord/Telegram accounts for cross-platform memory.

```lua
-- Request a link code
local result = mw:RequestLinkCode(tostring(player.UserId))
-- result: { code = "A7F3K2" }

-- Verify a link (typically called from bot side)
local result = mw:VerifyLink("A7F3K2", "discord", "discord_user_id")

-- Resolve player identity
local identity = mw:ResolvePlayer(tostring(player.UserId))
```

### Memory

```lua
-- Get NPC memories
local result = mw:GetMemories("npc-uuid", { page = 1, limit = 10 })

-- Search memories semantically
local result = mw:SearchMemories("npc-uuid", {
    query = "the fire incident",
    limit = 5,
})
```

### Relationships

```lua
local rels = mw:GetRelationships("npc-uuid")
```

### Health & Stats

```lua
-- Health check (no auth required)
local health = mw:Health()

-- Project stats
local stats = mw:Stats()
```

## Error Handling

All methods throw on error. Wrap calls in `pcall`:

```lua
local ok, result = pcall(function()
    return mw:Chat(npcId, playerId, message)
end)

if ok then
    print("NPC says:", result.message)
else
    warn("Chat failed:", result)
end
```

Error format: `[MemoryWeave] ERROR_CODE: message (HTTP statusCode)`

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request parameters |
| `AUTH_ERROR` | 401 | Invalid API key or player token |
| `FORBIDDEN` | 403 | Access denied |
| `NOT_FOUND` | 404 | NPC or resource not found |
| `RATE_LIMITED` | 429 | Too many requests |
| `SERVER_ERROR` | 5xx | Server-side error |
| `NETWORK_ERROR` | 0 | HTTP request failed |

## Full Example

See [`example/ServerScript.lua`](example/ServerScript.lua) for a complete integration example with RemoteEvents for client-server communication.
