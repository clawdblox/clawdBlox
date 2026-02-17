-- SHA256 + HMAC-SHA256 implementation in pure Luau
-- Compliant with FIPS 180-4 (SHA256) and RFC 2104 (HMAC)

local SHA256 = {}

-- SHA256 constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes
local K = {
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
	0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
	0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
	0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
	0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
	0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
	0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
	0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
	0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
}

-- Initial hash values: first 32 bits of the fractional parts of the square roots of the first 8 primes
local H0 = {
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
	0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
}

local band = bit32.band
local bnot = bit32.bnot
local bxor = bit32.bxor
local rshift = bit32.rshift
local rrotate = bit32.rrotate

local function preprocess(message: string): { number }
	local len = #message
	local bitLen = len * 8

	-- Convert string to array of bytes
	local bytes = {}
	for i = 1, len do
		bytes[i] = string.byte(message, i)
	end

	-- Append bit '1' (0x80)
	bytes[len + 1] = 0x80

	-- Pad with zeros until length ≡ 56 (mod 64)
	local padLen = len + 1
	while (padLen % 64) ~= 56 do
		padLen += 1
		bytes[padLen] = 0x00
	end

	-- Append original length as 64-bit big-endian
	-- High 32 bits (always 0 for messages < 2^32 bits)
	local highBits = math.floor(bitLen / 0x100000000)
	bytes[padLen + 1] = band(rshift(highBits, 24), 0xFF)
	bytes[padLen + 2] = band(rshift(highBits, 16), 0xFF)
	bytes[padLen + 3] = band(rshift(highBits, 8), 0xFF)
	bytes[padLen + 4] = band(highBits, 0xFF)
	-- Low 32 bits
	bytes[padLen + 5] = band(rshift(bitLen, 24), 0xFF)
	bytes[padLen + 6] = band(rshift(bitLen, 16), 0xFF)
	bytes[padLen + 7] = band(rshift(bitLen, 8), 0xFF)
	bytes[padLen + 8] = band(bitLen, 0xFF)

	-- Convert to 32-bit words
	local words = {}
	local totalBytes = padLen + 8
	for i = 1, totalBytes, 4 do
		local w = bytes[i] * 0x1000000 + bytes[i + 1] * 0x10000 + bytes[i + 2] * 0x100 + bytes[i + 3]
		words[#words + 1] = w
	end

	return words
end

local function processBlock(block: { number }, startIdx: number, h: { number })
	-- Prepare message schedule
	local W = {}
	for i = 1, 16 do
		W[i] = block[startIdx + i - 1]
	end

	for i = 17, 64 do
		local s0 = bxor(rrotate(W[i - 15], 7), rrotate(W[i - 15], 18), rshift(W[i - 15], 3))
		local s1 = bxor(rrotate(W[i - 2], 17), rrotate(W[i - 2], 19), rshift(W[i - 2], 10))
		W[i] = band(W[i - 16] + s0 + W[i - 7] + s1, 0xFFFFFFFF)
	end

	-- Working variables
	local a, b, c, d, e, f, g, hh = h[1], h[2], h[3], h[4], h[5], h[6], h[7], h[8]

	-- Compression
	for i = 1, 64 do
		local S1 = bxor(rrotate(e, 6), rrotate(e, 11), rrotate(e, 25))
		local ch = bxor(band(e, f), band(bnot(e), g))
		local temp1 = band(hh + S1 + ch + K[i] + W[i], 0xFFFFFFFF)
		local S0 = bxor(rrotate(a, 2), rrotate(a, 13), rrotate(a, 22))
		local maj = bxor(band(a, b), band(a, c), band(b, c))
		local temp2 = band(S0 + maj, 0xFFFFFFFF)

		hh = g
		g = f
		f = e
		e = band(d + temp1, 0xFFFFFFFF)
		d = c
		c = b
		b = a
		a = band(temp1 + temp2, 0xFFFFFFFF)
	end

	h[1] = band(h[1] + a, 0xFFFFFFFF)
	h[2] = band(h[2] + b, 0xFFFFFFFF)
	h[3] = band(h[3] + c, 0xFFFFFFFF)
	h[4] = band(h[4] + d, 0xFFFFFFFF)
	h[5] = band(h[5] + e, 0xFFFFFFFF)
	h[6] = band(h[6] + f, 0xFFFFFFFF)
	h[7] = band(h[7] + g, 0xFFFFFFFF)
	h[8] = band(h[8] + hh, 0xFFFFFFFF)
end

-- Compute SHA256 hash of a string, returns lowercase hex string (64 chars)
function SHA256.hash(message: string): string
	local words = preprocess(message)

	-- Initialize hash values
	local h = {}
	for i = 1, 8 do
		h[i] = H0[i]
	end

	-- Process each 512-bit (16-word) block
	local numBlocks = #words / 16
	for block = 0, numBlocks - 1 do
		processBlock(words, block * 16 + 1, h)
	end

	-- Produce final hex digest
	return string.format(
		"%08x%08x%08x%08x%08x%08x%08x%08x",
		h[1], h[2], h[3], h[4], h[5], h[6], h[7], h[8]
	)
end

-- Compute HMAC-SHA256 (RFC 2104), returns lowercase hex string (64 chars)
function SHA256.hmac(key: string, message: string): string
	local blockSize = 64 -- SHA256 block size in bytes

	-- If key is longer than block size, hash it
	if #key > blockSize then
		local hashed = SHA256.hash(key)
		-- Convert hex string back to binary
		key = ""
		for i = 1, #hashed, 2 do
			key ..= string.char(tonumber(string.sub(hashed, i, i + 1), 16) :: number)
		end
	end

	-- Pad key to block size
	if #key < blockSize then
		key ..= string.rep("\0", blockSize - #key)
	end

	-- Compute inner and outer padded keys
	local oKeyPad = {}
	local iKeyPad = {}
	for i = 1, blockSize do
		local byte = string.byte(key, i)
		oKeyPad[i] = string.char(bxor(byte, 0x5C))
		iKeyPad[i] = string.char(bxor(byte, 0x36))
	end

	local oKey = table.concat(oKeyPad)
	local iKey = table.concat(iKeyPad)

	-- HMAC = H(oKeyPad || H(iKeyPad || message))
	local innerHash = SHA256.hash(iKey .. message)

	-- Convert inner hash hex to binary
	local innerBinary = ""
	for i = 1, #innerHash, 2 do
		innerBinary ..= string.char(tonumber(string.sub(innerHash, i, i + 1), 16) :: number)
	end

	return SHA256.hash(oKey .. innerBinary)
end

return SHA256
