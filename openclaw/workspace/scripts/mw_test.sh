#!/bin/sh
# Test suite for mw CLI
# Pure POSIX shell — no external dependencies (no bats, no shunit2)
# Usage: sh mw_test.sh

set -e

PASS_COUNT=0
FAIL_COUNT=0
TEST_DIR=""
MW_SCRIPT=""

# ─── Setup / Teardown ───────────────────────────────────────────────

setup() {
  TEST_DIR=$(mktemp -d)
  MW_SCRIPT="$(cd "$(dirname "$0")" && pwd)/mw"

  # Create mock curl directory
  mkdir -p "$TEST_DIR/bin"

  # Default mock curl config
  printf '0\n' > "$TEST_DIR/mock_exit"
  printf '200\n' > "$TEST_DIR/mock_http_code"
  printf '{"ok":true}\n' > "$TEST_DIR/mock_body"
  printf '' > "$TEST_DIR/curl_log"

  # Stateful retry counter (for retry tests)
  printf '0\n' > "$TEST_DIR/call_count"

  # Create mock curl
  cat > "$TEST_DIR/bin/curl" <<'MOCK_EOF'
#!/bin/sh
# Mock curl — reads config from TEST_DIR env var

# Log the full command line (printf to avoid echo escape interpretation)
printf '%s\n' "$*" >> "$TEST_DIR/curl_log"

# Increment call count
count=$(cat "$TEST_DIR/call_count")
count=$((count + 1))
printf '%s\n' "$count" > "$TEST_DIR/call_count"

# Check for stateful mode (fail N times then succeed)
if [ -f "$TEST_DIR/mock_stateful" ]; then
  fail_until=$(cat "$TEST_DIR/mock_stateful")
  if [ "$count" -le "$fail_until" ]; then
    exit_code=$(cat "$TEST_DIR/mock_fail_exit")
    exit "$exit_code"
  fi
fi

mock_exit=$(cat "$TEST_DIR/mock_exit")
if [ "$mock_exit" -ne 0 ]; then
  exit "$mock_exit"
fi

mock_http_code=$(cat "$TEST_DIR/mock_http_code")
mock_body=$(cat "$TEST_DIR/mock_body")

# Find -o flag and write body to that file
outfile=""
prev=""
for arg in "$@"; do
  if [ "$prev" = "-o" ]; then
    outfile="$arg"
    break
  fi
  prev="$arg"
done

if [ -n "$outfile" ]; then
  printf '%s' "$mock_body" > "$outfile"
fi

# Print http_code (for -w '%{http_code}')
printf '%s' "$mock_http_code"
exit 0
MOCK_EOF
  chmod +x "$TEST_DIR/bin/curl"

  # Use the system jq (not mocked) — only curl is mocked
}

cleanup() {
  [ -n "$TEST_DIR" ] && rm -rf "$TEST_DIR"
}

# ─── Test Helpers ────────────────────────────────────────────────────

configure_mock() {
  printf '%s\n' "$1" > "$TEST_DIR/mock_exit"
  printf '%s\n' "$2" > "$TEST_DIR/mock_http_code"
  printf '%s\n' "$3" > "$TEST_DIR/mock_body"
  printf '' > "$TEST_DIR/curl_log"
  printf '0\n' > "$TEST_DIR/call_count"
  rm -f "$TEST_DIR/mock_stateful" "$TEST_DIR/mock_fail_exit"
}

configure_stateful_mock() {
  # fail_count: number of times to fail before succeeding
  # fail_exit: curl exit code for failures
  # success_http: http code on success
  # success_body: body on success
  printf '%s\n' "$1" > "$TEST_DIR/mock_stateful"
  printf '%s\n' "$2" > "$TEST_DIR/mock_fail_exit"
  printf '0\n' > "$TEST_DIR/mock_exit"
  printf '%s\n' "$3" > "$TEST_DIR/mock_http_code"
  printf '%s\n' "$4" > "$TEST_DIR/mock_body"
  printf '' > "$TEST_DIR/curl_log"
  printf '0\n' > "$TEST_DIR/call_count"
}

run_mw() {
  # Run mw with mock curl in PATH and capture stdout, stderr, exit code
  _mw_stdout="$TEST_DIR/stdout"
  _mw_stderr="$TEST_DIR/stderr"

  set +e
  PATH="$TEST_DIR/bin:$PATH" \
    TEST_DIR="$TEST_DIR" \
    MEMORYWEAVE_API_KEY="test-key-123" \
    MEMORYWEAVE_BASE_URL="http://mock:3000" \
    MW_NO_COLOR=1 \
    MW_TIMEOUT=5 \
    sh "$MW_SCRIPT" "$@" >"$_mw_stdout" 2>"$_mw_stderr"
  _mw_exit=$?
  set -e

  LAST_STDOUT=$(cat "$_mw_stdout")
  LAST_STDERR=$(cat "$_mw_stderr")
  LAST_EXIT=$_mw_exit
}

