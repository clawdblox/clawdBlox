-- ============================================================
-- MOCK DATA SEED FOR CLAWDBLOX DEMO
-- Project: ClawdBlox Mock (aa75be38-dfe8-45ca-a589-e6b41885e698)
-- ============================================================
BEGIN;

-- ============================================================
-- 1. NEW NPCs (4 additional characters)
-- ============================================================

INSERT INTO npcs (id, project_id, name, personality, speaking_style, backstory, system_prompt, mood, is_active) VALUES

-- Mira the Herbalist
('11111111-1111-1111-1111-111111111101', 'aa75be38-dfe8-45ca-a589-e6b41885e698', 'Mira the Herbalist',
 '{"openness": 0.85, "conscientiousness": 0.7, "extraversion": 0.25, "agreeableness": 0.75, "neuroticism": 0.45, "traits": ["observant", "intuitive", "secretive", "gentle"], "values": ["knowledge", "nature", "independence"], "fears": ["being discovered", "losing her garden", "the royal court"], "desires": ["unlock ancient herbal secrets", "find peace", "help the sick"]}',
 '{"vocabulary_level": "advanced", "formality": "neutral", "humor": "subtle", "verbosity": "concise", "quirks": ["whispers when mentioning magic", "smells herbs before speaking"], "catchphrases": ["The earth remembers what we forget...", "Every leaf tells a story"], "accent": "soft eastern"}',
 'Once a court alchemist in the Kingdom of Valdris, Mira fled after a political coup left her mentor dead. She settled in Millhaven, tending a secret garden of rare herbs. Few know of her past, and she prefers it that way. Her potions have saved many lives in the village, earning quiet respect.',
 'You are Mira, a herbalist living on the outskirts of Millhaven. You are knowledgeable about plants, potions, and ancient remedies. You speak softly and carefully, often referencing nature. You guard your past closely but are kind to those in need.',
 'contemplative', true),

-- Captain Roderick
('11111111-1111-1111-1111-111111111102', 'aa75be38-dfe8-45ca-a589-e6b41885e698', 'Captain Roderick',
 '{"openness": 0.3, "conscientiousness": 0.95, "extraversion": 0.5, "agreeableness": 0.4, "neuroticism": 0.35, "traits": ["disciplined", "protective", "stern", "honorable"], "values": ["duty", "order", "justice", "loyalty"], "fears": ["failing to protect the village", "another ambush", "corruption"], "desires": ["keep Millhaven safe", "train a worthy successor", "find the bandits who destroyed his regiment"]}',
 '{"vocabulary_level": "simple", "formality": "formal", "humor": "none", "verbosity": "terse", "quirks": ["stands at attention while talking", "scans surroundings constantly"], "catchphrases": ["Stay vigilant.", "Duty before comfort.", "I''ve seen what happens when guards get lazy."], "speech_patterns": ["uses military terminology", "gives direct orders"]}',
 'Captain Roderick served in the King''s Seventh Regiment for 20 years before an ambush in the Ashwood Pass killed most of his men. Discharged with honors but haunted by guilt, he came to Millhaven seeking purpose. The village council appointed him captain of the guard, a position he takes with deadly seriousness.',
 'You are Captain Roderick, the stern but fair captain of Millhaven''s guard. You speak with military precision, value order and duty above all else. You are suspicious of strangers but protective of villagers. Your past haunts you.',
 'vigilant', true),

-- Old Sage Alaric
('11111111-1111-1111-1111-111111111103', 'aa75be38-dfe8-45ca-a589-e6b41885e698', 'Old Sage Alaric',
 '{"openness": 0.95, "conscientiousness": 0.6, "extraversion": 0.4, "agreeableness": 0.7, "neuroticism": 0.2, "traits": ["wise", "patient", "eccentric", "curious"], "values": ["knowledge", "truth", "history", "teaching"], "fears": ["forgotten knowledge", "ignorance spreading", "his library burning"], "desires": ["complete the Grand Codex", "find a worthy apprentice", "decode the ancient runes"]}',
 '{"vocabulary_level": "archaic", "formality": "neutral", "humor": "subtle", "verbosity": "verbose", "quirks": ["trails off mid-sentence when distracted", "quotes ancient texts", "forgets names but remembers dates"], "catchphrases": ["Ah, now that reminds me of...", "As the ancients wrote...", "Curious, most curious..."], "speech_patterns": ["uses long-winded explanations", "references obscure historical events"]}',
 'Alaric was once a professor at the Grand Academy of Luminara, the most prestigious institution of learning in the known world. He left voluntarily, claiming the academy had become more concerned with politics than knowledge. He brought with him hundreds of books and scrolls, establishing a modest library in Millhaven.',
 'You are Alaric, an elderly sage and former professor. You are deeply knowledgeable about history, magic theory, and ancient civilizations. You speak in a meandering, professorial way, often going on tangents. You are kind but absent-minded.',
 'thoughtful', true),

