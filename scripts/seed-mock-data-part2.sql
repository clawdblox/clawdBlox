-- ============================================================
-- MOCK DATA SEED PART 2 — Conversations, Messages, Memories
-- Project: ClawdBlox Mock (aa75be38-dfe8-45ca-a589-e6b41885e698)
-- ============================================================
BEGIN;

-- ============================================================
-- 5. CONVERSATIONS + MESSAGES
-- ============================================================

-- Elara + Sir Aldric (ended — shield commission & dragonscale rumors)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555501', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'player_sir_aldric', 'ended',
 'Sir Aldric commissioned a reinforced shield and discussed dragonscale armor rumors.', 8,
 '2026-01-05T10:00:00Z', '2026-01-05T10:45:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', 'player',
 'Good morning, Elara! I need a shield reinforced for my upcoming expedition to the northern passes.', '2026-01-05T10:00:00Z'),
('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', 'npc',
 '*examines the shield carefully, turning it over in her calloused hands* Hmm, decent craftsmanship but the rivets are weakening along the rim. I can reinforce the frame and add a steel boss in the center. Should hold against most blows. When do you need it?', '2026-01-05T10:02:00Z'),
('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555501', 'player',
 'I leave in three days. Can you make it by then? Also... I heard rumors you''re working on something with dragonscale. Is that true?', '2026-01-05T10:05:00Z'),
('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555501', 'npc',
 '*pauses, her eyes narrowing slightly* Three days is tight, but I''ll manage. As for the dragonscale... *lowers her voice* ...who told you about that? It''s a personal project. Not ready for public knowledge yet. Let''s just say I''m studying certain ancient techniques.', '2026-01-05T10:07:00Z'),
('66666666-6666-6666-6666-666666666605', '55555555-5555-5555-5555-555555555501', 'player',
 'My lips are sealed. Actually, if you need rare materials, I might find some on my expedition. The northern mountains are said to hold ancient forges.', '2026-01-05T10:10:00Z'),
('66666666-6666-6666-6666-666666666606', '55555555-5555-5555-5555-555555555501', 'npc',
 '*her expression softens, a spark of excitement in her eyes* You''d do that? If you find anything — ore samples, old tools, inscribed metals — bring them to me. I''ll repair your shield for free and owe you a favor besides. *extends a soot-covered hand* Deal?', '2026-01-05T10:12:00Z'),
('66666666-6666-6666-6666-666666666607', '55555555-5555-5555-5555-555555555501', 'player',
 'Deal! I''ll keep my eyes open. Take care of my shield, and I''ll bring back whatever I find.', '2026-01-05T10:15:00Z'),
('66666666-6666-6666-6666-666666666608', '55555555-5555-5555-5555-555555555501', 'npc',
 '*grips his hand firmly* You have my word. Now get out of my forge — I have work to do! *grins and turns back to the anvil*', '2026-01-05T10:16:00Z');

-- Thoren + Wanderer Kai (ended — travel stories & Aethermoor legend)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555502', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'player_wanderer_kai', 'ended',
 'Kai shared stories of Ashara. Thoren told the tale of the Lost Kingdom of Aethermoor.', 10,
 '2026-01-22T19:00:00Z', '2026-01-22T20:30:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666609', '55555555-5555-5555-5555-555555555502', 'player',
 'Evening, barkeep! I''ll have whatever''s strongest. I''ve traveled a long road.', '2026-01-22T19:00:00Z'),
('66666666-6666-6666-6666-666666666610', '55555555-5555-5555-5555-555555555502', 'npc',
 '*pours a generous mug of dark amber ale and slides it across the bar with a warm smile* Strongest we''ve got — Ironpeak Stout! Brewed right here in Millhaven. So, a traveler, eh? Where''d you come from? I collect stories, you see — every good tale earns a second drink on the house!', '2026-01-22T19:02:00Z'),
('66666666-6666-6666-6666-666666666611', '55555555-5555-5555-5555-555555555502', 'player',
 'Ha! A free drink for a story? You''ve got yourself a deal. I just came from the Kingdom of Ashara, east past the Drywind Desert. Beautiful place — they build their cities into the cliffsides.', '2026-01-22T19:05:00Z'),
('66666666-6666-6666-6666-666666666612', '55555555-5555-5555-5555-555555555502', 'npc',
 '*eyes light up as he leans forward, wiping a glass absently* Ashara! By the gods, I''ve heard tales but never met someone who''s been there! Cliffside cities, you say? Tell me more — what''s the food like? The music?', '2026-01-22T19:07:00Z'),
('66666666-6666-6666-6666-666666666613', '55555555-5555-5555-5555-555555555502', 'player',
 'The sandwyrms? Ha, yes! They domesticate them for caravans across the desert. The food is incredible — spiced meats and honeyed pastries. And the music echoes off the cliffs. Hauntingly beautiful.', '2026-01-22T19:10:00Z'),
('66666666-6666-6666-6666-666666666614', '55555555-5555-5555-5555-555555555502', 'npc',
 '*scribbles notes frantically on a napkin* Sandwyrm caravans... cliffside echoes... this is pure gold for my chronicle! *pours another ale* That''s your second drink earned. Say, since you''re well-traveled — have you ever heard of the Lost Kingdom of Aethermoor?', '2026-01-22T19:15:00Z'),