run_mw_env() {
  # Like run_mw but accepts extra env vars before '--'
  # Usage: run_mw_env MW_DEBUG=1 -- stats
  # Extra vars override defaults (e.g. MEMORYWEAVE_API_KEY= to unset)
  _mw_stdout="$TEST_DIR/stdout"
  _mw_stderr="$TEST_DIR/stderr"
  _extra=""
  while [ $# -gt 0 ] && [ "$1" != "--" ]; do
    _extra="$_extra $1"
    shift
  done
  [ "$1" = "--" ] && shift

  set +e
  # shellcheck disable=SC2086
  env \
    PATH="$TEST_DIR/bin:$PATH" \
    TEST_DIR="$TEST_DIR" \
    MEMORYWEAVE_API_KEY="test-key-123" \
    MEMORYWEAVE_BASE_URL="http://mock:3000" \
    MW_NO_COLOR=1 \
    MW_TIMEOUT=5 \
    $_extra \
    sh "$MW_SCRIPT" "$@" >"$_mw_stdout" 2>"$_mw_stderr"
  _mw_exit=$?
  set -e

  LAST_STDOUT=$(cat "$_mw_stdout")
  LAST_STDERR=$(cat "$_mw_stderr")
  LAST_EXIT=$_mw_exit
}

assert_eq() {
  label="$1"
  expected="$2"
  actual="$3"
  if [ "$expected" = "$actual" ]; then
    PASS_COUNT=$((PASS_COUNT + 1))
  else
    FAIL_COUNT=$((FAIL_COUNT + 1))
    printf "  FAIL: %s\n    expected: [%s]\n    actual:   [%s]\n" "$label" "$expected" "$actual" >&2
  fi
}

assert_contains() {
  label="$1"
  haystack="$2"
  needle="$3"
  case "$haystack" in
    *"$needle"*)
      PASS_COUNT=$((PASS_COUNT + 1))
      ;;
    *)
      FAIL_COUNT=$((FAIL_COUNT + 1))
      printf "  FAIL: %s\n    expected to contain: [%s]\n    actual: [%s]\n" "$label" "$needle" "$haystack" >&2
      ;;
  esac
}

assert_not_contains() {
  label="$1"
  haystack="$2"
  needle="$3"
  case "$haystack" in
    *"$needle"*)
      FAIL_COUNT=$((FAIL_COUNT + 1))
      printf "  FAIL: %s\n    expected NOT to contain: [%s]\n    actual: [%s]\n" "$label" "$needle" "$haystack" >&2
      ;;
    *)
      PASS_COUNT=$((PASS_COUNT + 1))
      ;;
  esac
}

assert_exit_code() {
  label="$1"
  expected="$2"
  assert_eq "$label (exit code)" "$expected" "$LAST_EXIT"
}

get_curl_log() {
  cat "$TEST_DIR/curl_log"
}

section() {
  printf "\n=== %s ===\n" "$1"
}

# ─── Tests ───────────────────────────────────────────────────────────

setup
trap cleanup EXIT

# ── 1. Argument Validation ──────────────────────────────────────────

section "1. Argument validation"

run_mw --version
assert_exit_code "--version exits 0" 0
assert_eq "--version output" "mw 0.1.0" "$LAST_STDOUT"

run_mw -v
assert_exit_code "-v exits 0" 0
assert_eq "-v output" "mw 0.1.0" "$LAST_STDOUT"

run_mw --help
assert_exit_code "--help exits 0" 0
assert_contains "--help shows usage" "$LAST_STDOUT" "Usage: mw <command>"
assert_contains "--help shows MW_NO_COLOR" "$LAST_STDOUT" "MW_NO_COLOR"

run_mw unknown-command-xyz
assert_exit_code "unknown cmd exits 1" 1
assert_contains "unknown cmd error" "$LAST_STDERR" "Unknown command"

run_mw get-npc
assert_exit_code "missing arg exits 1" 1
assert_contains "missing arg shows usage" "$LAST_STDERR" "Usage:"

run_mw chat-bot npc1 discord
assert_exit_code "chat-bot missing args exits 1" 1

run_mw
assert_exit_code "no command exits 1" 1
assert_contains "no command shows error" "$LAST_STDERR" "Unknown command"

