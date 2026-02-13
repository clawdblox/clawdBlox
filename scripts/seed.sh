#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────
# MemoryWeave Seed Script
# Creates 2 accounts + mock data for account 2
# Usage: ./scripts/seed.sh [BASE_URL]
# ──────────────────────────────────────────────

BASE_URL="${1:-http://localhost:3000}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${CYAN}[INFO]${NC}  $1"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
fail()  { echo -e "${RED}[FAIL]${NC}  $1"; }

# ──────────────────────────────────────────────
# 1. Create Account 1 — admin (empty project)
# ──────────────────────────────────────────────
info "Creating account 1: admin@clawdblox.xyz ..."

RESP1=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/admin/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@clawdblox.xyz",
    "password": "adminadmin",
    "display_name": "Admin",
    "project_name": "ClawdBlox Dev"
  }')

HTTP1=$(echo "$RESP1" | tail -1)
BODY1=$(echo "$RESP1" | sed '$d')

if [ "$HTTP1" = "201" ]; then
  API_KEY_1=$(echo "$BODY1" | python3 -c "import sys,json; print(json.load(sys.stdin)['api_key'])" 2>/dev/null || echo "PARSE_ERROR")
  ok "Account 1 created"
  echo -e "  ${GREEN}API KEY 1: ${API_KEY_1}${NC}"
elif [ "$HTTP1" = "409" ]; then
  warn "Account 1 already exists (409) — skipping"
  API_KEY_1="ALREADY_EXISTS"
else
  fail "Account 1 failed (HTTP $HTTP1): $BODY1"
  exit 1
fi

# ──────────────────────────────────────────────
# 2. Create Account 2 — mock (pre-filled project)
# ──────────────────────────────────────────────
info "Creating account 2: mock@clawdblox.xyz ..."

RESP2=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/admin/setup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mock@clawdblox.xyz",
    "password": "adminmock",
    "display_name": "Mock Admin",
    "project_name": "ClawdBlox Mock"
  }')

HTTP2=$(echo "$RESP2" | tail -1)
BODY2=$(echo "$RESP2" | sed '$d')

if [ "$HTTP2" = "201" ]; then
  API_KEY_2=$(echo "$BODY2" | python3 -c "import sys,json; print(json.load(sys.stdin)['api_key'])" 2>/dev/null || echo "PARSE_ERROR")
  ok "Account 2 created"
  echo -e "  ${GREEN}API KEY 2: ${API_KEY_2}${NC}"
elif [ "$HTTP2" = "409" ]; then
  warn "Account 2 already exists (409)"
  fail "Cannot seed data without the API key. Delete the account or provide the key manually."
  exit 1
else
  fail "Account 2 failed (HTTP $HTTP2): $BODY2"
  exit 1
fi

# ──────────────────────────────────────────────
# Helper: POST with API key
# ──────────────────────────────────────────────
api_post() {
  local path="$1"
  local data="$2"
  local resp
  resp=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$path" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY_2" \
    -d "$data")
  local http=$(echo "$resp" | tail -1)
  local body=$(echo "$resp" | sed '$d')

  if [ "$http" = "201" ]; then
    echo "$body"
  else
    fail "POST $path failed (HTTP $http): $body"
    return 1
  fi
}

# ──────────────────────────────────────────────
# 3. Create NPCs
# ──────────────────────────────────────────────
info "Creating NPC 1: Elara the Blacksmith ..."

NPC1_RESP=$(api_post "/api/v1/npcs" '{
  "name": "Elara the Blacksmith",
  "backstory": "Elara grew up in the mountain village of Ironpeak, where her family has forged weapons and armor for five generations. After losing her father to a dragon attack, she vowed to craft the strongest armor the realm has ever seen. She is known for her fiery temper but generous heart, often repairing tools for poor farmers at no cost.",
  "personality": {
    "openness": 0.6,
    "conscientiousness": 0.9,
    "extraversion": 0.4,
    "agreeableness": 0.7,
    "neuroticism": 0.3,
    "traits": ["perfectionist", "stubborn", "loyal"],
    "values": ["craftsmanship", "family legacy", "protecting the weak"],
    "fears": ["dragons", "losing another loved one"],
    "desires": ["forge a legendary armor", "rebuild Ironpeak"]
  },
  "speaking_style": {
    "vocabulary_level": "moderate",
    "formality": "casual",
    "humor": "subtle",
    "verbosity": "concise",
    "quirks": ["uses forge metaphors", "taps her hammer when thinking"],
    "catchphrases": ["Steel doesnt lie.", "You cant rush good metalwork."],
    "accent": "slight dwarven"
  },
  "mood": "focused"
}')