('66666666-6666-6666-6666-666666666615', '55555555-5555-5555-5555-555555555502', 'player',
 'Aethermoor? Only whispers. Something about a kingdom that vanished overnight? What do you know about it?', '2026-01-22T19:18:00Z'),
('66666666-6666-6666-6666-666666666616', '55555555-5555-5555-5555-555555555502', 'npc',
 '*leans in conspiratorially* Old Alaric — the sage in the tower — says Aethermoor was a great kingdom right here, maybe a thousand years ago. One night, during the Starfall, the entire kingdom just... vanished. People, buildings, everything. All that''s left are ruins in the forest north of here. Alaric thinks the Starfall is coming again. *shivers*', '2026-01-22T19:22:00Z'),
('66666666-6666-6666-6666-666666666617', '55555555-5555-5555-5555-555555555502', 'player',
 'That''s unsettling. Maybe I should talk to this Alaric. Where can I find him?', '2026-01-22T19:25:00Z'),
('66666666-6666-6666-6666-666666666618', '55555555-5555-5555-5555-555555555502', 'npc',
 '*points toward the east window* See that tall stone tower past the market? That''s his place. He comes here for tea and chess most evenings, but for serious talk, visit him in the morning. *winks* And hey — if you learn anything, come tell old Thoren first!', '2026-01-22T19:28:00Z');

-- Mira + Shadow Fox (active — moonbloom delivery & poison knowledge)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555503', '11111111-1111-1111-1111-111111111101', 'player_shadow_fox', 'active',
 NULL, 6, '2026-02-03T14:00:00Z', '2026-02-03T14:30:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666619', '55555555-5555-5555-5555-555555555503', 'player',
 'Mira? I found those moonbloom petals you needed. Had to go deep into Shadowveil Cave to get them.', '2026-02-03T14:00:00Z'),
('66666666-6666-6666-6666-666666666620', '55555555-5555-5555-5555-555555555503', 'npc',
 '*gasps softly, reaching out with trembling hands* You actually found them? *examines the petals carefully, holding them up to the light* These are perfect. The luminescence is intact. I haven''t seen moonbloom in years... *whispers* ...not since Valdris.', '2026-02-03T14:02:00Z'),
('66666666-6666-6666-6666-666666666621', '55555555-5555-5555-5555-555555555503', 'player',
 'Valdris? What''s that? And what do you need them for?', '2026-02-03T14:05:00Z'),
('66666666-6666-6666-6666-666666666622', '55555555-5555-5555-5555-555555555503', 'npc',
 '*catches herself, a flash of worry crossing her face* I... It''s a place I used to know. Long ago. *wraps the petals in cloth* Have you noticed the coughing sickness in the village? Three children fell ill this week. Moonbloom is the key ingredient for the cure. *her eyes meet yours* You may have just saved lives, Shadow Fox.', '2026-02-03T14:08:00Z'),
('66666666-6666-6666-6666-666666666623', '55555555-5555-5555-5555-555555555503', 'player',
 'I''m glad I could help. If you need anything else, let me know. What can you tell me about poisons? I''ve been... researching.', '2026-02-03T14:12:00Z'),
('66666666-6666-6666-6666-666666666624', '55555555-5555-5555-5555-555555555503', 'npc',
 '*raises an eyebrow, studying you carefully* Poisons, you say? *sniffs a sprig of lavender thoughtfully* Every poison is also a medicine in the right dose. And every medicine a poison in excess. I can teach you about antidotes — that''s where the real knowledge lies. But I need to know your intentions are good before I share such things. The earth remembers what we forget...', '2026-02-03T14:15:00Z');

-- Captain Roderick + Ironheart (active — training & bandit intel)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555504', '11111111-1111-1111-1111-111111111102', 'player_ironheart', 'active',
 NULL, 8, '2026-02-07T07:00:00Z', '2026-02-07T08:00:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666625', '55555555-5555-5555-5555-555555555504', 'player',
 'Captain! Reporting for morning training as promised.', '2026-02-07T07:00:00Z'),
('66666666-6666-6666-6666-666666666626', '55555555-5555-5555-5555-555555555504', 'npc',
 '*nods curtly, arms crossed* Good. You''re on time. That already puts you ahead of half my militia. Grab a practice sword from the rack. We start with drills.', '2026-02-07T07:01:00Z'),
('66666666-6666-6666-6666-666666666627', '55555555-5555-5555-5555-555555555504', 'player',
 'Yes, sir. Before we start — I noticed fresh tracks near the eastern perimeter last night. Large group, maybe 8-10 people, heading north.', '2026-02-07T07:03:00Z'),
('66666666-6666-6666-6666-666666666628', '55555555-5555-5555-5555-555555555504', 'npc',
 '*his jaw tightens, eyes narrowing* How old were the tracks? Boot prints or bare feet? Any horse prints? *pulls out a worn map from his belt pouch* Show me exactly where.', '2026-02-07T07:04:00Z'),
('66666666-6666-6666-6666-666666666629', '55555555-5555-5555-5555-555555555504', 'player',
 '*points to the map* Here, near the old stone bridge. Boot prints, heavy — military style. No horses. Maybe 4-5 hours old when I found them around midnight.', '2026-02-07T07:06:00Z'),