run_mw_env MEMORYWEAVE_API_KEY= -- stats
assert_exit_code "missing API key exits 1" 1
assert_contains "missing API key message" "$LAST_STDERR" "MEMORYWEAVE_API_KEY"

# ── 2. URL Construction ────────────────────────────────────────────

section "2. URL construction"

configure_mock 0 200 '{"id":"npc1"}'

run_mw get-npc abc-123
assert_exit_code "get-npc exits 0" 0
curl_args=$(get_curl_log)
assert_contains "get-npc URL" "$curl_args" "http://mock:3000/api/v1/npcs/abc-123"
assert_contains "get-npc method" "$curl_args" "-X GET"

configure_mock 0 200 '{"npcs":[]}'
run_mw list-npcs 2 10 name asc
curl_args=$(get_curl_log)
assert_contains "list-npcs page" "$curl_args" "page=2"
assert_contains "list-npcs limit" "$curl_args" "limit=10"
assert_contains "list-npcs sort_by" "$curl_args" "sort_by=name"
assert_contains "list-npcs sort_order" "$curl_args" "sort_order=asc"

configure_mock 0 200 '{"conversations":[]}'
run_mw list-conversations npc1 3 15
curl_args=$(get_curl_log)
assert_contains "list-conversations URL" "$curl_args" "/npcs/npc1/conversations"
assert_contains "list-conversations page" "$curl_args" "page=3"
assert_contains "list-conversations limit" "$curl_args" "limit=15"

configure_mock 0 200 '{"created":true}'
run_mw create-npc '{"name":"Test"}'
curl_args=$(get_curl_log)
assert_contains "create-npc method" "$curl_args" "-X POST"
assert_contains "create-npc URL" "$curl_args" "/api/v1/npcs"
assert_contains "create-npc body" "$curl_args" '{"name":"Test"}'

configure_mock 0 200 '{"deleted":true}'
run_mw delete-npc abc-123
curl_args=$(get_curl_log)
assert_contains "delete-npc method" "$curl_args" "-X DELETE"

# ── 3. Exit Codes ──────────────────────────────────────────────────

section "3. Exit codes"

configure_mock 0 200 '{"ok":true}'
run_mw stats
assert_exit_code "200 → exit 0" 0

configure_mock 0 404 '{"error":"not found"}'
run_mw get-npc nonexistent
assert_exit_code "404 → exit 3 (API)" 3

configure_mock 0 500 '{"error":"internal"}'
run_mw stats
assert_exit_code "500 → exit 3 (API)" 3

configure_mock 1 "" ""
run_mw stats
assert_exit_code "curl fail → exit 2 (NETWORK)" 2

# ── 4. Retry Logic ─────────────────────────────────────────────────

section "4. Retry logic"

# Fail once (exit 7 = connection refused, retryable), then succeed
configure_stateful_mock 1 7 200 '{"retried":true}'
run_mw stats
assert_exit_code "retry succeeds" 0
call_count=$(cat "$TEST_DIR/call_count")
assert_eq "curl called twice" "2" "$call_count"
assert_contains "retry message" "$LAST_STDERR" "Retrying"

# Fail 3 times (exhausts retries)
configure_stateful_mock 3 7 200 '{"ok":true}'
run_mw stats
assert_exit_code "exhausted retries → exit 2" 2

# Non-retryable exit code (exit 1) should not retry
configure_mock 1 "" ""
run_mw stats
call_count=$(cat "$TEST_DIR/call_count")
assert_eq "non-retryable no retry" "1" "$call_count"

# ── 5. JSON Escaping ───────────────────────────────────────────────

section "5. JSON escaping"

configure_mock 0 200 '{"sent":true}'

# Test quotes in message
run_mw chat-bot npc1 discord user1 'He said "hello"'
curl_args=$(get_curl_log)
assert_contains "escaped quotes" "$curl_args" '\"hello\"'
assert_exit_code "chat-bot with quotes exits 0" 0

# Test backslash in message
configure_mock 0 200 '{"sent":true}'
run_mw chat-bot npc1 discord user1 'path\to\file'
curl_args=$(get_curl_log)
assert_contains "escaped backslash" "$curl_args" 'path\\to\\file'

# Test tab in message (literal tab)
configure_mock 0 200 '{"sent":true}'
run_mw chat-bot npc1 discord user1 "col1	col2"
curl_args=$(get_curl_log)
assert_contains "escaped tab" "$curl_args" 'col1\tcol2'

# Test newline in message
configure_mock 0 200 '{"sent":true}'
_msg="$(printf 'line1\nline2')"
run_mw chat-bot npc1 discord user1 "$_msg"
curl_args=$(get_curl_log)
assert_contains "escaped newline" "$curl_args" 'line1\nline2'

