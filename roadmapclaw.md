# OpenClaw Integration Roadmap

> Full development roadmap for the OpenClaw (Discord + Telegram) integration with MemoryWeave.
> Every commit is prefixed with `CLAWD (openclaw): ...`
> All changes are scoped to `openclaw/` — no backend or shared package modifications.
> **Total: 47 commits across 7 phases**

---

## Files Inventory

| File | Description |
|---|---|
| `openclaw/workspace/scripts/mw` | CLI wrapper for the MemoryWeave API |
| `openclaw/openclaw.jsonc` | OpenClaw bot configuration |
| `openclaw/workspace/IDENTITY.md` | Bot identity and personality definition |
| `openclaw/workspace/skills/memoryweave-npc/SKILL.md` | NPC message relay skill |
| `openclaw/workspace/skills/memoryweave-admin/SKILL.md` | Admin management skill |

---

## Phase 0 — Bug Fixes (5 commits)

Post-migration 011 renamed `channel_id` → `platform_channel_id` in the API, but the `mw` script still uses the old field name.

| # | Commit message | File | What changes |
|---|---|---|---|
| 1 | `CLAWD (openclaw): fix bind-channel sending channel_id instead of platform_channel_id` | `scripts/mw` | Line 122: replace `"channel_id"` with `"platform_channel_id"` in JSON body |
| 2 | `CLAWD (openclaw): fix unbind-channel sending channel_id instead of platform_channel_id` | `scripts/mw` | Line 126: replace `"channel_id"` with `"platform_channel_id"` in JSON body |
| 3 | `CLAWD (openclaw): fix resolve-channel query param to use platform_channel_id` | `scripts/mw` | Line 133: replace `channel_id=` with `platform_channel_id=` in query string |
| 4 | `CLAWD (openclaw): fix chat-bot JSON escaping for messages with special characters` | `scripts/mw` | Line 74: escape quotes, backslashes, and newlines in `$5` before embedding in JSON |
| 5 | `CLAWD (openclaw): normalize error output to stderr across all commands` | `scripts/mw` | Ensure all error/failure messages go to `>&2`, API errors parsed and printed cleanly |

**Verification:** `mw bind-channel`, `mw unbind-channel`, `mw resolve-channel` work correctly against the API. Messages with quotes/special chars don't break `chat-bot`.

---

## Phase 1 — `mw` CLI Core Improvements (10 commits)

Reliability, observability, and developer experience for the shell wrapper.

| # | Commit message | File | What changes |
|---|---|---|---|
| 6 | `CLAWD (openclaw): add retry logic with exponential backoff to request function` | `scripts/mw` | Retry failed curl calls up to 3 times with 1s/2s/4s delay. Only retry on network errors (exit code 7, 28, 56), not on API errors |
| 7 | `CLAWD (openclaw): add configurable timeout via MW_TIMEOUT env var` | `scripts/mw` | Add `--max-time ${MW_TIMEOUT:-30}` and `--connect-timeout 10` to all curl calls |
| 8 | `CLAWD (openclaw): add --version flag` | `scripts/mw` | `mw --version` prints `mw 0.1.0`. Version stored as variable at top of script |
| 9 | `CLAWD (openclaw): add MW_DEBUG verbose mode` | `scripts/mw` | When `MW_DEBUG=1`: print method, URL, body, curl flags to stderr. Show full response with HTTP status code |
| 10 | `CLAWD (openclaw): add pretty-print JSON output via jq` | `scripts/mw` | Pipe successful JSON responses through `jq .` if available, raw output otherwise. Configurable via `MW_RAW=1` to disable |
| 11 | `CLAWD (openclaw): add JSON body validation before sending requests` | `scripts/mw` | When jq is available, validate JSON body syntax before curl. Print clear error if malformed |
| 12 | `CLAWD (openclaw): add consistent exit codes` | `scripts/mw` | Define: 0=success, 1=usage error, 2=network/timeout, 3=API error (4xx/5xx). Update all exit paths |
| 13 | `CLAWD (openclaw): add HTTP status code checking on API responses` | `scripts/mw` | Capture HTTP status via `-w '%{http_code}'`, detect non-2xx, extract API error message from JSON body |
| 14 | `CLAWD (openclaw): add --help flag with categorized command reference` | `scripts/mw` | `mw --help` shows full usage with descriptions per command, grouped by category. Replaces current `*)` fallback |
| 15 | `CLAWD (openclaw): add color output support` | `scripts/mw` | Colorize errors (red), success (green), headers (bold) when outputting to a tty. Disable with `MW_NO_COLOR=1` |

**Verification:** `mw --version`, `mw --help` work. `MW_DEBUG=1 mw health` shows request details. Malformed JSON is caught before sending. Non-2xx responses show meaningful errors.

---

## Phase 2 — `mw` CLI New Commands (8 commits)

Fill in the missing CRUD commands for all entities.