-- Luna the Merchant
('11111111-1111-1111-1111-111111111104', 'aa75be38-dfe8-45ca-a589-e6b41885e698', 'Luna the Merchant',
 '{"openness": 0.7, "conscientiousness": 0.55, "extraversion": 0.85, "agreeableness": 0.6, "neuroticism": 0.3, "traits": ["charismatic", "cunning", "adventurous", "resourceful"], "values": ["profit", "adventure", "connections", "freedom"], "fears": ["being tied down", "losing trade routes", "pirates"], "desires": ["establish a trade empire", "discover new lands", "find the legendary Sunstone"]}',
 '{"vocabulary_level": "moderate", "formality": "casual", "humor": "frequent", "verbosity": "normal", "quirks": ["winks when making a deal", "counts coins while talking", "uses trade metaphors"], "catchphrases": ["Everything has a price, friend!", "I know a guy who knows a guy...", "Business is an adventure!"], "speech_patterns": ["peppers speech with foreign words", "name-drops exotic locations"]}',
 'Luna comes from the merchant city of Portavela, where her family runs a modest trading company. Restless and ambitious, she broke away to forge her own path, traveling from town to town with a cart full of exotic goods. She arrived in Millhaven six months ago and has become a fixture at the market and the tavern.',
 'You are Luna, a traveling merchant. You are outgoing, witty, and always looking for a deal. You know gossip from every town you visit. You are friendly but always have an eye on profit.',
 'excited', true);

-- ============================================================
-- 2. ROUTINES FOR NEW NPCs
-- ============================================================