('66666666-6666-6666-6666-666666666630', '55555555-5555-5555-5555-555555555504', 'npc',
 '*traces the route on the map* Military boots heading north... toward Ashwood Pass. *his voice drops, hard and cold* That''s bandit territory. Could be reinforcements. I''ve seen what happens when guards get lazy. *rolls up the map* You did well reporting this. I''ll double the eastern patrol tonight. Stay vigilant.', '2026-02-07T07:08:00Z'),
('66666666-6666-6666-6666-666666666631', '55555555-5555-5555-5555-555555555504', 'player',
 'Captain, if you''re planning anything against the bandits... I want in. I can fight.', '2026-02-07T07:10:00Z'),
('66666666-6666-6666-6666-666666666632', '55555555-5555-5555-5555-555555555504', 'npc',
 '*studies you for a long moment, then gives a single nod* Prove yourself in training today. If you''re as good as you claim, we''ll talk. I lost good soldiers because I trusted too fast once. Won''t make that mistake again. *draws his practice sword* Now — defend yourself. Duty before comfort.', '2026-02-07T07:12:00Z');

-- Alaric + Nightbloom (active — ruins inscriptions & Starfall Prophecy)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555505', '11111111-1111-1111-1111-111111111103', 'player_nightbloom', 'active',
 NULL, 8, '2026-02-11T09:00:00Z', '2026-02-11T10:00:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666633', '55555555-5555-5555-5555-555555555505', 'player',
 'Master Alaric, I''ve brought the inscriptions from the northern ruins. You won''t believe what I found.', '2026-02-11T09:00:00Z'),
('66666666-6666-6666-6666-666666666634', '55555555-5555-5555-5555-555555555505', 'npc',
 '*adjusts his spectacles, pushing aside a tower of dusty books* Ah, Nightbloom! Excellent! *reaches for the inscriptions with eager hands* Let me see... Curious, most curious... *eyes widen* By the ancient stars... these are Pre-Aethermoorian glyphs! I haven''t seen this script since my days at the Academy! Where exactly did you find these?', '2026-02-11T09:03:00Z'),
('66666666-6666-6666-6666-666666666635', '55555555-5555-5555-5555-555555555505', 'player',
 'In a chamber beneath the main ruins. A collapsed wall revealed a hidden room. The inscriptions were on a stone tablet, protected by some kind of... shimmering barrier.', '2026-02-11T09:06:00Z'),
('66666666-6666-6666-6666-666666666636', '55555555-5555-5555-5555-555555555505', 'npc',
 'A preservation ward! Still functioning after a millennium... As the ancients wrote in the Third Codex of Luminara — *catches himself* Ah, but that''s not important now. This tablet... *runs his finger along the glyphs* ...speaks of a "convergence" and a "key that opens the sky." Nightbloom, I believe this is a fragment of the Starfall Prophecy. If I''m right, this changes everything.', '2026-02-11T09:10:00Z'),
('66666666-6666-6666-6666-666666666637', '55555555-5555-5555-5555-555555555505', 'player',
 'The Starfall Prophecy? Thoren mentioned that at the tavern. He said you believe it''s going to happen again?', '2026-02-11T09:13:00Z'),
('66666666-6666-6666-6666-666666666638', '55555555-5555-5555-5555-555555555505', 'npc',
 '*sighs heavily, removing his spectacles* Thoren talks too much. But he''s not wrong. My astronomical calculations suggest a celestial alignment matching the ancient descriptions will occur within the year. If the Starfall is truly coming, this tablet might tell us how to survive it. Or even prevent it. I need time to translate.', '2026-02-11T09:17:00Z'),
('66666666-6666-6666-6666-666666666639', '55555555-5555-5555-5555-555555555505', 'player',
 'What can I do to help? I could go back to the ruins and look for more tablets.', '2026-02-11T09:20:00Z'),
('66666666-6666-6666-6666-666666666640', '55555555-5555-5555-5555-555555555505', 'npc',
 '*places a hand on your shoulder* You have a sharp mind and a brave heart. Yes, return to the ruins — but be careful. If preservation wards are still active, there may be other protections. Take this *hands over an old leather journal* — my notes on ancient ward patterns. And Nightbloom? *his eyes twinkle* I''ve been looking for an apprentice worthy of this tower for twenty years. Consider this your entrance exam.', '2026-02-11T09:25:00Z');

-- Luna + Wanderer Kai (active — trade route partnership)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555506', '11111111-1111-1111-1111-111111111104', 'player_wanderer_kai', 'active',
 NULL, 6, '2026-02-06T18:00:00Z', '2026-02-06T18:30:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666641', '55555555-5555-5555-5555-555555555506', 'player',
 'Luna! Just the person I wanted to see. I''ve got a business proposition for you.', '2026-02-06T18:00:00Z'),
('66666666-6666-6666-6666-666666666642', '55555555-5555-5555-5555-555555555506', 'npc',
 '*perks up instantly, a wide grin spreading* Kai! My favorite wanderer! *winks* Business, you say? Now you''re speaking my language! Pull up a chair — everything has a price, friend, but the best deals start with good ale. *waves to Thoren for two drinks* So, what''ve you got?', '2026-02-06T18:02:00Z'),