| # | Commit message | File | What changes |
|---|---|---|---|
| 16 | `CLAWD (openclaw): add get-memory and delete-memory commands` | `scripts/mw` | `mw get-memory <npc_id> <memory_id>` → `GET /npcs/:id/memories/:mid`, `mw delete-memory <npc_id> <memory_id>` → `DELETE /npcs/:id/memories/:mid` |
| 17 | `CLAWD (openclaw): add update-memory command` | `scripts/mw` | `mw update-memory <npc_id> <memory_id> '<json>'` → `PUT /npcs/:id/memories/:mid` |
| 18 | `CLAWD (openclaw): add get-routine, update-routine, delete-routine commands` | `scripts/mw` | Full CRUD for routines: GET/PUT/DELETE on `/npcs/:id/routines/:rid` |
| 19 | `CLAWD (openclaw): add get-goal, update-goal, delete-goal commands` | `scripts/mw` | Full CRUD for goals: GET/PUT/DELETE on `/npcs/:id/goals/:gid` |
| 20 | `CLAWD (openclaw): add get-relationship, update-relationship, delete-relationship commands` | `scripts/mw` | Full CRUD for relationships: GET/PUT/DELETE on `/npcs/:id/relationships/:rid` |
| 21 | `CLAWD (openclaw): add export-conversation command` | `scripts/mw` | `mw export-conversation <conversation_id>` → `GET /conversations/:id/messages?limit=1000`, outputs full JSON array |
| 22 | `CLAWD (openclaw): add search-npcs command` | `scripts/mw` | `mw search-npcs '<query>'` → `GET /npcs?search=<query>`, filter NPCs by name |
| 23 | `CLAWD (openclaw): update help text with all new commands` | `scripts/mw` | Add all new commands to `--help` output with descriptions, organized by category |

**Verification:** All new commands respond correctly. `mw --help` lists every available command.

---

## Phase 3 — IDENTITY.md Enhancement (5 commits)

Enrich the bot personality and operational guidelines.

| # | Commit message | File | What changes |
|---|---|---|---|
| 24 | `CLAWD (openclaw): enrich persona with detailed voice and behavioral guidelines` | `IDENTITY.md` | Expand personality with tone of voice, communication style, level of formality. Add examples of how to greet, confirm actions, suggest improvements |
| 25 | `CLAWD (openclaw): add error handling guidelines` | `IDENTITY.md` | Define behavior when: API is down, request times out, rate limited, NPC not found, invalid input. User-friendly messages, no raw stack traces |
| 26 | `CLAWD (openclaw): add response examples for common admin interactions` | `IDENTITY.md` | Example exchanges: listing NPCs, creating an NPC, binding a channel, checking stats. Show expected tone and format |
| 27 | `CLAWD (openclaw): add platform-specific behavior rules` | `IDENTITY.md` | Discord: use embeds-like formatting (bold, code blocks). Telegram: use HTML/Markdown. Adapt message length and structure per platform |
| 28 | `CLAWD (openclaw): add limitations and boundaries section` | `IDENTITY.md` | Explicitly list what the bot cannot do: no direct DB access, no cross-project access, no API key exposure, no destructive operations without confirmation |

**Verification:** IDENTITY.md is comprehensive. Bot responses in Discord/Telegram match the defined personality and rules.

---

## Phase 4 — `memoryweave-npc` Skill Enhancement (7 commits)

Make the NPC relay skill more robust and platform-aware.

| # | Commit message | File | What changes |
|---|---|---|---|
| 29 | `CLAWD (openclaw): add message length validation per platform` | `memoryweave-npc/SKILL.md` | Before replying: check length against Discord (2000 chars) or Telegram (4096 chars) limit. Truncate with "..." if exceeded |
| 30 | `CLAWD (openclaw): add NPC disabled handling` | `memoryweave-npc/SKILL.md` | If resolve returns an NPC with `is_active=false`, reply "This NPC is currently unavailable." instead of relaying |
| 31 | `CLAWD (openclaw): add error categorization with distinct user messages` | `memoryweave-npc/SKILL.md` | Differentiate: network error → "Service temporarily unavailable", 404 → "NPC not found", 429 → "Too many requests, please slow down", 500 → "Something went wrong" |
| 32 | `CLAWD (openclaw): add multi-message splitting for long NPC responses` | `memoryweave-npc/SKILL.md` | If response exceeds platform limit, split at sentence boundaries and send as multiple messages with short delay |
| 33 | `CLAWD (openclaw): add platform-specific formatting guidance` | `memoryweave-npc/SKILL.md` | Discord: preserve markdown from NPC response. Telegram: convert markdown to Telegram-supported formatting. Strip unsupported formatting per platform |
| 34 | `CLAWD (openclaw): add thread and reply-to context extraction` | `memoryweave-npc/SKILL.md` | When message is a reply or in a thread: extract parent message context and include as `context` field in chat-bot call |
| 35 | `CLAWD (openclaw): add graceful timeout handling with retry suggestion` | `memoryweave-npc/SKILL.md` | If chat-bot times out (30s+): reply "The NPC is thinking... please try again in a moment." instead of generic error |