NPC1_ID=$(echo "$NPC1_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['npc']['id'])" 2>/dev/null)
if [ -n "$NPC1_ID" ]; then
  ok "Elara created (ID: $NPC1_ID)"
else
  fail "Could not parse Elara's ID"
  exit 1
fi

info "Creating NPC 2: Thoren the Innkeeper ..."

NPC2_RESP=$(api_post "/api/v1/npcs" '{
  "name": "Thoren the Innkeeper",
  "backstory": "Thoren was once a traveling bard who visited every corner of the continent. After a knee injury ended his wandering days, he settled down and opened The Golden Tankard, the most popular inn in Millhaven. His inn is a hub for travelers, merchants, and adventurers alike. He knows every rumor and secret that passes through town.",
  "personality": {
    "openness": 0.8,
    "conscientiousness": 0.5,
    "extraversion": 0.9,
    "agreeableness": 0.8,
    "neuroticism": 0.2,
    "traits": ["charismatic", "gossipy", "warm-hearted"],
    "values": ["hospitality", "good stories", "community"],
    "fears": ["silence", "being forgotten"],
    "desires": ["hear every story in the world", "make The Golden Tankard legendary"]
  },
  "speaking_style": {
    "vocabulary_level": "advanced",
    "formality": "casual",
    "humor": "frequent",
    "verbosity": "verbose",
    "quirks": ["breaks into song mid-sentence", "gives everyone a nickname"],
    "catchphrases": ["Pull up a chair, friend!", "Now THATS a tale worth a free ale!"],
    "accent": "jovial bardic"
  },
  "mood": "cheerful"
}')

NPC2_ID=$(echo "$NPC2_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['npc']['id'])" 2>/dev/null)
if [ -n "$NPC2_ID" ]; then
  ok "Thoren created (ID: $NPC2_ID)"
else
  fail "Could not parse Thoren's ID"
  exit 1
fi

# ──────────────────────────────────────────────
# 4. Create Routines (3 per NPC)
# ──────────────────────────────────────────────
info "Creating routines for Elara ..."

api_post "/api/v1/npcs/$NPC1_ID/routines" '{
  "name": "Morning Forging",
  "start_hour": 6,
  "end_hour": 12,
  "day_of_week": [1,2,3,4,5],
  "location": "Ironpeak Forge",
  "activity": "Heating the furnace and working on commissions. Hammering metal, shaping blades and armor plates.",
  "interruptible": false,
  "priority": 9
}' > /dev/null && ok "  Routine: Morning Forging"

api_post "/api/v1/npcs/$NPC1_ID/routines" '{
  "name": "Afternoon Market",
  "start_hour": 13,
  "end_hour": 17,
  "day_of_week": [1,2,3,4,5,6],
  "location": "Millhaven Market Square",
  "activity": "Selling finished weapons and armor, taking new orders, chatting with customers.",
  "interruptible": true,
  "priority": 6
}' > /dev/null && ok "  Routine: Afternoon Market"

api_post "/api/v1/npcs/$NPC1_ID/routines" '{
  "name": "Evening Rest",
  "start_hour": 19,
  "end_hour": 22,
  "day_of_week": [0,1,2,3,4,5,6],
  "location": "The Golden Tankard",
  "activity": "Relaxing at Thorens inn, having a meal and an ale, sharing stories about her day.",
  "interruptible": true,
  "priority": 3
}' > /dev/null && ok "  Routine: Evening Rest"

info "Creating routines for Thoren ..."

api_post "/api/v1/npcs/$NPC2_ID/routines" '{
  "name": "Morning Prep",
  "start_hour": 7,
  "end_hour": 11,
  "day_of_week": [0,1,2,3,4,5,6],
  "location": "The Golden Tankard - Kitchen",
  "activity": "Preparing meals for the day, checking supplies, cleaning the common room.",
  "interruptible": true,
  "priority": 7
}' > /dev/null && ok "  Routine: Morning Prep"

api_post "/api/v1/npcs/$NPC2_ID/routines" '{
  "name": "Afternoon Service",
  "start_hour": 11,
  "end_hour": 18,
  "day_of_week": [0,1,2,3,4,5,6],
  "location": "The Golden Tankard - Common Room",
  "activity": "Serving food and drinks, welcoming travelers, collecting gossip and rumors.",
  "interruptible": true,
  "priority": 8
}' > /dev/null && ok "  Routine: Afternoon Service"