('66666666-6666-6666-6666-666666666643', '55555555-5555-5555-5555-555555555506', 'player',
 'I''ve discovered a trade route through the Crystalpine Mountains. Cuts the journey to the northern kingdoms by three weeks. Nobody else knows about it yet.', '2026-02-06T18:05:00Z'),
('66666666-6666-6666-6666-666666666644', '55555555-5555-5555-5555-555555555506', 'npc',
 '*leans forward, coins jingling* Three weeks shorter? Do you have any idea how much that saves in provisions alone? *narrows her eyes playfully* But the Crystalpines are dangerous — ice trolls, avalanches. I know a guy who knows a guy who tried a mountain pass and... well, he doesn''t try things anymore. What makes yours safe?', '2026-02-06T18:08:00Z'),
('66666666-6666-6666-6666-666666666645', '55555555-5555-5555-5555-555555555506', 'player',
 'The route follows old dwarven tunnels. Protected from the elements, wide enough for carts. I''ve made the trip twice already. Minimal danger if you know the path.', '2026-02-06T18:12:00Z'),
('66666666-6666-6666-6666-666666666646', '55555555-5555-5555-5555-555555555506', 'npc',
 '*her eyes light up* Dwarven tunnels! Business is an adventure! *pulls out a leather-bound ledger* Here''s what I''m thinking — a partnership. You guide the first three caravans, I handle goods and buyers. Sixty-forty split, your favor. After three runs, we renegotiate. *extends her hand* What do you say, partner?', '2026-02-06T18:15:00Z');

-- Roderick + Shadow Fox (ended — confrontation at warehouse)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555507', '11111111-1111-1111-1111-111111111102', 'player_shadow_fox', 'ended',
 'Roderick confronted Shadow Fox sneaking around the warehouse at night. Tense exchange.', 6,
 '2026-01-30T22:00:00Z', '2026-01-30T22:20:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666647', '55555555-5555-5555-5555-555555555507', 'npc',
 '*steps out of the shadows, hand on sword hilt* Hold it. What are you doing here at this hour? The old warehouse is off-limits after dark.', '2026-01-30T22:00:00Z'),
('66666666-6666-6666-6666-666666666648', '55555555-5555-5555-5555-555555555507', 'player',
 'Captain! I was just... investigating. I heard strange noises coming from this building earlier.', '2026-01-30T22:01:00Z'),
('66666666-6666-6666-6666-666666666649', '55555555-5555-5555-5555-555555555507', 'npc',
 '*doesn''t move his hand from the sword* Investigating. Without informing the guard. In the middle of the night. *steps closer* I''ve heard that excuse before. Usually from people with something to hide. Name and business. Now.', '2026-01-30T22:02:00Z'),
('66666666-6666-6666-6666-666666666650', '55555555-5555-5555-5555-555555555507', 'player',
 'I go by Shadow Fox. I''m a freelance investigator. Look, I''m trying to help. People are getting sick, strange sounds at night. I was looking for answers.', '2026-01-30T22:04:00Z'),
('66666666-6666-6666-6666-666666666651', '55555555-5555-5555-5555-555555555507', 'npc',
 '*studies you for a long, uncomfortable moment* A freelance investigator. Convenient. *releases his sword hilt but stays rigid* I know about the sickness and the noises. I''m handling it. If you want to help, you come to me first. You don''t sneak around my village in the dark. Understood?', '2026-01-30T22:06:00Z'),
('66666666-6666-6666-6666-666666666652', '55555555-5555-5555-5555-555555555507', 'player',
 'Understood, Captain. I apologize. Next time, I''ll come to you first.', '2026-01-30T22:08:00Z');

-- Thoren + Nightbloom (ended — Aethermoor legends)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555508', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'player_nightbloom', 'ended',
 'Nightbloom asked about local legends. Thoren told the tale of Aethermoor.', 6,
 '2026-02-04T20:00:00Z', '2026-02-04T20:30:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666653', '55555555-5555-5555-5555-555555555508', 'player',
 'Thoren, I heard you''re the man to ask about local legends. What can you tell me about the history of this region?', '2026-02-04T20:00:00Z'),
('66666666-6666-6666-6666-666666666654', '55555555-5555-5555-5555-555555555508', 'npc',
 '*beams with pride, pulling up a stool behind the bar* Now you''re asking the right person! I''ve been collecting stories for my Grand Chronicle for years. What kind of legend interests you? Ancient kingdoms? Dragon sightings? Ghost stories? I''ve got ''em all!', '2026-02-04T20:02:00Z'),
('66666666-6666-6666-6666-666666666655', '55555555-5555-5555-5555-555555555508', 'player',
 'Ancient kingdoms, definitely. I''ve heard whispers about ruins in the forest north of here.', '2026-02-04T20:05:00Z'),
('66666666-6666-6666-6666-666666666656', '55555555-5555-5555-5555-555555555508', 'npc',
 '*leans in, lowering his voice dramatically* Ah, Aethermoor! The Lost Kingdom! A thousand years ago, grand castles, magical towers. Then one night, during the Starfall, the whole thing... poof! Gone. Everyone in it. *snaps his fingers* Old Alaric studies it obsessively. He''ll tell you the academic version. But my version? *winks* Way more exciting.', '2026-02-04T20:08:00Z'),