**Verification:** Long messages split correctly. Disabled NPCs show proper message. Errors are user-friendly and categorized.

---

## Phase 5 — `memoryweave-admin` Skill Enhancement (7 commits)

Complete the admin skill with missing operations, examples, and workflows.

| # | Commit message | File | What changes |
|---|---|---|---|
| 36 | `CLAWD (openclaw): add update-memory and delete-memory command docs` | `memoryweave-admin/SKILL.md` | Document `mw update-memory` and `mw delete-memory` with usage examples and expected responses |
| 37 | `CLAWD (openclaw): add update and delete docs for routines, goals, relationships` | `memoryweave-admin/SKILL.md` | Document all update/delete commands for life system entities with examples |
| 38 | `CLAWD (openclaw): add bulk operation patterns` | `memoryweave-admin/SKILL.md` | Document how to perform bulk operations: loop patterns for batch create/delete, suggest confirmation before bulk deletes |
| 39 | `CLAWD (openclaw): add response formatting examples for complex outputs` | `memoryweave-admin/SKILL.md` | Concrete examples: how to format NPC detail view, memory search results, relationship graph, stats dashboard |
| 40 | `CLAWD (openclaw): add troubleshooting section` | `memoryweave-admin/SKILL.md` | Common errors and fixes: 401 (bad API key), 404 (wrong UUID), 422 (invalid OCEAN values), 429 (rate limited), 500 (server error) |
| 41 | `CLAWD (openclaw): add NPC onboarding workflow guide` | `memoryweave-admin/SKILL.md` | Step-by-step: create NPC → set personality → add backstory memories → create routines → set goals → bind to channel. Recommended order of operations |
| 42 | `CLAWD (openclaw): add export-conversation and search-npcs command docs` | `memoryweave-admin/SKILL.md` | Document new `mw export-conversation` and `mw search-npcs` commands with usage examples |

**Verification:** All admin commands fully documented. Troubleshooting covers real error scenarios. Onboarding workflow is actionable.

---

## Phase 6 — `openclaw.jsonc` Config Enhancement (5 commits)

Production-ready configuration with rate limiting, fallbacks, and templates.

| # | Commit message | File | What changes |
|---|---|---|---|
| 43 | `CLAWD (openclaw): add rate limiting and cooldown config` | `openclaw.jsonc` | Add per-user and per-channel rate limit settings (messages/minute, cooldown period). Configure separately for admin and NPC channels |
| 44 | `CLAWD (openclaw): add model fallback chain` | `openclaw.jsonc` | Configure fallback models: primary `claude-sonnet-4-5` → fallback `claude-haiku-4-5` → error message. Configurable per skill |
| 45 | `CLAWD (openclaw): add logging level and debug flags` | `openclaw.jsonc` | Add `logging.level` (error/warn/info/debug), `logging.destination` (stdout/file), `logging.includeTimestamps` |
| 46 | `CLAWD (openclaw): add Telegram group support with allowlist and reply config` | `openclaw.jsonc` | Add `telegram.groups` config: allowlist of group IDs, `requireMention` in groups, reply behavior (reply-to vs standalone), `allowFrom` per group |
| 47 | `CLAWD (openclaw): add ready-to-use template guild config` | `openclaw.jsonc` | Uncomment and fill in a working guild config template with: admin channel (memoryweave-admin skill), NPC channel example (memoryweave-npc skill), sensible defaults for all options |

**Verification:** OpenClaw starts with new config. Rate limiting active. Telegram groups configured. Guild template is copy-paste ready for new servers.

---

## Summary

| Phase | Focus | Commits | File(s) |
|---|---|---|---|
| 0 | Bug Fixes | 5 | `scripts/mw` |
| 1 | CLI Core | 10 | `scripts/mw` |
| 2 | CLI Commands | 8 | `scripts/mw` |
| 3 | Identity | 5 | `IDENTITY.md` |
| 4 | NPC Skill | 7 | `memoryweave-npc/SKILL.md` |
| 5 | Admin Skill | 7 | `memoryweave-admin/SKILL.md` |
| 6 | Config | 5 | `openclaw.jsonc` |
| **Total** | | **47** | **5 files** |

## Acceptance Criteria

- [ ] All commits prefixed with `CLAWD (openclaw): ...`
- [ ] No `Co-Authored-By` lines in commits
- [ ] Phase 0: `mw bind-channel`, `mw resolve-channel`, `mw chat-bot` work against live API
- [ ] Phase 1: `mw --version`, `mw --help`, `MW_DEBUG=1 mw health` all functional
- [ ] Phase 2: All CRUD commands available for every entity (NPC, memory, routine, goal, relationship)
- [ ] Phase 3: IDENTITY.md covers personality, errors, examples, platform rules, boundaries
- [ ] Phase 4: NPC relay handles long messages, disabled NPCs, timeouts, and platform differences
- [ ] Phase 5: Admin skill documents every command with examples and troubleshooting
- [ ] Phase 6: Config includes rate limits, fallbacks, logging, Telegram groups, guild template