# ── 6. HTTP Status Handling ────────────────────────────────────────

section "6. HTTP status handling"

configure_mock 0 400 '{"error":"bad request"}'
run_mw stats
assert_exit_code "400 → exit 3" 3
assert_contains "400 error message" "$LAST_STDERR" "HTTP 400"

configure_mock 0 401 '{"error":"unauthorized"}'
run_mw stats
assert_exit_code "401 → exit 3" 3
assert_contains "401 error message" "$LAST_STDERR" "HTTP 401"

configure_mock 0 200 '{"ok":true}'
run_mw stats
assert_exit_code "200 → exit 0" 0

# Empty/invalid http_code
configure_mock 0 "abc" '{"ok":true}'
run_mw stats
assert_exit_code "invalid http_code → exit 2" 2
assert_contains "unexpected response error" "$LAST_STDERR" "unexpected response"

# ── 7. Color Disable ───────────────────────────────────────────────

section "7. Color disable (MW_NO_COLOR)"

configure_mock 0 404 '{"error":"not found"}'

# MW_NO_COLOR is already 1 in run_mw, so no ANSI codes should appear
run_mw get-npc nonexistent
assert_not_contains "no ANSI in stderr" "$LAST_STDERR" "\\033["
assert_not_contains "no ESC in stderr" "$LAST_STDERR" "[0;31m"

# ── 8. Debug Output ────────────────────────────────────────────────

section "8. Debug output (MW_DEBUG)"

configure_mock 0 200 '{"ok":true}'

# Debug OFF by default
run_mw stats
assert_not_contains "no debug by default" "$LAST_STDERR" "[DEBUG]"

# Debug ON
run_mw_env MW_DEBUG=1 -- stats

assert_contains "debug shows [DEBUG]" "$LAST_STDERR" "[DEBUG]"
assert_contains "debug shows method" "$LAST_STDERR" "GET"
assert_exit_code "debug still exits 0" 0

# ── 9. Raw Output ──────────────────────────────────────────────────

section "9. Raw output (MW_RAW)"

configure_mock 0 200 '{"raw":true}'

# MW_RAW=1 should output unformatted JSON
run_mw_env MW_RAW=1 -- stats

assert_eq "raw output" '{"raw":true}' "$LAST_STDOUT"
assert_exit_code "raw exits 0" 0

# ── 10. Health Command ─────────────────────────────────────────────

section "10. Health command"

configure_mock 0 200 '{"status":"ok"}'

run_mw health
assert_exit_code "health exits 0" 0
curl_args=$(get_curl_log)
assert_contains "health uses /health path" "$curl_args" "http://mock:3000/health"
assert_not_contains "health not /api/v1" "$curl_args" "/api/v1"

# Health with server down
configure_mock 7 "" ""
run_mw health
assert_exit_code "health down → exit 2" 2

# Health with 503
configure_mock 0 503 '{"status":"unhealthy"}'
run_mw health
assert_exit_code "health 503 → exit 3" 3

# ── 11. URL Encoding ──────────────────────────────────────────────

section "11. URL encoding"

configure_mock 0 200 '{"npcs":[]}'
run_mw list-npcs 1 20 "created at" asc
curl_args=$(get_curl_log)
assert_contains "space encoded in sort_by" "$curl_args" "sort_by=created%20at"
assert_exit_code "list-npcs with space exits 0" 0

configure_mock 0 200 '{"npc_id":"npc1"}'
run_mw resolve-channel discord 'ch&id=1'
curl_args=$(get_curl_log)
assert_contains "& encoded in channel_id" "$curl_args" "ch%26id%3D1"
assert_contains "resolve-channel URL path" "$curl_args" "/channels/resolve"

# ── 12. JSON Body Validation ─────────────────────────────────────

section "12. JSON body validation"

configure_mock 0 200 '{"created":true}'
run_mw create-npc 'not valid json'
assert_exit_code "invalid JSON exits 1" 1
assert_contains "invalid JSON message" "$LAST_STDERR" "invalid JSON"

configure_mock 0 200 '{"created":true}'
run_mw create-npc '{"name":"Valid"}'
assert_exit_code "valid JSON exits 0" 0

# ── 13. API Key Header ───────────────────────────────────────────

section "13. API key header"

configure_mock 0 200 '{"ok":true}'
run_mw stats
curl_args=$(get_curl_log)
assert_contains "api key header name" "$curl_args" "x-api-key:"
assert_contains "api key header value" "$curl_args" "test-key-123"