('66666666-6666-6666-6666-666666666657', '55555555-5555-5555-5555-555555555508', 'player',
 'Tell me your version! And can I actually visit these ruins?', '2026-02-04T20:10:00Z'),
('66666666-6666-6666-6666-666666666658', '55555555-5555-5555-5555-555555555508', 'npc',
 '*pours two ales, one for himself* The king of Aethermoor found a way to capture starlight in a giant crystal. Gave them incredible power, but it attracted something from beyond the sky. The Starfall wasn''t just stars falling — it was something reaching down. *takes a long sip* The ruins are a day''s hike north. Talk to Alaric before you go — he knows the safe paths.', '2026-02-04T20:15:00Z');

-- Luna + Nightbloom (ended — rune stone purchase)
INSERT INTO conversations (id, npc_id, player_id, status, summary, message_count, created_at, updated_at) VALUES
('55555555-5555-5555-5555-555555555509', '11111111-1111-1111-1111-111111111104', 'player_nightbloom', 'ended',
 'Nightbloom purchased ancient rune stones for research.', 4,
 '2026-02-09T17:00:00Z', '2026-02-09T17:15:00Z');

INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES
('66666666-6666-6666-6666-666666666659', '55555555-5555-5555-5555-555555555509', 'player',
 'Luna, do you have any ancient artifacts or rune stones? I''m looking for something specific.', '2026-02-09T17:00:00Z'),
('66666666-6666-6666-6666-666666666660', '55555555-5555-5555-5555-555555555509', 'npc',
 '*rummages through a chest behind her cart* Rune stones, rune stones... *winks* You''re the second person this month interested in ancient things. Let me guess — Alaric sent you? *pulls out a velvet pouch* Five rune stones, Pre-Imperial era. Genuine — I had them verified. Not cheap though!', '2026-02-09T17:02:00Z'),
('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555509', 'player',
 'How much? And yes, they''re for research purposes.', '2026-02-09T17:05:00Z'),
('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555509', 'npc',
 '*counts on her fingers* For research? 150 gold for the set. And since I like supporting education... *grins* I''ll throw in this old map I found with them. Might show some kind of underground structure. Business is an adventure, after all!', '2026-02-09T17:08:00Z');

-- ============================================================
-- 6. MEMORIES (all types, all importance levels)
-- ============================================================

INSERT INTO memories (id, npc_id, type, importance, vividness, content, embedding, metadata, access_count, last_accessed_at, created_at) VALUES

-- === ELARA MEMORIES ===
('77777777-7777-7777-7777-777777777701', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'episodic', 'significant', 0.9,
 'Sir Aldric commissioned a reinforced shield and promised to bring back rare ore samples from the northern mountains. He also knows about my dragonscale project — I trusted him with this secret.',
 NULL, '{"player_id": "player_sir_aldric", "location": "Ironpeak Forge", "emotion": "hopeful"}', 3, '2026-02-08T11:00:00Z', '2026-01-05T10:15:00Z'),

('77777777-7777-7777-7777-777777777702', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'semantic', 'critical', 0.95,
 'The ancient tempering technique for dragonscale requires precise temperature control at 1,800 degrees, alternating between volcanic coal and enchanted water. The process takes three days without pause.',
 NULL, '{"source": "ancient manuscript", "topic": "dragonscale forging"}', 7, '2026-02-12T09:00:00Z', '2025-12-15T08:00:00Z'),

('77777777-7777-7777-7777-777777777703', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'emotional', 'significant', 0.85,
 'Felt immense pride when I won the Regional Smithing Competition with my moonstone-inlaid longsword. The judges said it was the finest piece they had seen in a decade.',
 NULL, '{"emotion": "pride", "event": "Regional Smithing Competition"}', 2, '2026-01-20T14:00:00Z', '2025-11-15T16:00:00Z'),

('77777777-7777-7777-7777-777777777704', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'procedural', 'moderate', 0.7,
 'To properly fold steel for a katana-style blade: heat to bright orange, hammer with even strokes, fold, and repeat. Seven folds minimum for combat-grade, twelve for ceremonial.',
 NULL, '{"skill": "steel folding", "level": "master"}', 5, '2026-02-10T08:00:00Z', '2025-10-01T10:00:00Z'),

('77777777-7777-7777-7777-777777777705', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'episodic', 'moderate', 0.6,
 'Ironheart commissioned a custom battle axe with specific weight distribution for dual-wielding. Interesting challenge — the player has good taste in weapons.',
 NULL, '{"player_id": "player_ironheart", "location": "Ironpeak Forge"}', 1, '2026-01-15T10:30:00Z', '2026-01-15T10:00:00Z'),

('77777777-7777-7777-7777-777777777706', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'emotional', 'critical', 1.0,
 'The day my master blacksmith, old Garrick, passed away and left me the Ironpeak Forge. He said I was the best student he ever had. I swore to honor his legacy.',
 NULL, '{"emotion": "grief and determination", "person": "Master Garrick"}', 4, '2026-02-01T06:00:00Z', '2024-06-15T12:00:00Z'),

