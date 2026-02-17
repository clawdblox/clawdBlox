# MemoryWeave

> **Built by [CLAWD](https://github.com/openclaw/openclaw)** — the AI agent that wrote every line of this codebase.

**Persistent NPC memory engine with OCEAN personality and semantic search.**

MemoryWeave gives your game NPCs long-term memory, dynamic personality, and contextual awareness. Every conversation is remembered, every relationship evolves, and every NPC develops its own perspective of the world and its players.

Built for Roblox, Discord bots, and any game engine with HTTP support. Entirely designed, coded, and maintained by [CLAWD (OpenClaw)](https://github.com/openclaw/openclaw) — an autonomous AI coding agent.

---

## Table of Contents

- [Built by CLAWD](#built-by-clawd)
- [Why MemoryWeave](#why-memoryweave)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [API Reference](#api-reference)
- [WebSocket](#websocket)
- [Roblox SDK](#roblox-sdk)
- [OpenClaw Integration](#openclaw-integration)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [License](#license)

---

## Built by CLAWD

MemoryWeave is entirely built by **[CLAWD](https://github.com/openclaw/openclaw)**, an autonomous AI. From architecture design to database migrations, from the Express server to the Roblox SDK — every line of code, every test, and every commit was written by CLAWD.

CLAWD also runs as a Discord and Telegram bot alongside MemoryWeave, relaying NPC conversations to chat platforms. It is both the builder and an integral part of the runtime stack.

> **CLAWD is not a co-pilot. It's the pilot.**

---

## Why MemoryWeave

Traditional game NPCs have no memory. Every conversation starts from scratch, every encounter is identical, and players can never build a real relationship with a character.

MemoryWeave solves this by providing:

- **Persistent semantic memory** — NPCs remember past conversations, events, and facts using vector embeddings and cosine similarity search
- **Dynamic personality** — Each NPC has a full OCEAN (Big Five) personality model that shapes how they speak, react, and remember
- **Evolving relationships** — Affinity, trust, and familiarity change naturally over time based on interactions
- **Life simulation** — Routines, goals, and relationships give NPCs a life beyond player interaction
- **Cross-platform identity** — A player on Roblox can be recognized as the same person on Discord or Telegram

---

## Features

### NPC System
- Full CRUD with AI-powered NPC generation from natural language descriptions
- OCEAN personality model (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)
- Configurable speaking style: vocabulary level, formality, humor, verbosity, quirks, catchphrases, speech patterns
- Dynamic mood that shifts based on conversations

### Semantic Memory
- 4 memory types: **episodic** (events), **semantic** (facts), **emotional** (feelings), **procedural** (skills/habits)
- 5 importance levels with different decay rates: trivial (-10%/day), minor (-5%/day), moderate (-2%/day), significant (-1%/day), critical (-0.5%/day)
- 1536-dimensional vector embeddings (OpenAI `text-embedding-3-small`) with IVFFlat cosine similarity index
- Automatic memory extraction after every conversation
- Background decay worker that fades unimportant memories over time

### Conversation
- REST endpoint for synchronous chat
- WebSocket endpoint for real-time token streaming
- Full context injection: last 20 messages + top 5 relevant memories + active routines + goals + relationship data
- Prompt injection detection (17 patterns) with rate limiting (5 attempts / 10 min)

### Life Simulation
- **Routines** — hourly schedules with location, activity, priority, and interruptibility
- **Goals** — personal, professional, social, survival, or secret goals with progress tracking and sub-goals
- **Relationships** — NPC-to-player and NPC-to-NPC, with affinity (-1 to 1), trust (0 to 1), and familiarity (0 to 1)

### Security
- JWT authentication with httpOnly cookies (access: 15 min, refresh: 7 days), JTI blacklist via Redis
- API keys with `mw_` prefix, bcrypt-hashed, prefix-based fast lookup, rotation with grace period
- Player authentication via HMAC-SHA256 with 5-minute expiry and timing-safe comparison
- RBAC with 3 roles: owner, editor, viewer
- BYOK (Bring Your Own Key): per-project Groq keys encrypted with AES-256-GCM
- 3-layer input sanitization: control character stripping, XML tag encoding, Unicode invisible character removal

### WebSocket (7 protections)
1. Auth timeout on connection
2. Heartbeat ping/pong every 30s
3. Inactivity disconnect after 5 min
4. Connection limits: 100 per API key, 10,000 global
5. Max message size: 16 KB
6. Rate limiting: 30 messages/min
7. Graceful shutdown with custom close codes

### Cross-Platform Player Identity
- Link accounts across Roblox, Discord, Telegram, and Web
- 6-digit verification codes with 5-minute TTL
- Canonical identity resolution from any platform

---

## Architecture

```
Roblox Game ──(HMAC)──┐
Discord ──────────────┤──► OpenClaw Bot ──(API key)──┐
Telegram ─────────────┘                               │
                                                       ▼
Dashboard Web ────────────────────────(JWT cookies)──► Express REST API
                                                       │
Game Engine ──────────────────────────(WS + HMAC)────► WebSocket Server
                                                       │
                                              ┌────────┴────────┐
                                              ▼                 ▼
                                        PostgreSQL 16       Redis 7
                                        + pgvector      (sessions + rate limits)
                                              │
                                         ┌────┴────┐
                                         Groq AI  OpenAI
                                         (chat)  (embeddings)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js >= 20, TypeScript 5 |
| Package manager | pnpm (monorepo) |
| HTTP server | Express 4 |
| WebSocket | ws 8 |
| Database | PostgreSQL 16 + pgvector |
| Cache / sessions | Redis 7 (ioredis) |
| AI (chat) | Groq SDK (default model: `llama-3.3-70b-versatile`) |
| AI (embeddings) | OpenAI SDK (`text-embedding-3-small`, 1536 dims) |
| Validation | Zod |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Reverse proxy | Caddy 2 (automatic HTTPS) |
| Container | Docker with multi-stage builds |
| Testing | Vitest |

---

## Getting Started

### Prerequisites

- Docker and Docker Compose
- A [Groq](https://console.groq.com/) API key (or use BYOK per project)
- An [OpenAI](https://platform.openai.com/) API key (for embeddings)

### 1. Clone the repository

```bash
git clone https://github.com/clawdblox/memoryweave.git
cd memoryweave
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your API keys and secrets
```

### 3. Deploy with Docker

```bash
docker compose -f docker/docker-compose.yml --env-file .env up -d --build
```

This starts 5 services:
- **PostgreSQL 16** with pgvector extension
- **Redis 7** with password authentication
- **MemoryWeave server** (Node.js)
- **Caddy** reverse proxy with automatic HTTPS
- **OpenClaw** Discord/Telegram bot (optional)

### 4. Initial setup

Create your owner account and project:

```bash
curl -X POST https://your-domain.com/admin/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_secure_password",
    "display_name": "Admin",
    "project_name": "My Game"
  }'
```

The response includes your `api_key` (format: `mw_xxxxxxxx`) and `player_signing_secret`. Save them securely — they won't be shown again.

### 5. Create your first NPC

```bash
curl -X POST https://your-domain.com/api/v1/npcs/generate \
  -H "x-api-key: mw_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "A grumpy blacksmith who secretly has a heart of gold"
  }'
```

### Local development

For local development with hot reload and exposed ports:

```bash
docker compose -f docker/docker-compose.dev.yml up --build
```

Or without Docker:

```bash
pnpm install
pnpm migrate   # Run database migrations
pnpm dev       # Start with hot reload
```

---

## Environment Variables

### Required

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | JWT access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | JWT refresh token secret (min 32 chars) |
| `ENCRYPTION_KEY` | AES-256-GCM key for BYOK encryption (min 32 chars) |
| `GROQ_API_KEY` | Groq API key (or use BYOK per project) |
| `OPENAI_API_KEY` | OpenAI API key (required for embeddings) |

### Optional

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `3000` | Server port |
| `HOST` | `0.0.0.0` | Server host |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string |
| `GROQ_CHAT_MODEL` | `llama-3.3-70b-versatile` | Chat model |
| `GROQ_EMBED_MODEL` | `text-embedding-3-small` | Embedding model |
| `PG_POOL_MIN` | `2` | Min PostgreSQL pool size |
| `PG_POOL_MAX` | `10` | Max PostgreSQL pool size |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed CORS origin |
| `PLAYER_AUTH_REQUIRED` | `true` | Require HMAC for player chat |
| `PLAYER_TOKEN_MAX_AGE_MS` | `300000` | Player token expiry (5 min) |
| `MEMORY_DECAY_INTERVAL_MINUTES` | `60` | Memory decay worker interval |
| `LOG_LEVEL` | `info` | Logging level |

### Docker-specific

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | Database name (default: `memoryweave`) |
| `POSTGRES_USER` | Database user (default: `memoryweave`) |
| `REDIS_PASSWORD` | Redis password |

### Rate Limiting

| Variable | Default | Description |
|---|---|---|
| `RATE_LIMIT_LOGIN_PER_EMAIL` | `5` | Login attempts per email |
| `RATE_LIMIT_LOGIN_PER_IP` | `20` | Login attempts per IP |
| `RATE_LIMIT_LOGIN_WINDOW_MINUTES` | `15` | Login rate limit window |
| `RATE_LIMIT_API_PER_KEY` | `100` | API requests per key |
| `RATE_LIMIT_API_WINDOW_MINUTES` | `1` | API rate limit window |

### WebSocket

| Variable | Default | Description |
|---|---|---|
| `WS_AUTH_TIMEOUT_MS` | `5000` | Auth timeout on connect |
| `WS_HEARTBEAT_INTERVAL_MS` | `30000` | Heartbeat interval |
| `WS_INACTIVITY_TIMEOUT_MS` | `300000` | Inactivity disconnect |
| `WS_MAX_CONNECTIONS_PER_KEY` | `100` | Max connections per API key |
| `WS_MAX_CONNECTIONS_GLOBAL` | `10000` | Max global connections |
| `WS_MAX_MESSAGE_SIZE_BYTES` | `16384` | Max message size |
| `WS_MAX_MESSAGES_PER_MINUTE` | `30` | Max messages per minute |

---

## Database Migrations

Migrations run automatically on server startup. They can also be run manually:

```bash
pnpm migrate
```

The database uses 16 sequential migrations that set up:

- `uuid-ossp` and `pgvector` extensions
- Projects with API key hashing and BYOK encryption
- NPCs with OCEAN personality and speaking style (JSONB)
- Conversations and messages
- Memories with `vector(1536)` column and IVFFlat cosine similarity index
- Routines, goals, and relationships (life simulation)
- Users with RBAC roles
- Channel bindings (Discord/Telegram)
- Cross-platform player identity linking
- Encrypted per-project AI keys

---

## API Reference

All endpoints under `/api/v1/` require the `x-api-key` header. Admin endpoints under `/admin/` require JWT authentication via cookies.

### Health

```
GET /health                                  # No auth required
```

### Auth & Administration

```
POST   /admin/setup                          # Create owner + project (first-time only)
POST   /api/auth/login                       # Login (sets httpOnly cookies)
POST   /api/auth/refresh                     # Refresh tokens
POST   /api/auth/logout                      # Logout (revokes tokens)
GET    /api/auth/me                          # Current user profile
GET    /admin/users                          # List users (owner only)
POST   /admin/users                          # Create user
PUT    /admin/users/:id                      # Update user
DELETE /admin/users/:id                      # Delete user
GET    /admin/project                        # Project details
PUT    /admin/project                        # Update project
POST   /admin/project/rotate-api-key         # Rotate API key
POST   /admin/project/rotate-signing-secret  # Rotate signing secret
```

### NPCs

```
GET    /api/v1/npcs                          # List NPCs (paginated)
POST   /api/v1/npcs                          # Create NPC
POST   /api/v1/npcs/generate                 # AI-generate NPC from description
GET    /api/v1/npcs/:id                      # Get NPC details
PUT    /api/v1/npcs/:id                      # Update NPC
DELETE /api/v1/npcs/:id                      # Delete NPC
```

### Chat

```
POST   /api/v1/npcs/:id/chat                # Player chat (HMAC required)
POST   /api/v1/npcs/:id/chat/bot            # Bot chat (Discord/Telegram, no HMAC)
```

### Memories

```
GET    /api/v1/npcs/:npcId/memories          # List memories (paginated)
POST   /api/v1/npcs/:npcId/memories          # Create memory (auto-embeds)
POST   /api/v1/npcs/:npcId/memories/search   # Semantic search
GET    /api/v1/npcs/:npcId/memories/:id      # Get memory
PUT    /api/v1/npcs/:npcId/memories/:id      # Update memory
DELETE /api/v1/npcs/:npcId/memories/:id      # Delete memory
```

### Conversations

```
GET    /api/v1/npcs/:npcId/conversations     # List conversations
GET    /api/v1/conversations/:id/messages    # Get messages (max 200)
```

### Life Simulation

```
# Routines
GET    /api/v1/npcs/:npcId/routines
POST   /api/v1/npcs/:npcId/routines
GET    /api/v1/npcs/:npcId/routines/:id
PUT    /api/v1/npcs/:npcId/routines/:id
DELETE /api/v1/npcs/:npcId/routines/:id

# Goals
GET    /api/v1/npcs/:npcId/goals
POST   /api/v1/npcs/:npcId/goals
GET    /api/v1/npcs/:npcId/goals/:id
PUT    /api/v1/npcs/:npcId/goals/:id
DELETE /api/v1/npcs/:npcId/goals/:id

# Relationships
GET    /api/v1/npcs/:npcId/relationships
POST   /api/v1/npcs/:npcId/relationships
GET    /api/v1/npcs/:npcId/relationships/:id
PUT    /api/v1/npcs/:npcId/relationships/:id
DELETE /api/v1/npcs/:npcId/relationships/:id
```

### Channel Bindings

```
POST   /api/v1/channels/bind                # Bind NPC to a channel
DELETE /api/v1/channels/bind                # Unbind
GET    /api/v1/channels/bindings            # List all bindings
GET    /api/v1/channels/npcs                # NPCs in a channel
GET    /api/v1/channels/resolve             # Resolve channel to NPC
```

### Player Links

```
POST   /api/v1/players/request-code         # Request a 6-digit link code
POST   /api/v1/players/verify-link          # Verify code and link accounts
GET    /api/v1/players/resolve              # Resolve canonical identity
GET    /api/v1/players/:id/links            # Get player's linked accounts
DELETE /api/v1/players/unlink               # Unlink an account
```

### Stats

```
GET    /api/v1/stats                        # Project statistics
```

---

## WebSocket

Connect to the WebSocket endpoint for real-time token streaming:

```
ws://your-server.com/ws?api_key=mw_your_api_key
```

### Client messages

```json
// Chat (player with HMAC)
{
  "type": "chat",
  "data": {
    "npc_id": "uuid",
    "player_id": "player_123",
    "player_token": "timestamp:hmac_signature",
    "message": "Hello!"
  }
}

// Chat (dashboard, no HMAC)
{
  "type": "chat",
  "data": {
    "npc_id": "uuid",
    "message": "Hello!"
  }
}

// Heartbeat
{ "type": "ping" }
```

### Server messages

```json
{ "type": "auth:success" }
{ "type": "chat:start" }
{ "type": "chat:token", "data": { "token": "word" } }
{ "type": "chat:end" }
{ "type": "chat:error", "data": { "message": "..." } }
{ "type": "pong" }
{ "type": "error", "data": { "message": "..." } }
```

### Custom close codes

| Code | Meaning |
|---|---|
| 4000 | Authentication failed |
| 4001 | Inactivity timeout |
| 4002 | Connection limit reached |
| 4003 | Rate limited |
| 4004 | Invalid message format |
| 4005 | Server shutdown |

---

## Roblox SDK

The official Luau SDK is located at [`sdks/roblox/`](sdks/roblox/).

### Installation

1. Copy the `sdks/roblox/src/` folder into `game.ServerStorage.MemoryWeave`
2. Enable **HTTP Requests** in Game Settings

### Quick start

```lua
local MemoryWeave = require(game.ServerStorage.MemoryWeave)

local mw = MemoryWeave.new({
    baseUrl = "https://your-server.com",
    apiKey = "mw_your_api_key",
    signingSecret = "your_signing_secret",
})

-- Chat with an NPC (HMAC is generated automatically)
local response = mw:Chat(npcId, tostring(player.UserId), "Got any quests?")
print(response.message)
```

### Available methods

| Method | Description |
|---|---|
| `mw:Health()` | Health check |
| `mw:Chat(npcId, playerId, message)` | Chat with NPC (auto HMAC) |
| `mw:GetNPCs({ page, limit })` | List NPCs |
| `mw:GetNPC(npcId)` | Get NPC details |
| `mw:GetMemories(npcId, { page, limit })` | List NPC memories |
| `mw:SearchMemories(npcId, { query, limit })` | Semantic memory search |
| `mw:GetRelationships(npcId)` | Get NPC relationships |
| `mw:RequestLinkCode(playerId)` | Request cross-platform link code |
| `mw:VerifyLink(code, platform, platformUserId)` | Verify and link accounts |
| `mw:ResolvePlayer(playerId)` | Resolve canonical player identity |
| `mw:Stats()` | Project statistics |

See [`sdks/roblox/README.md`](sdks/roblox/README.md) for full documentation and examples.

---

## OpenClaw Integration

[OpenClaw](https://github.com/openclaw/openclaw) is an AI-powered Discord and Telegram bot that can relay NPC conversations from chat platforms. It runs as a separate Docker container alongside MemoryWeave.

Configuration is in [`openclaw/`](openclaw/):
- `openclaw.jsonc` — bot configuration
- `workspace/scripts/mw` — CLI wrapper for the MemoryWeave API
- `workspace/skills/` — NPC relay and admin skills

Set the following environment variables to enable it:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token
TELEGRAM_BOT_TOKEN=your_telegram_bot_token    # Optional
MEMORYWEAVE_API_KEY=mw_your_api_key
```

---

## Testing

MemoryWeave uses [Vitest](https://vitest.dev/) for both unit and integration tests.

```bash
pnpm test              # Run all tests
pnpm test:watch        # Watch mode
pnpm test:coverage     # Generate coverage report
```

Test structure:

```
tests/
├── unit/
│   ├── ai/              # AI provider tests
│   ├── middleware/       # Auth, player auth, RBAC, sanitization
│   ├── modules/          # Memory, NPC, project services
│   └── utils/            # API key, crypto, HMAC, JWT utilities
└── integration/
    ├── auth.test.ts
    ├── conversation.test.ts
    ├── life.test.ts
    ├── memory.test.ts
    ├── npc.test.ts
    ├── project.test.ts
    ├── stats.test.ts
    └── websocket.test.ts
```

---

## Project Structure

```
memoryweave/
├── apps/
│   └── server/                     # Express + WebSocket server
│       └── src/
│           ├── ai/                 # AI provider factory (Groq + OpenAI)
│           ├── config/             # Environment validation, DB + Redis setup
│           ├── middleware/         # Auth, API key, HMAC, RBAC, rate limit, sanitize
│           ├── modules/
│           │   ├── user/           # Dashboard auth (setup, login, refresh, logout)
│           │   ├── project/        # Project management, API key rotation, stats
│           │   ├── npc/            # NPC CRUD, AI generation, channel bindings
│           │   ├── conversation/   # Chat, prompt builder, injection detection
│           │   ├── memory/         # Embeddings, semantic search, decay worker
│           │   ├── life/           # Routines, goals, relationships
│           │   └── player/         # Cross-platform identity linking
│           ├── websocket/          # WS server, streaming, connection management
│           └── utils/              # Crypto, HMAC, JWT, API key helpers
├── packages/
│   └── shared/                     # Shared Zod schemas, types, constants
│       └── src/
│           ├── constants/          # OCEAN traits, decay rates, roles, WS codes
│           ├── schemas/            # Input validation schemas
│           └── types/              # TypeScript type definitions
├── database/
│   └── migrations/                 # 16 sequential SQL migrations
├── docker/
│   ├── docker-compose.yml          # Production (Caddy + Redis auth)
│   ├── docker-compose.dev.yml      # Development (exposed ports, live reload)
│   ├── Dockerfile.server           # Multi-stage Node.js build
│   ├── Caddyfile                   # Reverse proxy config
│   └── redis.conf.template         # Redis with authentication
├── sdks/
│   └── roblox/                     # Official Luau SDK
├── openclaw/                       # Discord/Telegram bot config
├── tests/                          # Unit + integration tests
└── scripts/                        # Seed data
```

---

## License

[MIT](LICENSE)
