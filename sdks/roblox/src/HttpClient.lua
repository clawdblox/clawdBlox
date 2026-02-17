-- HTTP client wrapper for Roblox HttpService
-- Handles URL building, headers, JSON encoding/decoding, and error mapping

local HttpService = game:GetService("HttpService")

local HttpClient = {}
HttpClient.__index = HttpClient

export type HttpClientConfig = {
	baseUrl: string,
	apiKey: string?,
	debug: boolean?,
}

export type HttpResponse = {
	success: boolean,
	statusCode: number,
	data: any?,
	error: {
		code: string,
		message: string,
		statusCode: number,
		retryAfter: number?,
	}?,
}

function HttpClient.new(config: HttpClientConfig)
	local self = setmetatable({}, HttpClient)
	-- Remove trailing slash from baseUrl
	self._baseUrl = string.gsub(config.baseUrl, "/$", "")
	self._apiKey = config.apiKey
	self._debug = config.debug or false
	return self
end

-- Build query string from a table of key-value pairs
local function buildQueryString(params: { [string]: any }?): string
	if not params then
		return ""
	end

	local parts = {}
	for key, value in params do
		if value ~= nil then
			parts[#parts + 1] = HttpService:UrlEncode(tostring(key)) .. "=" .. HttpService:UrlEncode(tostring(value))
		end
	end

	if #parts == 0 then
		return ""
	end

	return "?" .. table.concat(parts, "&")
end

-- Map HTTP status codes to error responses
local function mapError(statusCode: number, body: string?): { code: string, message: string, statusCode: number, retryAfter: number? }
	local parsed = nil
	if body and #body > 0 then
		local ok, result = pcall(function()
			return HttpService:JSONDecode(body)
		end)
		if ok then
			parsed = result
		end
	end

	local code = "UNKNOWN_ERROR"
	local message = "An unknown error occurred"

	if statusCode == 400 then
		code = "VALIDATION_ERROR"
		message = parsed and parsed.message or "Invalid request"
	elseif statusCode == 401 then
		code = "AUTH_ERROR"
		message = parsed and parsed.message or "Authentication failed"
	elseif statusCode == 403 then
		code = "FORBIDDEN"
		message = parsed and parsed.message or "Access denied"
	elseif statusCode == 404 then
		code = "NOT_FOUND"
		message = parsed and parsed.message or "Resource not found"
	elseif statusCode == 429 then
		code = "RATE_LIMITED"
		message = parsed and parsed.message or "Rate limit exceeded"
	elseif statusCode >= 500 then
		code = "SERVER_ERROR"
		message = parsed and parsed.message or "Internal server error"
	end

	return {
		code = code,
		message = message,
		statusCode = statusCode,
		retryAfter = parsed and parsed.retryAfter,
	}
end

export type RequestOptions = {
	method: string,
	path: string,
	body: any?,
	query: { [string]: any }?,
	headers: { [string]: string }?,
	skipAuth: boolean?,
}

-- Make an HTTP request
function HttpClient:Request(options: RequestOptions): HttpResponse
	local url = self._baseUrl .. options.path .. buildQueryString(options.query)

	local headers: { [string]: string } = {
		["Content-Type"] = "application/json",
		["Accept"] = "application/json",
	}

	-- Add API key unless explicitly skipped
	if not options.skipAuth and self._apiKey then
		headers["x-api-key"] = self._apiKey
	end

	-- Merge custom headers
	if options.headers then
		for key, value in options.headers do
			headers[key] = value
		end
	end

	local requestOptions: any = {
		Url = url,
		Method = options.method,
		Headers = headers,
	}

	if options.body ~= nil and (options.method == "POST" or options.method == "PUT" or options.method == "PATCH") then
		requestOptions.Body = HttpService:JSONEncode(options.body)
	end

	if self._debug then
		print(string.format("[MemoryWeave] %s %s", options.method, url))
	end

	local ok, result = pcall(function()
		return HttpService:RequestAsync(requestOptions)
	end)

	if not ok then
		return {
			success = false,
			statusCode = 0,
			error = {
				code = "NETWORK_ERROR",
				message = "HTTP request failed: " .. tostring(result),
				statusCode = 0,
			},
		}
	end

	if self._debug then
		print(string.format("[MemoryWeave] Response %d (%d bytes)", result.StatusCode, #result.Body))
	end

	if result.StatusCode >= 200 and result.StatusCode < 300 then
		local data = nil
		if result.Body and #result.Body > 0 then
			local decodeOk, decoded = pcall(function()
				return HttpService:JSONDecode(result.Body)
			end)
			if decodeOk then
				data = decoded
			end
		end

		return {
			success = true,
			statusCode = result.StatusCode,
			data = data,
		}
	else
		return {
			success = false,
			statusCode = result.StatusCode,
			error = mapError(result.StatusCode, result.Body),
		}
	end
end

return HttpClient