('77777777-7777-7777-7777-777777777707', 'ec3a6836-f8e8-46f4-aba0-905d79f96b58', 'semantic', 'minor', 0.5,
 'Luna the merchant has contacts who can source rare metals from the southern kingdoms. Could be useful for the dragonscale project.',
 NULL, '{"source": "Luna", "topic": "trade contacts"}', 1, '2026-02-08T11:30:00Z', '2026-02-08T11:00:00Z'),

-- === THOREN MEMORIES ===
('77777777-7777-7777-7777-777777777708', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'episodic', 'significant', 0.85,
 'Wanderer Kai told me about the Kingdom of Ashara — cliffside cities, sandwyrm caravans, hauntingly beautiful music. One of the best stories for my chronicle.',
 NULL, '{"player_id": "player_wanderer_kai", "location": "The Golden Tankard"}', 4, '2026-02-03T21:00:00Z', '2026-01-22T19:30:00Z'),

('77777777-7777-7777-7777-777777777709', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'semantic', 'moderate', 0.7,
 'The Kingdom of Ashara lies east past the Drywind Desert. People build cities into cliffsides, domesticate sandwyrms for desert caravans, and play instruments that echo off canyon walls.',
 NULL, '{"source": "player_wanderer_kai", "topic": "Ashara"}', 3, '2026-02-04T20:08:00Z', '2026-01-22T19:30:00Z'),

('77777777-7777-7777-7777-777777777710', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'episodic', 'moderate', 0.65,
 'Nightbloom came asking about local legends. Told them about Aethermoor and the Starfall. They seemed very interested in the ruins. Directed them to Alaric.',
 NULL, '{"player_id": "player_nightbloom", "location": "The Golden Tankard"}', 2, '2026-02-05T20:00:00Z', '2026-02-04T20:15:00Z'),

('77777777-7777-7777-7777-777777777711', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'emotional', 'significant', 0.9,
 'The night I secured the brewery partnership with Oakbarrel Ales. Years of negotiation finally paid off. The Golden Tankard now has exclusive access to the finest stout in the region.',
 NULL, '{"emotion": "triumph", "event": "brewery partnership"}', 3, '2026-01-28T20:00:00Z', '2025-12-01T21:00:00Z'),

('77777777-7777-7777-7777-777777777712', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'procedural', 'minor', 0.55,
 'The secret to a perfect Ironpeak Stout: double malt, slow ferment for 14 days, add a pinch of mountain thyme on day 10. Temperature must stay below 15 degrees.',
 NULL, '{"skill": "brewing", "recipe": "Ironpeak Stout"}', 6, '2026-02-12T07:00:00Z', '2025-09-20T08:00:00Z'),

('77777777-7777-7777-7777-777777777713', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'semantic', 'significant', 0.8,
 'Aethermoor was a kingdom that vanished during the Starfall roughly a thousand years ago. Ruins lie north of Millhaven. Alaric believes the Starfall may recur. The king captured starlight in a crystal that attracted something from beyond.',
 NULL, '{"topic": "Aethermoor", "source": "multiple travelers and Alaric"}', 5, '2026-02-04T20:15:00Z', '2025-08-10T20:00:00Z'),

('77777777-7777-7777-7777-777777777714', '5d31f6e3-d779-4ad9-a4c0-d53bbb53905d', 'episodic', 'trivial', 0.3,
 'A passing merchant mentioned bandit activity near Ashwood Pass. Told Captain Roderick. He seemed already aware.',
 NULL, '{"location": "The Golden Tankard", "topic": "bandit activity"}', 1, '2026-02-02T21:30:00Z', '2026-02-02T21:00:00Z'),

-- === MIRA MEMORIES ===
('77777777-7777-7777-7777-777777777715', '11111111-1111-1111-1111-111111111101', 'episodic', 'critical', 1.0,
 'Shadow Fox retrieved moonbloom petals from Shadowveil Cave — the key ingredient for curing the village plague. I nearly revealed my past when I mentioned Valdris. Must be more careful.',
 NULL, '{"player_id": "player_shadow_fox", "location": "Mira''s Cottage", "emotion": "relief and worry"}', 2, '2026-02-05T10:00:00Z', '2026-02-03T14:15:00Z'),

('77777777-7777-7777-7777-777777777716', '11111111-1111-1111-1111-111111111101', 'semantic', 'critical', 0.95,
 'The cure for the coughing plague requires: moonbloom petals (3), silverroot extract, purified spring water, and a 6-hour distillation process. Moonbloom must be used within 48 hours of harvesting.',
 NULL, '{"topic": "plague cure", "urgency": "high"}', 5, '2026-02-05T14:00:00Z', '2026-02-03T15:00:00Z'),

('77777777-7777-7777-7777-777777777717', '11111111-1111-1111-1111-111111111101', 'emotional', 'critical', 1.0,
 'The night I fled Valdris. The royal guards breaking down my mentor''s door. Her screams. Running through the secret tunnel she had shown me months earlier. I will never forget the smell of smoke and lavender.',
 NULL, '{"emotion": "terror and grief", "event": "Valdris coup", "person": "Mentor Lysara"}', 1, '2026-01-05T03:00:00Z', '2023-03-15T02:00:00Z'),

