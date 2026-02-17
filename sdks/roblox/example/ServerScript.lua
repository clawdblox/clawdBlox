-- MemoryWeave Example ServerScript
-- Place the MemoryWeave module folder in ServerStorage, then use this script in ServerScriptService.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local MemoryWeave = require(game.ServerStorage.MemoryWeave)

-- Initialize the client
local mw = MemoryWeave.new({
	baseUrl = "https://your-server.com",       -- Your MemoryWeave server URL
	apiKey = "mw_your_api_key_here",           -- Project API key
	signingSecret = "your_signing_secret_here", -- Player signing secret from dashboard
	debug = true,                               -- Set false in production
})

-- Create a RemoteEvent for client-to-server chat
local ChatEvent = Instance.new("RemoteEvent")
ChatEvent.Name = "NPCChat"
ChatEvent.Parent = ReplicatedStorage

local ChatResponse = Instance.new("RemoteEvent")
ChatResponse.Name = "NPCChatResponse"
ChatResponse.Parent = ReplicatedStorage

-- Check server health on startup
local function checkHealth()
	local ok, result = pcall(function()
		return mw:Health()
	end)

	if ok then
		print("[MemoryWeave] Server is healthy:", result.status)
	else
		warn("[MemoryWeave] Server health check failed:", result)
	end
end

-- List available NPCs on startup
local function listNPCs()
	local ok, result = pcall(function()
		return mw:GetNPCs({ page = 1, limit = 10 })
	end)

	if ok and result.npcs then
		print("[MemoryWeave] Available NPCs:")
		for _, npc in result.npcs do
			print(string.format("  - %s (%s)", npc.display_name, npc.id))
		end
	else
		warn("[MemoryWeave] Failed to list NPCs:", result)
	end
end

-- Handle player chat with NPC
local function onPlayerChat(player: Player, npcId: string, message: string)
	-- Validate input
	if type(npcId) ~= "string" or type(message) ~= "string" then
		return
	end

	if #message == 0 or #message > 500 then
		return
	end

	local playerId = tostring(player.UserId)

	local ok, result = pcall(function()
		return mw:Chat(npcId, playerId, message)
	end)

	if ok then
		-- Send NPC response back to the player
		ChatResponse:FireClient(player, {
			npcId = npcId,
			message = result.message,
			mood = result.npc_mood,
			conversationId = result.conversation_id,
		})
	else
		warn(string.format("[MemoryWeave] Chat failed for %s: %s", player.Name, tostring(result)))
		ChatResponse:FireClient(player, {
			npcId = npcId,
			error = "The NPC is unable to respond right now.",
		})
	end
end

-- Handle player link code request
local function onRequestLinkCode(player: Player)
	local ok, result = pcall(function()
		return mw:RequestLinkCode(tostring(player.UserId))
	end)

	if ok then
		-- Send the link code to the player (show in UI)
		return result.code
	else
		warn("[MemoryWeave] Link code request failed:", result)
		return nil
	end
end

-- Connect events
ChatEvent.OnServerEvent:Connect(onPlayerChat)

-- Run startup checks
task.spawn(function()
	checkHealth()
	listNPCs()
end)

-- Clean up on player leave (optional: future use)
Players.PlayerRemoving:Connect(function(player)
	-- SDK is stateless per-request, no cleanup needed
end)

print("[MemoryWeave] SDK initialized and ready")
