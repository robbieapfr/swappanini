-- ============================================================
-- SWAP'26 — Initial schema
-- ============================================================

-- ------------------------------------------------------------
-- 1. STICKERS CATALOGUE (980 rows, static data)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stickers (
  id          SERIAL PRIMARY KEY,
  code        TEXT NOT NULL,
  country     TEXT NOT NULL,
  number      INT  NOT NULL,
  name        TEXT,
  type        TEXT NOT NULL CHECK (type IN ('Joueur', 'Foil/Spécial', 'Photo d''équipe')),
  club        TEXT,
  image_url   TEXT,
  UNIQUE (country, number)
);

-- ------------------------------------------------------------
-- 2. USER PROFILES (extends auth.users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pseudo          TEXT NOT NULL UNIQUE,
  first_name      TEXT,
  last_name       TEXT,
  country         TEXT NOT NULL,
  city            TEXT,
  supported_club  TEXT,
  swap_preference TEXT NOT NULL DEFAULT 'both'
                  CHECK (swap_preference IN ('mail', 'inperson', 'both')),
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 3. USER COLLECTION
-- No row      = sticker missing (implicitly wanted)
-- quantity=1  = owned, not available for swap
-- quantity>=2 = owned with spare(s) available for swap
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_stickers (
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  sticker_id  INT  REFERENCES stickers(id) ON DELETE CASCADE,
  quantity    INT  NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  wanted      BOOLEAN DEFAULT FALSE,
  priority    INT CHECK (priority BETWEEN 1 AND 5),
  PRIMARY KEY (user_id, sticker_id)
);

-- ------------------------------------------------------------
-- 4. SWAPS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS swaps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN (
                  'pending', 'accepted', 'initiator_sent',
                  'receiver_sent', 'completed', 'refused', 'cancelled'
                )),
  swap_mode     TEXT NOT NULL CHECK (swap_mode IN ('mail', 'inperson')),
  message       TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS swap_items (
  id            SERIAL PRIMARY KEY,
  swap_id       UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  sticker_id    INT  NOT NULL REFERENCES stickers(id),
  from_user_id  UUID NOT NULL REFERENCES users(id),
  quantity      INT  NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS swap_messages (
  id          SERIAL PRIMARY KEY,
  swap_id     UUID NOT NULL REFERENCES swaps(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES users(id),
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 5. GAMIFICATION
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  description      TEXT,
  condition_type   TEXT NOT NULL,
  condition_value  JSONB NOT NULL,
  image_url        TEXT
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id   INT  REFERENCES badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ------------------------------------------------------------
-- 6. INDEXES
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_stickers_dupes   ON user_stickers(sticker_id) WHERE quantity > 1;
CREATE INDEX IF NOT EXISTS idx_user_stickers_user    ON user_stickers(user_id, sticker_id);
CREATE INDEX IF NOT EXISTS idx_swaps_initiator       ON swaps(initiator_id);
CREATE INDEX IF NOT EXISTS idx_swaps_receiver        ON swaps(receiver_id);
CREATE INDEX IF NOT EXISTS idx_swap_messages_thread  ON swap_messages(swap_id, created_at);

-- Auto-update updated_at on swaps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER swaps_updated_at
  BEFORE UPDATE ON swaps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- 7. ROW LEVEL SECURITY
-- ------------------------------------------------------------
ALTER TABLE stickers      ENABLE ROW LEVEL SECURITY;
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE swaps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE swap_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges   ENABLE ROW LEVEL SECURITY;

-- stickers: public read
CREATE POLICY "stickers_public_read"
  ON stickers FOR SELECT USING (true);

-- users: public read, own write
CREATE POLICY "users_public_read"
  ON users FOR SELECT USING (true);
CREATE POLICY "users_own_write"
  ON users FOR ALL USING (auth.uid() = id);

-- user_stickers: public read (needed for matching), own write
CREATE POLICY "user_stickers_public_read"
  ON user_stickers FOR SELECT USING (true);
CREATE POLICY "user_stickers_own_write"
  ON user_stickers FOR ALL USING (auth.uid() = user_id);

-- swaps: only participants
CREATE POLICY "swaps_participants_read"
  ON swaps FOR SELECT
  USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);
CREATE POLICY "swaps_initiator_insert"
  ON swaps FOR INSERT
  WITH CHECK (auth.uid() = initiator_id);
CREATE POLICY "swaps_participants_update"
  ON swaps FOR UPDATE
  USING (auth.uid() = initiator_id OR auth.uid() = receiver_id);

-- swap_items: participants of parent swap
CREATE POLICY "swap_items_read"
  ON swap_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
      AND (s.initiator_id = auth.uid() OR s.receiver_id = auth.uid())
  ));