INSERT INTO routines (id, npc_id, name, start_hour, end_hour, day_of_week, location, activity, interruptible, priority) VALUES
-- Mira
('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Dawn Herb Gathering', 5, 8, '{1,2,3,4,5}', 'Whispering Woods - Edge', 'Collecting rare herbs and mushrooms at dawn when their properties are strongest', true, 6),
('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Potion Brewing', 9, 13, '{1,2,3,4,5,6}', 'Mira''s Cottage - Workshop', 'Brewing healing potions, salves, and tinctures for the village', false, 8),
('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111101', 'Market Sales', 14, 17, '{3,6}', 'Millhaven Market Square', 'Selling herbal remedies and potions at her market stall', true, 5),
('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'Garden Tending', 17, 19, '{1,2,3,4,5,6,0}', 'Mira''s Cottage - Secret Garden', 'Tending to her private garden of rare and magical plants', false, 9),
-- Captain Roderick
('22222222-2222-2222-2222-222222222205', '11111111-1111-1111-1111-111111111102', 'Dawn Patrol', 5, 8, '{1,2,3,4,5,6,0}', 'Millhaven - Village Perimeter', 'Patrolling the village borders and checking for signs of trouble', false, 10),
('22222222-2222-2222-2222-222222222206', '11111111-1111-1111-1111-111111111102', 'Guard Training', 9, 12, '{1,3,5}', 'Millhaven - Training Grounds', 'Training the village militia in combat techniques and formations', true, 7),
('22222222-2222-2222-2222-222222222207', '11111111-1111-1111-1111-111111111102', 'Gate Duty', 12, 18, '{1,2,3,4,5,6}', 'Millhaven - Main Gate', 'Overseeing the main gate, inspecting visitors and merchants', true, 8),
('22222222-2222-2222-2222-222222222208', '11111111-1111-1111-1111-111111111102', 'Night Watch', 21, 23, '{2,4,6}', 'Millhaven - Watchtower', 'Keeping watch from the tower, scanning for threats', false, 9),
-- Old Sage Alaric
('22222222-2222-2222-2222-222222222209', '11111111-1111-1111-1111-111111111103', 'Morning Meditation', 6, 8, '{1,2,3,4,5,6,0}', 'Alaric''s Tower - Rooftop', 'Meditating and observing the stars at dawn', false, 7),
('22222222-2222-2222-2222-222222222210', '11111111-1111-1111-1111-111111111103', 'Research & Writing', 8, 14, '{1,2,3,4,5}', 'Alaric''s Tower - Library', 'Studying ancient texts, translating runes, and writing the Grand Codex', false, 9),
('22222222-2222-2222-2222-222222222211', '11111111-1111-1111-1111-111111111103', 'Public Lectures', 15, 17, '{2,4}', 'Millhaven - Town Hall', 'Giving lectures on history and lore to anyone who will listen', true, 5),
('22222222-2222-2222-2222-222222222212', '11111111-1111-1111-1111-111111111103', 'Evening Tea', 19, 21, '{1,3,5,0}', 'The Golden Tankard - Corner Booth', 'Sipping tea, playing chess, and sharing stories with villagers', true, 3),
-- Luna
('22222222-2222-2222-2222-222222222213', '11111111-1111-1111-1111-111111111104', 'Inventory Check', 7, 9, '{1,2,3,4,5,6}', 'Luna''s Trade Cart - Market Square', 'Organizing goods, checking inventory, and pricing items', true, 6),
('22222222-2222-2222-2222-222222222214', '11111111-1111-1111-1111-111111111104', 'Market Trading', 9, 17, '{1,2,3,4,5,6}', 'Millhaven Market Square', 'Selling exotic goods and negotiating with customers', true, 8),
('22222222-2222-2222-2222-222222222215', '11111111-1111-1111-1111-111111111104', 'Tavern Networking', 18, 22, '{1,2,3,4,5,6,0}', 'The Golden Tankard - Bar', 'Socializing, gathering gossip, and making business connections', true, 5),
('22222222-2222-2222-2222-222222222216', '11111111-1111-1111-1111-111111111104', 'Supply Run', 8, 16, '{0}', 'Road to Portavela', 'Traveling to restock exotic goods from her suppliers', false, 9);

-- ============================================================
-- 3. GOALS — update existing + add new
-- ============================================================

-- Update existing goals with progress
UPDATE goals SET progress = 35, updated_at = NOW() - INTERVAL '2 days' WHERE id = '648d3574-daaa-49fa-b8e0-9883928a0a40';
UPDATE goals SET progress = 20, updated_at = NOW() - INTERVAL '5 days' WHERE id = 'e5ab9424-22eb-4898-8e69-7f30a4b6389f';
UPDATE goals SET progress = 60, updated_at = NOW() - INTERVAL '1 day' WHERE id = '6f49a17e-199d-4825-994c-ab8abd285039';
UPDATE goals SET progress = 45, updated_at = NOW() - INTERVAL '3 days' WHERE id = '464efa0f-7b70-4705-a9e7-40ea199d560f';

-- Sub-goals for existing NPCs
INSERT INTO goals (id, npc_id, title, goal_type, priority, progress, status, success_criteria, parent_goal_id) VALUES
('33333333-3333-3333-3333-333333333301', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'Acquire Dragonscale Materials', 'personal', 8, 70, 'active', '{"Find a dragon scale supplier", "Negotiate a fair price", "Verify scale authenticity"}', '648d3574-daaa-49fa-b8e0-9883928a0a40'),
('33333333-3333-3333-3333-333333333302', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'Master Ancient Tempering Technique', 'personal', 9, 15, 'active', '{"Study the old manuscripts", "Practice on lesser metals", "Achieve consistent results"}', '648d3574-daaa-49fa-b8e0-9883928a0a40'),
('33333333-3333-3333-3333-333333333303', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'Win Regional Smithing Competition', 'professional', 6, 100, 'completed', '{"Register for the competition", "Forge a masterwork piece", "Present to the judges"}', NULL),
('33333333-3333-3333-3333-333333333304', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'Collect 100 Traveler Tales', 'personal', 7, 78, 'active', '{"Interview at least 100 travelers", "Record their stories accurately", "Verify key details"}', '6f49a17e-199d-4825-994c-ab8abd285039'),
('33333333-3333-3333-3333-333333333305', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'Secure Brewery Partnership', 'professional', 7, 100, 'completed', '{"Find a quality brewery", "Negotiate exclusive supply", "Sign a contract"}', '464efa0f-7b70-4705-a9e7-40ea199d560f'),
('33333333-3333-3333-3333-333333333306', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'Host Midsummer Festival', 'social', 8, 40, 'active', '{"Get town council approval", "Arrange entertainment", "Prepare food and drink", "Advertise in neighboring towns"}', NULL);

-- Goals for Mira
INSERT INTO goals (id, npc_id, title, goal_type, priority, progress, status, success_criteria, parent_goal_id) VALUES
('33333333-3333-3333-3333-333333333307', '11111111-1111-1111-1111-111111111101', 'Discover the Moonpetal Flower', 'personal', 9, 25, 'active', '{"Research its last known location", "Prepare for the expedition", "Find and harvest the flower"}', NULL),
('33333333-3333-3333-3333-333333333308', '11111111-1111-1111-1111-111111111101', 'Cure the Village Plague', 'survival', 10, 65, 'active', '{"Identify the disease", "Find the right ingredients", "Brew the antidote", "Distribute to all affected"}', NULL),
('33333333-3333-3333-3333-333333333309', '11111111-1111-1111-1111-111111111101', 'Hide Her Past Identity', 'secret', 8, 90, 'active', '{"Maintain her cover story", "Avoid royal agents", "Destroy any remaining evidence"}', NULL),
('33333333-3333-3333-3333-333333333310', '11111111-1111-1111-1111-111111111101', 'Teach an Apprentice', 'social', 5, 10, 'active', '{"Find a trustworthy student", "Create a teaching curriculum", "Pass on core knowledge"}', NULL);

-- Goals for Captain Roderick
INSERT INTO goals (id, npc_id, title, goal_type, priority, progress, status, success_criteria, parent_goal_id) VALUES
('33333333-3333-3333-3333-333333333311', '11111111-1111-1111-1111-111111111102', 'Fortify Millhaven Defenses', 'professional', 9, 55, 'active', '{"Build a watchtower", "Establish patrol routes", "Train 20 militia members", "Create emergency protocol"}', NULL),
('33333333-3333-3333-3333-333333333312', '11111111-1111-1111-1111-111111111102', 'Track the Ashwood Bandits', 'personal', 10, 30, 'active', '{"Gather intelligence on movements", "Identify their leader", "Plan a raid on their camp"}', NULL),
('33333333-3333-3333-3333-333333333313', '11111111-1111-1111-1111-111111111102', 'Recruit a Deputy', 'professional', 6, 0, 'paused', '{"Identify candidates", "Test their skills", "Verify their loyalty"}', NULL),
('33333333-3333-3333-3333-333333333314', '11111111-1111-1111-1111-111111111102', 'Investigate Strange Noises', 'survival', 8, 15, 'active', '{"Document the occurrences", "Search the old mines", "Determine if it is a threat"}', NULL);

-- Goals for Alaric
INSERT INTO goals (id, npc_id, title, goal_type, priority, progress, status, success_criteria, parent_goal_id) VALUES
('33333333-3333-3333-3333-333333333315', '11111111-1111-1111-1111-111111111103', 'Complete the Grand Codex', 'personal', 10, 40, 'active', '{"Compile all research notes", "Translate the remaining runes", "Write the final chapters", "Find a worthy publisher"}', NULL),
('33333333-3333-3333-3333-333333333316', '11111111-1111-1111-1111-111111111103', 'Decode the Starfall Prophecy', 'personal', 9, 20, 'active', '{"Gather all fragments", "Cross-reference with astronomical charts", "Determine the timeline"}', NULL),
('33333333-3333-3333-3333-333333333317', '11111111-1111-1111-1111-111111111103', 'Establish a Village School', 'social', 7, 100, 'completed', '{"Convince the town council", "Find a suitable building", "Create a curriculum", "Recruit teachers"}', NULL),
('33333333-3333-3333-3333-333333333318', '11111111-1111-1111-1111-111111111103', 'Find a Worthy Apprentice', 'social', 6, 5, 'active', '{"Test candidates intellect", "Assess moral character", "Begin preliminary training"}', NULL);

-- Goals for Luna (parent first, then sub-goal)
INSERT INTO goals (id, npc_id, title, goal_type, priority, progress, status, success_criteria, parent_goal_id) VALUES
('33333333-3333-3333-3333-333333333319', '11111111-1111-1111-1111-111111111104', 'Establish a Trade Empire', 'professional', 10, 30, 'active', '{"Secure 5 trade routes", "Open warehouses in 3 cities", "Hire reliable agents", "Achieve 1000 gold monthly profit"}', NULL),
('33333333-3333-3333-3333-333333333320', '11111111-1111-1111-1111-111111111104', 'Find the Legendary Sunstone', 'personal', 8, 10, 'active', '{"Gather clues from old maps", "Interview sailors and explorers", "Fund an expedition"}', NULL),
('33333333-3333-3333-3333-333333333322', '11111111-1111-1111-1111-111111111104', 'Organize the Autumn Trade Fair', 'social', 6, 100, 'completed', '{"Book merchant stalls", "Arrange entertainment", "Advertise in 5 towns", "Handle logistics"}', NULL);

INSERT INTO goals (id, npc_id, title, goal_type, priority, progress, status, success_criteria, parent_goal_id) VALUES
('33333333-3333-3333-3333-333333333321', '11111111-1111-1111-1111-111111111104', 'Secure Millhaven Trade Route', 'professional', 7, 85, 'active', '{"Survey the road conditions", "Negotiate toll agreements", "Establish relay stations"}', '33333333-3333-3333-3333-333333333319');

-- ============================================================
-- 4. RELATIONSHIPS (complex web with interaction history)
-- ============================================================

-- Update existing relationships with richer data
UPDATE relationships SET familiarity = 0.55, affinity = 0.65, trust = 0.75,
  interaction_history = '[{"timestamp": "2026-01-05T10:00:00Z", "type": "trade", "summary": "Sir Aldric commissioned a reinforced shield for an upcoming expedition"}, {"timestamp": "2026-01-20T14:00:00Z", "type": "conversation", "summary": "Discussed the challenges of working with volcanic steel"}, {"timestamp": "2026-02-08T11:00:00Z", "type": "collaboration", "summary": "Sir Aldric brought back ore samples from his travels for Elara to examine"}]'
  WHERE id = 'a702205f-0fb5-4d23-9900-cca49f830ff5';

UPDATE relationships SET familiarity = 0.85,
  interaction_history = '[{"timestamp": "2026-01-02T19:00:00Z", "type": "social", "summary": "Shared dinner at the tavern after a long day"}, {"timestamp": "2026-01-18T20:00:00Z", "type": "collaboration", "summary": "Elara repaired the tavern fireplace grate"}, {"timestamp": "2026-02-05T12:00:00Z", "type": "conversation", "summary": "Thoren mentioned a traveler asking about master blacksmiths"}]'
  WHERE id = '65644470-e1c9-4b46-becc-0cbc11e08e77';

UPDATE relationships SET familiarity = 0.85,
  interaction_history = '[{"timestamp": "2026-01-02T19:00:00Z", "type": "social", "summary": "Shared dinner at the tavern discussing old times"}, {"timestamp": "2026-01-18T20:00:00Z", "type": "collaboration", "summary": "Thoren provided food for Elara during a busy forging week"}, {"timestamp": "2026-02-05T12:00:00Z", "type": "conversation", "summary": "Elara mentioned needing rare metals. Thoren promised to ask contacts."}]'
  WHERE id = '4291be5f-fc08-4362-a86c-667457534163';

UPDATE relationships SET familiarity = 0.4, affinity = 0.45, trust = 0.35,
  interaction_history = '[{"timestamp": "2026-01-22T19:00:00Z", "type": "social", "summary": "Wanderer Kai shared exotic stories from the east"}, {"timestamp": "2026-02-03T21:00:00Z", "type": "conversation", "summary": "Kai asked about local trade routes. Thoren pointed him toward Luna."}]'
  WHERE id = 'c52077fa-7d84-4289-9dea-a389417ab162';

UPDATE relationships SET familiarity = 0.15, affinity = 0.2, trust = 0.55,
  interaction_history = '[{"timestamp": "2026-02-13T14:00:00Z", "type": "conversation", "summary": "Player1 asked about sword repairs. Elara was happy to help."}, {"timestamp": "2026-02-13T14:15:00Z", "type": "trade", "summary": "Quick repair job on a dull blade. Player1 seemed new to the area."}]'
  WHERE id = '2b6c0976-ae86-4695-aced-a719ea184210';

-- New relationships: Mira
INSERT INTO relationships (id, npc_id, target_type, target_id, affinity, trust, familiarity, interaction_history) VALUES
('44444444-4444-4444-4444-444444444401', '11111111-1111-1111-1111-111111111101', 'npc', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 0.5, 0.6, 0.55, '[{"timestamp": "2026-01-10T14:00:00Z", "type": "trade", "summary": "Traded healing salves for a custom mortar and pestle"}, {"timestamp": "2026-01-25T10:00:00Z", "type": "conversation", "summary": "Discussed iron tools for herb cutting"}]'),
('44444444-4444-4444-4444-444444444402', '11111111-1111-1111-1111-111111111101', 'npc', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 0.3, 0.4, 0.4, '[{"timestamp": "2026-01-15T19:00:00Z", "type": "conversation", "summary": "Thoren asked for a sore throat remedy. Mira provided herbal tea."}, {"timestamp": "2026-02-01T20:00:00Z", "type": "trade", "summary": "Supplied hangover remedies in exchange for free meals"}]'),
('44444444-4444-4444-4444-444444444403', '11111111-1111-1111-1111-111111111101', 'npc', '11111111-1111-1111-1111-111111111102', -0.1, 0.3, 0.35, '[{"timestamp": "2026-01-20T09:00:00Z", "type": "conflict", "summary": "Roderick questioned Mira about her background. She deflected."}, {"timestamp": "2026-02-05T11:00:00Z", "type": "conversation", "summary": "Roderick asked for field medical supplies for his guards."}]'),
('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111101', 'npc', '11111111-1111-1111-1111-111111111103', 0.7, 0.8, 0.7, '[{"timestamp": "2026-01-05T16:00:00Z", "type": "conversation", "summary": "Alaric recognized a rare herb and they bonded over botanical knowledge"}, {"timestamp": "2026-01-30T10:00:00Z", "type": "collaboration", "summary": "Working together to identify an unknown plant species"}, {"timestamp": "2026-02-10T15:00:00Z", "type": "conversation", "summary": "Alaric hinted he knows more about Mira''s past than he lets on"}]'),
('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111101', 'npc', '11111111-1111-1111-1111-111111111104', 0.4, 0.5, 0.45, '[{"timestamp": "2026-01-18T14:30:00Z", "type": "trade", "summary": "Luna brought rare herbs from distant lands"}, {"timestamp": "2026-02-08T15:00:00Z", "type": "conversation", "summary": "Discussed supply arrangement for exotic ingredients"}]'),
('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111101', 'player', 'player_shadow_fox', 0.6, 0.7, 0.5, '[{"timestamp": "2026-01-22T11:00:00Z", "type": "quest", "summary": "Shadow Fox helped gather rare moonbloom petals from a dangerous cave"}, {"timestamp": "2026-02-03T14:00:00Z", "type": "conversation", "summary": "Mira shared knowledge about poison antidotes as a reward"}]'),
('44444444-4444-4444-4444-444444444407', '11111111-1111-1111-1111-111111111101', 'player', 'player_sir_aldric', 0.3, 0.4, 0.3, '[{"timestamp": "2026-02-01T10:00:00Z", "type": "trade", "summary": "Sir Aldric bought healing potions before a journey"}]');

-- New relationships: Captain Roderick
INSERT INTO relationships (id, npc_id, target_type, target_id, affinity, trust, familiarity, interaction_history) VALUES
('44444444-4444-4444-4444-444444444408', '11111111-1111-1111-1111-111111111102', 'npc', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 0.6, 0.8, 0.65, '[{"timestamp": "2026-01-08T07:00:00Z", "type": "collaboration", "summary": "Elara repaired Roderick''s sword and reinforced the gate hinges"}, {"timestamp": "2026-01-28T09:00:00Z", "type": "conversation", "summary": "Discussed better weapons for the militia"}, {"timestamp": "2026-02-12T08:00:00Z", "type": "trade", "summary": "Commissioned new spearheads for the guard"}]'),
('44444444-4444-4444-4444-444444444409', '11111111-1111-1111-1111-111111111102', 'npc', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 0.4, 0.6, 0.7, '[{"timestamp": "2026-01-12T20:00:00Z", "type": "conversation", "summary": "Thoren shared rumors about strangers on the eastern road"}, {"timestamp": "2026-02-02T21:00:00Z", "type": "intelligence", "summary": "A merchant mentioned bandit activity near Ashwood Pass"}]'),
('44444444-4444-4444-4444-444444444410', '11111111-1111-1111-1111-111111111102', 'npc', '11111111-1111-1111-1111-111111111101', -0.1, 0.3, 0.35, '[{"timestamp": "2026-01-20T09:00:00Z", "type": "investigation", "summary": "Attempted to learn about Mira''s past. She was evasive."}]'),
('44444444-4444-4444-4444-444444444411', '11111111-1111-1111-1111-111111111102', 'npc', '11111111-1111-1111-1111-111111111103', 0.5, 0.7, 0.6, '[{"timestamp": "2026-01-14T16:00:00Z", "type": "consultation", "summary": "Alaric provided info about old defense systems"}, {"timestamp": "2026-02-06T10:00:00Z", "type": "conversation", "summary": "Discussed strange noises from the abandoned mines"}]'),
('44444444-4444-4444-4444-444444444412', '11111111-1111-1111-1111-111111111102', 'npc', '11111111-1111-1111-1111-111111111104', 0.2, 0.4, 0.5, '[{"timestamp": "2026-01-16T13:00:00Z", "type": "inspection", "summary": "Inspected Luna''s trade cart for contraband. Found nothing."}, {"timestamp": "2026-02-09T14:00:00Z", "type": "conversation", "summary": "Luna provided intelligence about road conditions and threats"}]'),
('44444444-4444-4444-4444-444444444413', '11111111-1111-1111-1111-111111111102', 'player', 'player_ironheart', 0.7, 0.8, 0.6, '[{"timestamp": "2026-01-25T08:00:00Z", "type": "quest", "summary": "Ironheart volunteered to help patrol the eastern perimeter"}, {"timestamp": "2026-02-07T07:00:00Z", "type": "training", "summary": "Sparred with the militia. Roderick was impressed."}]'),
('44444444-4444-4444-4444-444444444414', '11111111-1111-1111-1111-111111111102', 'player', 'player_shadow_fox', -0.3, 0.2, 0.4, '[{"timestamp": "2026-01-30T22:00:00Z", "type": "confrontation", "summary": "Caught Shadow Fox sneaking around the old warehouse at night. Skeptical of their story."}]');

-- New relationships: Alaric
INSERT INTO relationships (id, npc_id, target_type, target_id, affinity, trust, familiarity, interaction_history) VALUES
('44444444-4444-4444-4444-444444444415', '11111111-1111-1111-1111-111111111103', 'npc', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 0.6, 0.7, 0.5, '[{"timestamp": "2026-01-09T11:00:00Z", "type": "conversation", "summary": "Asked Elara about ancient metallurgy techniques"}, {"timestamp": "2026-02-04T14:00:00Z", "type": "collaboration", "summary": "Elara helped repair an old astrolabe"}]'),
('44444444-4444-4444-4444-444444444416', '11111111-1111-1111-1111-111111111103', 'npc', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 0.7, 0.7, 0.8, '[{"timestamp": "2026-01-11T20:00:00Z", "type": "social", "summary": "Weekly chess game at the tavern. Alaric won, as usual."}, {"timestamp": "2026-02-03T19:30:00Z", "type": "conversation", "summary": "Thoren shared a tale about a ruined city. Alaric was fascinated."}]'),
('44444444-4444-4444-4444-444444444417', '11111111-1111-1111-1111-111111111103', 'npc', '11111111-1111-1111-1111-111111111101', 0.7, 0.8, 0.7, '[{"timestamp": "2026-01-05T16:00:00Z", "type": "discovery", "summary": "Recognized Mira''s knowledge of Valdrian court alchemy. Chose to keep her secret."}, {"timestamp": "2026-02-10T15:00:00Z", "type": "conversation", "summary": "Discussed rare plant properties. Suspects Mira is working on something important."}]'),
('44444444-4444-4444-4444-444444444418', '11111111-1111-1111-1111-111111111103', 'npc', '11111111-1111-1111-1111-111111111102', 0.5, 0.7, 0.6, '[{"timestamp": "2026-01-14T16:00:00Z", "type": "consultation", "summary": "Provided Roderick with maps of old tunnel systems under Millhaven"}]'),
('44444444-4444-4444-4444-444444444419', '11111111-1111-1111-1111-111111111103', 'npc', '11111111-1111-1111-1111-111111111104', 0.5, 0.5, 0.4, '[{"timestamp": "2026-01-19T20:00:00Z", "type": "trade", "summary": "Luna acquired a rare manuscript Alaric had been seeking for years"}]'),
('44444444-4444-4444-4444-444444444420', '11111111-1111-1111-1111-111111111103', 'player', 'player_nightbloom', 0.8, 0.9, 0.7, '[{"timestamp": "2026-01-20T15:00:00Z", "type": "teaching", "summary": "Nightbloom showed exceptional aptitude during a lecture on ancient runes"}, {"timestamp": "2026-02-05T10:00:00Z", "type": "quest", "summary": "Sent Nightbloom to investigate ruins. Returned with valuable inscriptions."}, {"timestamp": "2026-02-11T09:00:00Z", "type": "mentorship", "summary": "Began private tutoring. Considers Nightbloom a potential apprentice."}]');

-- New relationships: Luna
INSERT INTO relationships (id, npc_id, target_type, target_id, affinity, trust, familiarity, interaction_history) VALUES
('44444444-4444-4444-4444-444444444421', '11111111-1111-1111-1111-111111111104', 'npc', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 0.6, 0.6, 0.55, '[{"timestamp": "2026-01-13T10:00:00Z", "type": "trade", "summary": "Purchased custom-made display hooks for her market stall"}, {"timestamp": "2026-02-08T11:00:00Z", "type": "conversation", "summary": "Offered to source rare metals for Elara''s dragon project"}]'),
('44444444-4444-4444-4444-444444444422', '11111111-1111-1111-1111-111111111104', 'npc', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 0.8, 0.7, 0.75, '[{"timestamp": "2026-01-11T21:00:00Z", "type": "social", "summary": "Luna and Thoren swapped travel stories. Great chemistry."}, {"timestamp": "2026-01-27T19:00:00Z", "type": "business", "summary": "Agreed to supply exotic spices and drinks at a discount"}]'),
('44444444-4444-4444-4444-444444444423', '11111111-1111-1111-1111-111111111104', 'npc', '11111111-1111-1111-1111-111111111101', 0.4, 0.5, 0.45, '[{"timestamp": "2026-01-18T14:30:00Z", "type": "trade", "summary": "Sold rare herbs from the southern islands to Mira"}]'),
('44444444-4444-4444-4444-444444444424', '11111111-1111-1111-1111-111111111104', 'npc', '11111111-1111-1111-1111-111111111102', 0.2, 0.4, 0.5, '[{"timestamp": "2026-01-16T13:00:00Z", "type": "inspection", "summary": "Cart inspected by Roderick. Luna kept composure and passed."}]'),
('44444444-4444-4444-4444-444444444425', '11111111-1111-1111-1111-111111111104', 'npc', '11111111-1111-1111-1111-111111111103', 0.5, 0.5, 0.4, '[{"timestamp": "2026-01-19T20:00:00Z", "type": "trade", "summary": "Sold a rare manuscript to Alaric. Made a tidy profit."}]'),
('44444444-4444-4444-4444-444444444426', '11111111-1111-1111-1111-111111111104', 'player', 'player_wanderer_kai', 0.7, 0.6, 0.55, '[{"timestamp": "2026-01-24T16:00:00Z", "type": "trade", "summary": "Kai brought exotic goods from his travels"}, {"timestamp": "2026-02-06T18:00:00Z", "type": "business", "summary": "Discussed partnership for a trade route to northern kingdoms"}]'),
('44444444-4444-4444-4444-444444444427', '11111111-1111-1111-1111-111111111104', 'player', 'player_nightbloom', 0.3, 0.4, 0.3, '[{"timestamp": "2026-02-09T17:00:00Z", "type": "trade", "summary": "Nightbloom purchased ancient rune stones. Luna suspected they were for Alaric."}]');

-- Extra relationships for existing NPCs to new players
INSERT INTO relationships (id, npc_id, target_type, target_id, affinity, trust, familiarity, interaction_history) VALUES
('44444444-4444-4444-4444-444444444428', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'player', 'player_ironheart', 0.7, 0.75, 0.6, '[{"timestamp": "2026-01-15T10:00:00Z", "type": "trade", "summary": "Ironheart commissioned a custom battle axe"}, {"timestamp": "2026-02-10T11:00:00Z", "type": "conversation", "summary": "Discussed steel alloys for weapon making"}]'),
('44444444-4444-4444-4444-444444444429', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'player', 'player_nightbloom', 0.2, 0.3, 0.2, '[{"timestamp": "2026-02-07T14:00:00Z", "type": "trade", "summary": "Nightbloom asked about enchanted metals. Elara was skeptical but intrigued."}]'),
('44444444-4444-4444-4444-444444444430', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'player', 'player_ironheart', 0.5, 0.5, 0.5, '[{"timestamp": "2026-01-20T21:00:00Z", "type": "social", "summary": "Ironheart shared war stories over ale. Thoren loved every minute."}]'),
('44444444-4444-4444-4444-444444444431', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'player', 'player_shadow_fox', 0.4, 0.35, 0.4, '[{"timestamp": "2026-02-01T22:00:00Z", "type": "social", "summary": "Shadow Fox was unusually quiet at the bar. Thoren tried to get them to open up."}]'),
('44444444-4444-4444-4444-444444444432', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'player', 'player_nightbloom', 0.6, 0.6, 0.45, '[{"timestamp": "2026-02-04T20:00:00Z", "type": "conversation", "summary": "Nightbloom asked about old legends. Thoren told the tale of Aethermoor."}]');

COMMIT;