# ── 14. PUT Method + Update Commands ─────────────────────────────

section "14. PUT method + update commands"

configure_mock 0 200 '{"updated":true}'
run_mw update-npc npc1 '{"name":"Updated"}'
curl_args=$(get_curl_log)
assert_contains "update-npc method" "$curl_args" "-X PUT"
assert_contains "update-npc URL" "$curl_args" "/api/v1/npcs/npc1"
assert_contains "update-npc body" "$curl_args" '{"name":"Updated"}'

run_mw update-npc npc1
assert_exit_code "update-npc missing body exits 1" 1

# ── 15. Channel Bindings ─────────────────────────────────────────

section "15. Channel bindings"

configure_mock 0 200 '{"bound":true}'
run_mw bind-channel npc1 discord chan1
curl_args=$(get_curl_log)
assert_contains "bind-channel method" "$curl_args" "-X POST"
assert_contains "bind-channel body npc_id" "$curl_args" '"npc_id":"npc1"'

configure_mock 0 200 '{"unbound":true}'
run_mw unbind-channel discord chan1
curl_args=$(get_curl_log)
assert_contains "unbind-channel method" "$curl_args" "-X DELETE"
assert_contains "unbind-channel body platform" "$curl_args" '"platform":"discord"'

configure_mock 0 200 '{"npc_id":"npc1"}'
run_mw resolve-channel discord chan1
curl_args=$(get_curl_log)
assert_contains "resolve-channel method" "$curl_args" "-X GET"
assert_contains "resolve-channel platform param" "$curl_args" "platform=discord"

configure_mock 0 200 '{"bindings":[]}'
run_mw list-bindings
curl_args=$(get_curl_log)
assert_contains "list-bindings URL" "$curl_args" "/channels/bindings"

# ── 15b. Multi-NPC Channel Bindings ─────────────────────────────

section "15b. Multi-NPC channel bindings"

# list-channel-npcs
configure_mock 0 200 '{"npcs":[{"npc_id":"npc1","name":"Elena"},{"npc_id":"npc2","name":"Marcus"}]}'
run_mw list-channel-npcs telegram -1001234567890
curl_args=$(get_curl_log)
assert_contains "list-channel-npcs method" "$curl_args" "-X GET"
assert_contains "list-channel-npcs URL" "$curl_args" "/channels/npcs"
assert_contains "list-channel-npcs platform param" "$curl_args" "platform=telegram"
assert_contains "list-channel-npcs channel param" "$curl_args" "platform_channel_id=-1001234567890"
assert_exit_code "list-channel-npcs exits 0" 0

# list-channel-npcs missing args
run_mw list-channel-npcs
assert_exit_code "list-channel-npcs missing platform exits 1" 1
run_mw list-channel-npcs telegram
assert_exit_code "list-channel-npcs missing channel exits 1" 1

# unbind-channel with npc_id (specific NPC)
configure_mock 0 200 '{"unbound":true}'
run_mw unbind-channel telegram -1001234567890 npc1-uuid
curl_args=$(get_curl_log)
assert_contains "unbind with npc_id method" "$curl_args" "-X DELETE"
assert_contains "unbind with npc_id body platform" "$curl_args" '"platform":"telegram"'
assert_contains "unbind with npc_id body channel" "$curl_args" '"platform_channel_id":"-1001234567890"'
assert_contains "unbind with npc_id body npc_id" "$curl_args" '"npc_id":"npc1-uuid"'
assert_exit_code "unbind with npc_id exits 0" 0

# unbind-channel without npc_id (all bindings — backward compat)
configure_mock 0 200 '{"unbound":true}'
run_mw unbind-channel telegram -1001234567890
curl_args=$(get_curl_log)
assert_contains "unbind all body platform" "$curl_args" '"platform":"telegram"'
assert_not_contains "unbind all no npc_id" "$curl_args" '"npc_id"'
assert_exit_code "unbind all exits 0" 0

# Multi-bind: bind 2 NPCs to the same channel
configure_mock 0 201 '{"binding":{"npc_id":"npc1","platform":"telegram","platform_channel_id":"-100xxx"}}'
run_mw bind-channel npc1 telegram -100xxx
assert_exit_code "bind npc1 exits 0" 0

configure_mock 0 201 '{"binding":{"npc_id":"npc2","platform":"telegram","platform_channel_id":"-100xxx"}}'
run_mw bind-channel npc2 telegram -100xxx
assert_exit_code "bind npc2 exits 0" 0

# ── 16. Life System (Routines) ───────────────────────────────────

section "16. Life system (routines)"