CREATE POLICY "swap_items_insert"
  ON swap_items FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

-- swap_messages: participants, only on active swaps
CREATE POLICY "swap_messages_read"
  ON swap_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
      AND (s.initiator_id = auth.uid() OR s.receiver_id = auth.uid())
  ));
CREATE POLICY "swap_messages_insert"
  ON swap_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM swaps s
      WHERE s.id = swap_id
        AND (s.initiator_id = auth.uid() OR s.receiver_id = auth.uid())
        AND s.status NOT IN ('completed', 'refused', 'cancelled')
    )
  );

-- badges: public read
CREATE POLICY "badges_public_read"
  ON badges FOR SELECT USING (true);
CREATE POLICY "user_badges_own_read"
  ON user_badges FOR SELECT USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 8. MATCHING RPC FUNCTION
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_matches(me uuid)
RETURNS TABLE (
  id                   uuid,
  pseudo               text,
  city                 text,
  country              text,
  swap_preference      text,
  i_give_count         bigint,
  i_get_count          bigint,
  priority_match_count bigint,
  match_score          bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH my_dupes AS (
    SELECT sticker_id
    FROM user_stickers
    WHERE user_id = me AND quantity > 1
  ),
  my_wants AS (
    SELECT s.id AS sticker_id
    FROM stickers s
    LEFT JOIN user_stickers us ON us.sticker_id = s.id AND us.user_id = me
    WHERE us.sticker_id IS NULL
  ),
  my_priority_wants AS (
    SELECT sticker_id
    FROM user_stickers
    WHERE user_id = me AND priority IS NOT NULL
  )
  SELECT
    u.id,
    u.pseudo,
    u.city,
    u.country,
    u.swap_preference,
    COUNT(DISTINCT gives.sticker_id)    AS i_give_count,
    COUNT(DISTINCT gets.sticker_id)     AS i_get_count,
    COUNT(DISTINCT prio.sticker_id)     AS priority_match_count,
    COUNT(DISTINCT gives.sticker_id)
      + COUNT(DISTINCT gets.sticker_id)
      + COUNT(DISTINCT prio.sticker_id) * 2 AS match_score
  FROM users u
  JOIN my_dupes gives ON NOT EXISTS (
    SELECT 1 FROM user_stickers x
    WHERE x.user_id = u.id AND x.sticker_id = gives.sticker_id
  )
  JOIN my_wants gets ON EXISTS (
    SELECT 1 FROM user_stickers y
    WHERE y.user_id = u.id AND y.sticker_id = gets.sticker_id AND y.quantity > 1
  )
  LEFT JOIN my_priority_wants prio ON prio.sticker_id = gets.sticker_id
  WHERE u.id != me
  GROUP BY u.id, u.pseudo, u.city, u.country, u.swap_preference
  HAVING COUNT(DISTINCT gives.sticker_id) > 0
     AND COUNT(DISTINCT gets.sticker_id) > 0
  ORDER BY match_score DESC, priority_match_count DESC
  LIMIT 20;
$$;

-- ------------------------------------------------------------
-- 9. SEED — Badges de départ
-- ------------------------------------------------------------
INSERT INTO badges (name, description, condition_type, condition_value) VALUES
  ('Premier échange',       'Tu as complété ton premier échange !',        'swap_count',      '{"count": 1}'),
  ('5 étoiles',             'Tu as complété 5 échanges.',                  'swap_count',      '{"count": 5}'),
  ('Échange international', 'Tu as échangé avec quelqu''un d''un autre pays.', 'international_swap', '{}'),
  ('Collection complète',   'Tu as complété l''album !',                   'collection_pct',  '{"pct": 100}')
ON CONFLICT DO NOTHING;