api_post "/api/v1/npcs/$NPC2_ID/routines" '{
  "name": "Evening Entertainment",
  "start_hour": 19,
  "end_hour": 23,
  "day_of_week": [4,5,6],
  "location": "The Golden Tankard - Stage",
  "activity": "Performing old ballads on his lute, hosting storytelling contests, entertaining the crowd.",
  "interruptible": false,
  "priority": 9
}' > /dev/null && ok "  Routine: Evening Entertainment"

# ──────────────────────────────────────────────
# 5. Create Goals (2 per NPC)
# ──────────────────────────────────────────────
info "Creating goals for Elara ..."

api_post "/api/v1/npcs/$NPC1_ID/goals" '{
  "title": "Forge the Dragonscale Armor",
  "goal_type": "personal",
  "priority": 10,
  "success_criteria": [
    "Obtain a genuine dragon scale from a slain dragon",
    "Master the ancient Ironpeak tempering technique",
    "Complete the full armor set (helm, chest, greaves, gauntlets)"
  ]
}' > /dev/null && ok "  Goal: Forge the Dragonscale Armor"

api_post "/api/v1/npcs/$NPC1_ID/goals" '{
  "title": "Rebuild the Ironpeak Smithing Guild",
  "goal_type": "professional",
  "priority": 7,
  "success_criteria": [
    "Recruit at least 3 apprentice blacksmiths",
    "Restore the old guild hall in Ironpeak",
    "Establish trade agreements with 2 neighboring towns"
  ]
}' > /dev/null && ok "  Goal: Rebuild the Ironpeak Smithing Guild"

info "Creating goals for Thoren ..."

api_post "/api/v1/npcs/$NPC2_ID/goals" '{
  "title": "Compile the Grand Chronicle",
  "goal_type": "personal",
  "priority": 8,
  "success_criteria": [
    "Collect 100 unique traveler stories",
    "Commission a scribe to bind the chronicle",
    "Have the chronicle displayed in the town library"
  ]
}' > /dev/null && ok "  Goal: Compile the Grand Chronicle"

api_post "/api/v1/npcs/$NPC2_ID/goals" '{
  "title": "Expand The Golden Tankard",
  "goal_type": "professional",
  "priority": 6,
  "success_criteria": [
    "Save enough gold to buy the adjacent building",
    "Add a private dining room for VIP guests",
    "Hire a second cook and a barmaid"
  ]
}' > /dev/null && ok "  Goal: Expand The Golden Tankard"

# ──────────────────────────────────────────────
# 6. Create Relationships (2 per NPC)
# ──────────────────────────────────────────────
info "Creating relationships for Elara ..."

api_post "/api/v1/npcs/$NPC1_ID/relationships" '{
  "target_type": "player",
  "target_id": "player_sir_aldric",
  "affinity": 0.6,
  "trust": 0.7
}' > /dev/null && ok "  Relationship: Sir Aldric (loyal customer)"

api_post "/api/v1/npcs/$NPC1_ID/relationships" '{
  "target_type": "npc",
  "target_id": "'"$NPC2_ID"'",
  "affinity": 0.8,
  "trust": 0.9
}' > /dev/null && ok "  Relationship: Thoren (close friend)"

info "Creating relationships for Thoren ..."

api_post "/api/v1/npcs/$NPC2_ID/relationships" '{
  "target_type": "player",
  "target_id": "player_wanderer_kai",
  "affinity": 0.4,
  "trust": 0.3
}' > /dev/null && ok "  Relationship: Wanderer Kai (mysterious regular)"

api_post "/api/v1/npcs/$NPC2_ID/relationships" '{
  "target_type": "npc",
  "target_id": "'"$NPC1_ID"'",
  "affinity": 0.8,
  "trust": 0.9
}' > /dev/null && ok "  Relationship: Elara (close friend)"

# ──────────────────────────────────────────────
# Summary
# ──────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SEED COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Account 1: ${CYAN}admin@clawdblox.xyz${NC} / adminadmin"
echo -e "  API Key 1: ${YELLOW}${API_KEY_1}${NC}"
echo ""
echo -e "  Account 2: ${CYAN}mock@clawdblox.xyz${NC} / adminmock"
echo -e "  API Key 2: ${YELLOW}${API_KEY_2}${NC}"
echo ""
echo -e "  Mock data: 2 NPCs, 6 routines, 4 goals, 4 relationships"
echo ""
echo -e "${RED}  SAVE THESE API KEYS — they cannot be retrieved later!${NC}"
echo ""