configure_mock 0 200 '{"routines":[]}'
run_mw list-routines npc1
curl_args=$(get_curl_log)
assert_contains "list-routines URL" "$curl_args" "/npcs/npc1/routines"

configure_mock 0 200 '{"created":true}'
run_mw create-routine npc1 '{"name":"Morning"}'
curl_args=$(get_curl_log)
assert_contains "create-routine method" "$curl_args" "-X POST"

configure_mock 0 200 '{"deleted":true}'
run_mw delete-routine npc1 routine1
curl_args=$(get_curl_log)
assert_contains "delete-routine URL" "$curl_args" "/npcs/npc1/routines/routine1"

run_mw create-routine npc1
assert_exit_code "create-routine missing body exits 1" 1

# ── 17. Memory & Conversation Commands ───────────────────────────

section "17. Memory & conversation commands"

configure_mock 0 200 '{"results":[]}'
run_mw search-memories npc1 '{"query":"hello"}'
curl_args=$(get_curl_log)
assert_contains "search-memories method" "$curl_args" "-X POST"
assert_contains "search-memories URL" "$curl_args" "/npcs/npc1/memories/search"

configure_mock 0 200 '{"messages":[]}'
run_mw get-messages conv1
curl_args=$(get_curl_log)
assert_contains "get-messages default limit" "$curl_args" "limit=50"

configure_mock 0 200 '{"messages":[]}'
run_mw export-conversation conv1
curl_args=$(get_curl_log)
assert_contains "export-conversation limit" "$curl_args" "limit=1000"

configure_mock 0 200 '{"memories":[]}'
run_mw list-memories npc1
curl_args=$(get_curl_log)
assert_contains "list-memories URL" "$curl_args" "/npcs/npc1/memories"

configure_mock 0 200 '{"id":"mem1"}'
run_mw get-memory npc1 mem1
curl_args=$(get_curl_log)
assert_contains "get-memory URL" "$curl_args" "/npcs/npc1/memories/mem1"

# ── 18. Discord Workflow Simulation ──────────────────────────────

section "18. Discord workflow simulation"

# Simulate: A user sends a message in Discord channel #tavern
# Full flow: bind NPC → resolve channel → send message → verify response

# Step 1: Bind NPC "elena" to Discord channel (snowflake ID)
configure_mock 0 200 '{"npc_id":"elena-001","platform":"discord","platform_channel_id":"1122334455667788"}'
run_mw bind-channel elena-001 discord 1122334455667788
curl_args=$(get_curl_log)
assert_contains "discord bind platform" "$curl_args" '"platform":"discord"'
assert_contains "discord bind npc_id" "$curl_args" '"npc_id":"elena-001"'
assert_contains "discord bind channel" "$curl_args" '"platform_channel_id":"1122334455667788"'
assert_exit_code "discord bind exits 0" 0

# Step 2: Resolve channel — who is the NPC in this channel?
configure_mock 0 200 '{"npc_id":"elena-001","platform":"discord","platform_channel_id":"1122334455667788"}'
run_mw resolve-channel discord 1122334455667788
curl_args=$(get_curl_log)
assert_contains "discord resolve platform" "$curl_args" "platform=discord"
assert_contains "discord resolve channel" "$curl_args" "platform_channel_id=1122334455667788"
assert_contains "discord resolve response" "$LAST_STDOUT" "elena-001"
assert_exit_code "discord resolve exits 0" 0

# Step 3: Discord user sends a message, NPC responds
configure_mock 0 200 '{"response":"Ah, welcome traveler! Come sit by the fire. What brings you to my tavern today?","npc_id":"elena-001"}'
run_mw chat-bot elena-001 discord 998877665544 "Hey Elena, how are you?"
curl_args=$(get_curl_log)
assert_contains "discord chat method" "$curl_args" "-X POST"
assert_contains "discord chat URL" "$curl_args" "/npcs/elena-001/chat/bot"
assert_contains "discord chat platform" "$curl_args" '"platform":"discord"'
assert_contains "discord chat user_id" "$curl_args" '"platform_user_id":"998877665544"'
assert_contains "discord chat message" "$curl_args" "Hey Elena, how are you?"
assert_contains "discord NPC response" "$LAST_STDOUT" "welcome traveler"
assert_exit_code "discord chat exits 0" 0

# Step 4: Discord-specific — message with mention and markdown
configure_mock 0 200 '{"response":"Yes, I saw them earlier!"}'
run_mw chat-bot elena-001 discord 998877665544 'Hey <@123456>, check **this** out!'
curl_args=$(get_curl_log)
assert_contains "discord mention preserved" "$curl_args" "<@123456>"
assert_contains "discord markdown preserved" "$curl_args" "**this**"
assert_exit_code "discord mention msg exits 0" 0

