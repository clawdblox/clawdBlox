-- MemoryWeave Roblox SDK
-- Gives NPCs persistent memory via the MemoryWeave REST API

local SHA256 = require(script.SHA256)
local HttpClient = require(script.HttpClient)

local MemoryWeave = {}
MemoryWeave.__index = MemoryWeave

export type MemoryWeaveConfig = {
	baseUrl: string,
	apiKey: string,
	signingSecret: string?,
	debug: boolean?,
}

-- Create a new MemoryWeave client
function MemoryWeave.new(config: MemoryWeaveConfig)
	assert(config.baseUrl, "baseUrl is required")
	assert(config.apiKey, "apiKey is required")

	local self = setmetatable({}, MemoryWeave)
	self._signingSecret = config.signingSecret
	self._http = HttpClient.new({
		baseUrl = config.baseUrl,
		apiKey = config.apiKey,
		debug = config.debug,
	})
	return self
end

-- Internal: unwrap response or throw on error
local function unwrap(response)
	if response.success then
		return response.data
	end

	local err = response.error
	error(string.format("[MemoryWeave] %s: %s (HTTP %d)", err.code, err.message, err.statusCode))
end

-- Internal: generate HMAC player token for chat authentication
-- Produces the same output as the backend (playerAuth.middleware.ts)
function MemoryWeave:_generatePlayerToken(playerId: string, message: string): string
	assert(self._signingSecret, "signingSecret is required for player authentication")

	local timestamp = tostring(math.floor(workspace:GetServerTimeNow() * 1000))
	local messageHash = SHA256.hash(message)
	local payload = playerId .. ":" .. timestamp .. ":" .. messageHash
	local signature = SHA256.hmac(self._signingSecret, payload)

	return timestamp .. ":" .. signature
end

--
-- Chat
--

-- Send a chat message to an NPC as a player
-- Returns { conversation_id, message, npc_mood }
function MemoryWeave:Chat(npcId: string, playerId: string, message: string)
	local token = self:_generatePlayerToken(playerId, message)

	return unwrap(self._http:Request({
		method = "POST",
		path = "/api/v1/npcs/" .. npcId .. "/chat",
		body = {
			player_id = playerId,
			message = message,
			player_token = token,
		},
	}))
end

--
-- NPCs
--

-- List NPCs with optional pagination
-- opts: { page: number?, limit: number? }
function MemoryWeave:GetNPCs(opts: { page: number?, limit: number? }?)
	return unwrap(self._http:Request({
		method = "GET",
		path = "/api/v1/npcs",
		query = opts,
	}))
end

-- Get a single NPC by ID
function MemoryWeave:GetNPC(npcId: string)
	return unwrap(self._http:Request({
		method = "GET",
		path = "/api/v1/npcs/" .. npcId,
	}))
end

--
-- Player linking
--

-- Request a link code for a player (Roblox UserId as string)
function MemoryWeave:RequestLinkCode(userId: string)
	return unwrap(self._http:Request({
		method = "POST",
		path = "/api/v1/players/request-code",
		body = {
			roblox_user_id = userId,
		},
	}))
end

-- Verify a link code
function MemoryWeave:VerifyLink(code: string, platform: string, platformUserId: string)
	return unwrap(self._http:Request({
		method = "POST",
		path = "/api/v1/players/verify-link",
		body = {
			code = code,
			platform = platform,
			platform_user_id = platformUserId,
		},
	}))
end

-- Resolve a player's identity across platforms
function MemoryWeave:ResolvePlayer(userId: string)
	return unwrap(self._http:Request({
		method = "GET",
		path = "/api/v1/players/resolve",
		query = { roblox_user_id = userId },
	}))
end

--
-- Memory
--

-- Get memories for an NPC
-- opts: { page: number?, limit: number? }
function MemoryWeave:GetMemories(npcId: string, opts: { page: number?, limit: number? }?)
	return unwrap(self._http:Request({
		method = "GET",
		path = "/api/v1/npcs/" .. npcId .. "/memories",
		query = opts,
	}))
end

-- Search NPC memories by semantic query
-- opts: { query: string, limit: number?, player_id: string? }
function MemoryWeave:SearchMemories(npcId: string, opts: { query: string, limit: number?, player_id: string? })
	return unwrap(self._http:Request({
		method = "POST",
		path = "/api/v1/npcs/" .. npcId .. "/memories/search",
		body = opts,
	}))
end

--
-- Relationships
--

-- Get all relationships for an NPC
function MemoryWeave:GetRelationships(npcId: string)
	return unwrap(self._http:Request({
		method = "GET",
		path = "/api/v1/npcs/" .. npcId .. "/relationships",
	}))
end

--
-- Health & Stats
--

-- Check server health (no auth required)
function MemoryWeave:Health()
	return unwrap(self._http:Request({
		method = "GET",
		path = "/health",
		skipAuth = true,
	}))
end

-- Get project stats
function MemoryWeave:Stats()
	return unwrap(self._http:Request({
		method = "GET",
		path = "/api/v1/stats",
	}))
end

return MemoryWeave