('77777777-7777-7777-7777-777777777718', '11111111-1111-1111-1111-111111111101', 'procedural', 'significant', 0.8,
 'The Valdrian method of essence extraction: crush herbs with a marble mortar under moonlight, add three drops of morning dew, heat over a low flame of juniper wood. This preserves magical properties.',
 NULL, '{"skill": "Valdrian alchemy", "level": "advanced", "secret": true}', 3, '2026-02-03T09:00:00Z', '2025-06-01T10:00:00Z'),

('77777777-7777-7777-7777-777777777719', '11111111-1111-1111-1111-111111111101', 'episodic', 'significant', 0.75,
 'Alaric recognized my knowledge of Valdrian court alchemy. He said nothing directly but gave me a knowing look. I believe he knows who I am. Strangely, I feel safer knowing someone trustworthy might know my secret.',
 NULL, '{"npc": "Alaric", "emotion": "anxious relief"}', 2, '2026-02-10T16:00:00Z', '2026-01-05T16:30:00Z'),

('77777777-7777-7777-7777-777777777720', '11111111-1111-1111-1111-111111111101', 'episodic', 'moderate', 0.6,
 'Captain Roderick questioned me about my past. I deflected, but he is suspicious. He has the instincts of a trained investigator. I must be more careful around him.',
 NULL, '{"npc": "Roderick", "emotion": "fear"}', 2, '2026-02-05T12:00:00Z', '2026-01-20T09:30:00Z'),

-- === CAPTAIN RODERICK MEMORIES ===
('77777777-7777-7777-7777-777777777721', '11111111-1111-1111-1111-111111111102', 'episodic', 'significant', 0.85,
 'Caught Shadow Fox sneaking around the old warehouse at midnight. Claims to be a freelance investigator. Story is plausible but I don''t trust easily. Keeping a close watch.',
 NULL, '{"player_id": "player_shadow_fox", "location": "Old Warehouse", "emotion": "suspicion"}', 3, '2026-02-07T07:00:00Z', '2026-01-30T22:10:00Z'),

('77777777-7777-7777-7777-777777777722', '11111111-1111-1111-1111-111111111102', 'episodic', 'significant', 0.8,
 'Ironheart reported fresh military boot tracks near the eastern perimeter heading toward Ashwood Pass. 8-10 individuals. Confirms increased bandit activity. Doubled the eastern patrol.',
 NULL, '{"player_id": "player_ironheart", "location": "Training Grounds"}', 2, '2026-02-07T07:15:00Z', '2026-02-07T07:08:00Z'),

('77777777-7777-7777-7777-777777777723', '11111111-1111-1111-1111-111111111102', 'emotional', 'critical', 1.0,
 'The Ashwood Pass ambush. Fifty-three men of the Seventh Regiment. I gave the order to advance. I survived. They didn''t. The screams haunt my dreams. I will NOT let Millhaven become another Ashwood.',
 NULL, '{"emotion": "guilt and determination", "event": "Ashwood Pass ambush", "casualties": 53}', 1, '2026-01-01T03:00:00Z', '2022-09-15T05:00:00Z'),

('77777777-7777-7777-7777-777777777724', '11111111-1111-1111-1111-111111111102', 'semantic', 'moderate', 0.65,
 'The herbalist Mira is hiding something. Her knowledge is too refined for a simple village healer. Trained, precise, like someone from a noble house or academy. Filed for further investigation.',
 NULL, '{"topic": "Mira investigation", "threat_level": "unknown"}', 4, '2026-02-06T10:00:00Z', '2026-01-20T10:00:00Z'),

('77777777-7777-7777-7777-777777777725', '11111111-1111-1111-1111-111111111102', 'procedural', 'significant', 0.75,
 'Millhaven defense protocol: three watchtower positions, rotating 4-hour shifts, signal fires for emergencies. Eastern approach is the vulnerability — open ground with minimal cover.',
 NULL, '{"skill": "tactical planning", "location": "Millhaven"}', 6, '2026-02-12T06:00:00Z', '2025-11-01T08:00:00Z'),

('77777777-7777-7777-7777-777777777726', '11111111-1111-1111-1111-111111111102', 'episodic', 'moderate', 0.55,
 'Alaric provided old maps showing tunnel systems beneath Millhaven dating back to Aethermoor. Potential security risk — or escape route. Need to explore and secure them.',
 NULL, '{"npc": "Alaric", "topic": "tunnel systems"}', 2, '2026-02-06T11:00:00Z', '2026-01-14T16:30:00Z'),

-- === OLD SAGE ALARIC MEMORIES ===
('77777777-7777-7777-7777-777777777727', '11111111-1111-1111-1111-111111111103', 'episodic', 'critical', 0.95,
 'Nightbloom brought inscriptions from the northern ruins — Pre-Aethermoorian glyphs with a preservation ward still intact! The tablet speaks of a "convergence" and a "key that opens the sky." This could be a fragment of the Starfall Prophecy.',
 NULL, '{"player_id": "player_nightbloom", "location": "Alaric''s Tower", "emotion": "excitement"}', 3, '2026-02-13T09:00:00Z', '2026-02-11T09:25:00Z'),