# Step 5: Unbind when done
configure_mock 0 200 '{"unbound":true}'
run_mw unbind-channel discord 1122334455667788
curl_args=$(get_curl_log)
assert_contains "discord unbind platform" "$curl_args" '"platform":"discord"'
assert_contains "discord unbind channel" "$curl_args" '"platform_channel_id":"1122334455667788"'
assert_exit_code "discord unbind exits 0" 0

# ── 19. Telegram Workflow Simulation ─────────────────────────────

section "19. Telegram workflow simulation"

# Simulate: A user sends a message in a Telegram group
# Full flow: bind NPC → resolve group → send message → verify response

# Step 1: Bind NPC to Telegram group (negative group ID)
configure_mock 0 200 '{"npc_id":"elena-001","platform":"telegram","platform_channel_id":"-1001234567890"}'
run_mw bind-channel elena-001 telegram -1001234567890
curl_args=$(get_curl_log)
assert_contains "telegram bind platform" "$curl_args" '"platform":"telegram"'
assert_contains "telegram bind negative id" "$curl_args" '"platform_channel_id":"-1001234567890"'
assert_exit_code "telegram bind exits 0" 0

# Step 2: Resolve group — negative ID should not be URL-encoded (- is unreserved)
configure_mock 0 200 '{"npc_id":"elena-001","platform":"telegram","platform_channel_id":"-1001234567890"}'
run_mw resolve-channel telegram -1001234567890
curl_args=$(get_curl_log)
assert_contains "telegram resolve platform" "$curl_args" "platform=telegram"
assert_contains "telegram resolve negative id" "$curl_args" "platform_channel_id=-1001234567890"
assert_contains "telegram resolve response" "$LAST_STDOUT" "elena-001"
assert_exit_code "telegram resolve exits 0" 0

# Step 3: Telegram user sends a message, NPC responds
configure_mock 0 200 '{"response":"Bonjour ! Je suis Elena, la taverniere. Que puis-je faire pour vous ?","npc_id":"elena-001"}'
run_mw chat-bot elena-001 telegram 112233 "Bonjour depuis Telegram!"
curl_args=$(get_curl_log)
assert_contains "telegram chat method" "$curl_args" "-X POST"
assert_contains "telegram chat URL" "$curl_args" "/npcs/elena-001/chat/bot"
assert_contains "telegram chat platform" "$curl_args" '"platform":"telegram"'
assert_contains "telegram chat user_id" "$curl_args" '"platform_user_id":"112233"'
assert_contains "telegram chat message" "$curl_args" "Bonjour depuis Telegram!"
assert_contains "telegram NPC response" "$LAST_STDOUT" "taverniere"
assert_exit_code "telegram chat exits 0" 0

# Step 4: Telegram — message with emoji and unicode
configure_mock 0 200 '{"response":"I love games too!"}'
run_mw chat-bot elena-001 telegram 112233 'Let us play a game! 🎮'
curl_args=$(get_curl_log)
assert_contains "telegram emoji preserved" "$curl_args" '🎮'
assert_exit_code "telegram emoji msg exits 0" 0

# Step 5: Unbind when done
configure_mock 0 200 '{"unbound":true}'
run_mw unbind-channel telegram -1001234567890
curl_args=$(get_curl_log)
assert_contains "telegram unbind platform" "$curl_args" '"platform":"telegram"'
assert_contains "telegram unbind negative id" "$curl_args" '"platform_channel_id":"-1001234567890"'
assert_exit_code "telegram unbind exits 0" 0

# ── 20. Cross-Platform Comparison ────────────────────────────────

section "20. Cross-platform comparison"

# Same NPC, same message, two platforms — verify platform isolation

configure_mock 0 200 '{"response":"Discord reply"}'
run_mw chat-bot npc1 discord 111 "Hello world"
curl_args_discord=$(get_curl_log)

configure_mock 0 200 '{"response":"Telegram reply"}'
run_mw chat-bot npc1 telegram 222 "Hello world"
curl_args_telegram=$(get_curl_log)

# Verify each platform is correctly tagged
assert_contains "cross-platform discord" "$curl_args_discord" '"platform":"discord"'
assert_contains "cross-platform telegram" "$curl_args_telegram" '"platform":"telegram"'

# Verify different user IDs
assert_contains "cross-platform discord uid" "$curl_args_discord" '"platform_user_id":"111"'
assert_contains "cross-platform telegram uid" "$curl_args_telegram" '"platform_user_id":"222"'

