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
_mw_stdout="$TEST_DIR/stdout"
_mw_stderr="$TEST_DIR/stderr"
set +e
PATH="$TEST_DIR/bin:$PATH" \
  TEST_DIR="$TEST_DIR" \
  MEMORYWEAVE_API_KEY="test-key-123" \
  MEMORYWEAVE_BASE_URL="http://mock:3000" \
  MW_NO_COLOR=1 \
  MW_DEBUG=1 \
  MW_TIMEOUT=5 \
  sh "$MW_SCRIPT" stats >"$_mw_stdout" 2>"$_mw_stderr"
_mw_exit=$?
set -e
LAST_STDOUT=$(cat "$_mw_stdout")
LAST_STDERR=$(cat "$_mw_stderr")
LAST_EXIT=$_mw_exit

assert_contains "debug shows [DEBUG]" "$LAST_STDERR" "[DEBUG]"
assert_contains "debug shows method" "$LAST_STDERR" "GET"
assert_exit_code "debug still exits 0" 0

# ── 9. Raw Output ──────────────────────────────────────────────────

section "9. Raw output (MW_RAW)"

configure_mock 0 200 '{"raw":true}'

# MW_RAW=1 should output unformatted JSON
_mw_stdout="$TEST_DIR/stdout"
_mw_stderr="$TEST_DIR/stderr"
set +e
PATH="$TEST_DIR/bin:$PATH" \
  TEST_DIR="$TEST_DIR" \
  MEMORYWEAVE_API_KEY="test-key-123" \
  MEMORYWEAVE_BASE_URL="http://mock:3000" \
  MW_NO_COLOR=1 \
  MW_RAW=1 \
  MW_TIMEOUT=5 \
  sh "$MW_SCRIPT" stats >"$_mw_stdout" 2>"$_mw_stderr"
_mw_exit=$?
set -e
LAST_STDOUT=$(cat "$_mw_stdout")
LAST_STDERR=$(cat "$_mw_stderr")
LAST_EXIT=$_mw_exit

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