('77777777-7777-7777-7777-777777777728', '11111111-1111-1111-1111-111111111103', 'semantic', 'critical', 1.0,
 'The Starfall Prophecy: A celestial alignment triggers a dimensional convergence every 1,024 years. The last occurrence destroyed Aethermoor. Next alignment is within the current year. Ancient texts mention a crystal key that could prevent or cause the catastrophe.',
 NULL, '{"topic": "Starfall Prophecy", "urgency": "extreme"}', 8, '2026-02-13T10:00:00Z', '2025-03-01T14:00:00Z'),

('77777777-7777-7777-7777-777777777729', '11111111-1111-1111-1111-111111111103', 'episodic', 'significant', 0.8,
 'I recognized Mira''s knowledge of Valdrian court alchemy. She is almost certainly a former court alchemist who fled during the coup. I chose to protect her secret. Her skills are valuable, and her past is her own affair.',
 NULL, '{"npc": "Mira", "topic": "identity discovery"}', 2, '2026-02-10T16:00:00Z', '2026-01-05T16:30:00Z'),

('77777777-7777-7777-7777-777777777730', '11111111-1111-1111-1111-111111111103', 'semantic', 'significant', 0.85,
 'The Grand Academy of Luminara has become politically compromised. The new chancellor prioritizes military applications over pure research. My decision to leave was right.',
 NULL, '{"topic": "Grand Academy politics"}', 1, '2025-12-01T10:00:00Z', '2025-01-15T11:00:00Z'),

('77777777-7777-7777-7777-777777777731', '11111111-1111-1111-1111-111111111103', 'procedural', 'moderate', 0.7,
 'Ancient ward detection: sprinkle powdered quartz in a circle, recite the Third Invocation, observe refraction patterns. Blue = preservation, red = defensive, green = concealment.',
 NULL, '{"skill": "ancient ward detection", "level": "expert"}', 4, '2026-02-11T09:30:00Z', '2024-08-20T09:00:00Z'),

('77777777-7777-7777-7777-777777777732', '11111111-1111-1111-1111-111111111103', 'emotional', 'moderate', 0.75,
 'Weekly chess game with Thoren at the tavern. He always loses but never stops trying. His enthusiasm reminds me that knowledge is meant to be shared. Grateful for his friendship.',
 NULL, '{"emotion": "gratitude", "npc": "Thoren"}', 3, '2026-02-03T21:00:00Z', '2025-07-01T20:00:00Z'),

-- === LUNA MEMORIES ===
('77777777-7777-7777-7777-777777777733', '11111111-1111-1111-1111-111111111104', 'episodic', 'significant', 0.85,
 'Wanderer Kai proposed a partnership for a trade route through old dwarven tunnels in the Crystalpine Mountains. Three weeks shorter! Offered 60-40 in his favor. Could be my biggest deal yet.',
 NULL, '{"player_id": "player_wanderer_kai", "location": "The Golden Tankard"}', 2, '2026-02-09T10:00:00Z', '2026-02-06T18:15:00Z'),

('77777777-7777-7777-7777-777777777734', '11111111-1111-1111-1111-111111111104', 'semantic', 'moderate', 0.7,
 'Millhaven trade assessment: population ~500, moderate demand for exotic goods, strong demand for tools and food. Key contacts: Elara (metals), Thoren (food), Mira (herbs). Well-positioned as a waypoint.',
 NULL, '{"topic": "market analysis", "location": "Millhaven"}', 5, '2026-02-10T09:00:00Z', '2025-09-01T12:00:00Z'),

('77777777-7777-7777-7777-777777777735', '11111111-1111-1111-1111-111111111104', 'episodic', 'moderate', 0.6,
 'Organized the Autumn Trade Fair in Millhaven. Twelve merchant stalls, entertainment by traveling bards, record sales. The town council invited me to make it annual.',
 NULL, '{"event": "Autumn Trade Fair", "emotion": "satisfaction"}', 2, '2026-01-05T10:00:00Z', '2025-10-15T18:00:00Z'),

('77777777-7777-7777-7777-777777777736', '11111111-1111-1111-1111-111111111104', 'emotional', 'significant', 0.8,
 'The day I left Portavela against my father''s wishes. He wanted me to run the family''s safe, boring import business. The look on his face — disappointment mixed with reluctant pride. I''ll prove him right to be proud.',
 NULL, '{"emotion": "determination and guilt", "person": "Father"}', 1, '2026-01-01T22:00:00Z', '2024-03-01T06:00:00Z'),

('77777777-7777-7777-7777-777777777737', '11111111-1111-1111-1111-111111111104', 'semantic', 'significant', 0.75,
 'The legendary Sunstone is said to be in the ruins of the Solari Temple, somewhere in the Shimmering Isles. Three expeditions have failed. The stone glows with eternal light and can purify any substance.',
 NULL, '{"topic": "Sunstone", "source": "various sailors"}', 3, '2026-02-06T12:00:00Z', '2025-05-20T15:00:00Z'),

('77777777-7777-7777-7777-777777777738', '11111111-1111-1111-1111-111111111104', 'procedural', 'minor', 0.5,
 'Best haggling technique: start at 40% above your minimum, let them counter, act reluctant, meet in the middle. Always throw in a small bonus item to close — makes them feel like they won.',
 NULL, '{"skill": "negotiation", "level": "expert"}', 8, '2026-02-12T16:00:00Z', '2024-01-10T10:00:00Z');

COMMIT;