# Verify both use same endpoint pattern
assert_contains "cross-platform discord URL" "$curl_args_discord" "/npcs/npc1/chat/bot"
assert_contains "cross-platform telegram URL" "$curl_args_telegram" "/npcs/npc1/chat/bot"

# ── 21. Player Commands ──────────────────────────────────────────────

section "21. Player commands"

# request-link-code
configure_mock 0 200 '{"code":"A3X7K2","expires_in":300}'
run_mw request-link-code telegram 12345
curl_args=$(get_curl_log)
assert_contains "request-link-code method" "$curl_args" "-X POST"
assert_contains "request-link-code URL" "$curl_args" "/players/request-code"
assert_contains "request-link-code platform" "$curl_args" '"platform":"telegram"'
assert_contains "request-link-code user_id" "$curl_args" '"platform_user_id":"12345"'
assert_exit_code "request-link-code exits 0" 0

# request-link-code missing args
run_mw request-link-code
assert_exit_code "request-link-code missing platform exits 1" 1
run_mw request-link-code telegram
assert_exit_code "request-link-code missing user_id exits 1" 1

# verify-link
configure_mock 0 200 '{"player_id":"uuid-123","linked_platforms":["telegram","roblox"]}'
run_mw verify-link A3X7K2 roblox 67890
curl_args=$(get_curl_log)
assert_contains "verify-link method" "$curl_args" "-X POST"
assert_contains "verify-link URL" "$curl_args" "/players/verify-link"
assert_contains "verify-link code" "$curl_args" '"code":"A3X7K2"'
assert_contains "verify-link platform" "$curl_args" '"platform":"roblox"'
assert_contains "verify-link user_id" "$curl_args" '"platform_user_id":"67890"'
assert_exit_code "verify-link exits 0" 0

# verify-link missing args
run_mw verify-link
assert_exit_code "verify-link missing code exits 1" 1
run_mw verify-link A3X7K2
assert_exit_code "verify-link missing platform exits 1" 1
run_mw verify-link A3X7K2 roblox
assert_exit_code "verify-link missing user_id exits 1" 1

# resolve-player
configure_mock 0 200 '{"player_id":"uuid-123","display_name":null,"links":[{"platform":"telegram","platform_user_id":"12345"}]}'
run_mw resolve-player telegram 12345
curl_args=$(get_curl_log)
assert_contains "resolve-player method" "$curl_args" "-X GET"
assert_contains "resolve-player URL" "$curl_args" "/players/resolve"
assert_contains "resolve-player platform param" "$curl_args" "platform=telegram"
assert_contains "resolve-player user_id param" "$curl_args" "platform_user_id=12345"
assert_exit_code "resolve-player exits 0" 0

# resolve-player missing args
run_mw resolve-player
assert_exit_code "resolve-player missing platform exits 1" 1
run_mw resolve-player telegram
assert_exit_code "resolve-player missing user_id exits 1" 1

# list-player-links
configure_mock 0 200 '{"links":[{"platform":"telegram","platform_user_id":"12345"}]}'
run_mw list-player-links uuid-123
curl_args=$(get_curl_log)
assert_contains "list-player-links method" "$curl_args" "-X GET"
assert_contains "list-player-links URL" "$curl_args" "/players/uuid-123/links"
assert_exit_code "list-player-links exits 0" 0

# list-player-links missing args
run_mw list-player-links
assert_exit_code "list-player-links missing id exits 1" 1

# unlink-player
configure_mock 0 200 '{"unlinked":true}'
run_mw unlink-player telegram 12345
curl_args=$(get_curl_log)
assert_contains "unlink-player method" "$curl_args" "-X DELETE"
assert_contains "unlink-player URL" "$curl_args" "/players/unlink"
assert_contains "unlink-player platform" "$curl_args" '"platform":"telegram"'
assert_contains "unlink-player user_id" "$curl_args" '"platform_user_id":"12345"'
assert_exit_code "unlink-player exits 0" 0

# unlink-player missing args
run_mw unlink-player
assert_exit_code "unlink-player missing platform exits 1" 1
run_mw unlink-player telegram
assert_exit_code "unlink-player missing user_id exits 1" 1

# ─── Summary ────────────────────────────────────────────────────────

printf "\n──────────────────────────────────\n"
total=$((PASS_COUNT + FAIL_COUNT))
printf "Results: %d/%d passed" "$PASS_COUNT" "$total"

if [ "$FAIL_COUNT" -gt 0 ]; then
  printf ", %d FAILED\n" "$FAIL_COUNT"
  exit 1
else
  printf "\nAll tests passed.\n"
  exit 0
fi
