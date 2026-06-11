-- ─────────────────────────────────────────────────────────────
-- 002 — Friendships + Leaderboard RPC + Friend boost in get_matches
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

-- ── 1. Friendships table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS friendships (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (requester_id, addressee_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- View own requests (either direction)
CREATE POLICY "friendships_select" ON friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Only requester can create
CREATE POLICY "friendships_insert" ON friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

-- Only addressee can accept/decline
CREATE POLICY "friendships_update" ON friendships FOR UPDATE
  USING (auth.uid() = addressee_id);

-- Either party can delete (remove friend / cancel request)
CREATE POLICY "friendships_delete" ON friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);


-- ── 2. Updated get_matches with friend boost (+10 pts) ────────
-- Must drop first because the return type signature changes
DROP FUNCTION IF EXISTS get_matches(uuid);
CREATE OR REPLACE FUNCTION get_matches(me uuid)
RETURNS TABLE(
  id                   uuid,
  pseudo               text,
  city                 text,
  country              text,
  swap_preference      text,
  i_give_count         int,
  i_get_count          int,
  priority_match_count int,
  match_score          int
) LANGUAGE sql STABLE AS $$
  WITH
    -- My stickers with doubles (available to give)
    my_dupes AS (
      SELECT sticker_id
      FROM user_stickers
      WHERE user_id = me AND quantity >= 2
    ),
    -- Stickers I'm missing (no row, or row with qty=0)
    my_wants AS (
      SELECT s.id AS sticker_id
      FROM stickers s
      WHERE NOT EXISTS (
        SELECT 1 FROM user_stickers us
        WHERE us.user_id = me
          AND us.sticker_id = s.id
          AND us.quantity >= 1
      )
    ),
    -- My priority wants (explicitly pinned)
    my_priority_wants AS (
      SELECT sticker_id
      FROM user_stickers
      WHERE user_id = me
        AND (quantity = 0 OR quantity IS NULL)
        AND priority IS NOT NULL
    ),
    -- My accepted friends
    my_friends AS (
      SELECT CASE
        WHEN requester_id = me THEN addressee_id
        ELSE requester_id
      END AS friend_id
      FROM friendships
      WHERE (requester_id = me OR addressee_id = me)
        AND status = 'accepted'
    )
  SELECT
    u.id,
    u.pseudo,
    u.city,
    u.country,
    u.swap_preference::text,
    -- Stickers I can GIVE them (my doubles that they're missing)
    COUNT(DISTINCT CASE
      WHEN md.sticker_id IS NOT NULL
       AND NOT EXISTS (
         SELECT 1 FROM user_stickers us2
         WHERE us2.user_id = u.id
           AND us2.sticker_id = md.sticker_id
           AND us2.quantity >= 1
       )
      THEN md.sticker_id
    END)::int AS i_give_count,
    -- Stickers I'd GET from them (their doubles that I need)
    COUNT(DISTINCT CASE
      WHEN mw.sticker_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM user_stickers us3
         WHERE us3.user_id = u.id
           AND us3.sticker_id = mw.sticker_id
           AND us3.quantity >= 2
       )
      THEN mw.sticker_id
    END)::int AS i_get_count,
    -- Priority matches (doubles they have that I pinned as priority)
    COUNT(DISTINCT CASE
      WHEN mpw.sticker_id IS NOT NULL
       AND EXISTS (
         SELECT 1 FROM user_stickers us4
         WHERE us4.user_id = u.id
           AND us4.sticker_id = mpw.sticker_id
           AND us4.quantity >= 2
       )
      THEN mpw.sticker_id
    END)::int AS priority_match_count,
    -- Score = give + get + priority×2 + friend bonus
    (
      COUNT(DISTINCT CASE
        WHEN md.sticker_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM user_stickers us2
           WHERE us2.user_id = u.id AND us2.sticker_id = md.sticker_id AND us2.quantity >= 1
         )
        THEN md.sticker_id END)
      + COUNT(DISTINCT CASE
          WHEN mw.sticker_id IS NOT NULL
           AND EXISTS (SELECT 1 FROM user_stickers us3 WHERE us3.user_id = u.id AND us3.sticker_id = mw.sticker_id AND us3.quantity >= 2)
          THEN mw.sticker_id END)
      + COUNT(DISTINCT CASE
          WHEN mpw.sticker_id IS NOT NULL
           AND EXISTS (SELECT 1 FROM user_stickers us4 WHERE us4.user_id = u.id AND us4.sticker_id = mpw.sticker_id AND us4.quantity >= 2)
          THEN mpw.sticker_id END) * 2
      + CASE WHEN mf.friend_id IS NOT NULL THEN 10 ELSE 0 END
    )::int AS match_score

  FROM users u
  LEFT JOIN my_dupes   md  ON true
  LEFT JOIN my_wants   mw  ON true
  LEFT JOIN my_priority_wants mpw ON true
  LEFT JOIN my_friends mf  ON mf.friend_id = u.id
  WHERE u.id != me
  GROUP BY u.id, u.pseudo, u.city, u.country, u.swap_preference, mf.friend_id
  HAVING
    COUNT(DISTINCT CASE
      WHEN md.sticker_id IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM user_stickers us2 WHERE us2.user_id = u.id AND us2.sticker_id = md.sticker_id AND us2.quantity >= 1)
      THEN md.sticker_id END)
    + COUNT(DISTINCT CASE
        WHEN mw.sticker_id IS NOT NULL
         AND EXISTS (SELECT 1 FROM user_stickers us3 WHERE us3.user_id = u.id AND us3.sticker_id = mw.sticker_id AND us3.quantity >= 2)
        THEN mw.sticker_id END)
    > 0
  ORDER BY match_score DESC, i_get_count DESC
$$;


-- ── 3. Leaderboard RPC ────────────────────────────────────────
DROP FUNCTION IF EXISTS get_leaderboard(uuid);
CREATE OR REPLACE FUNCTION get_leaderboard(me uuid)
RETURNS TABLE(
  id                uuid,
  pseudo            text,
  city              text,
  country           text,
  collection_pct    numeric,
  swap_count        int,
  badge_count       int,
  friendship_status text
) LANGUAGE sql STABLE AS $$
  SELECT
    u.id,
    u.pseudo,
    u.city,
    u.country,
    ROUND(
      COALESCE(
        (SELECT COUNT(*)::numeric
         FROM user_stickers us
         WHERE us.user_id = u.id AND us.quantity >= 1
        ) / 980.0 * 100,
        0
      ), 1
    ) AS collection_pct,
    COALESCE(
      (SELECT COUNT(*)::int
       FROM swaps s
       WHERE (s.initiator_id = u.id OR s.receiver_id = u.id)
         AND s.status = 'completed'
      ), 0
    ) AS swap_count,
    COALESCE(
      (SELECT COUNT(*)::int FROM user_badges ub WHERE ub.user_id = u.id),
      0
    ) AS badge_count,
    COALESCE(
      (SELECT f.status
       FROM friendships f
       WHERE (f.requester_id = me AND f.addressee_id = u.id)
          OR (f.addressee_id = me AND f.requester_id = u.id)
       LIMIT 1
      ), 'none'
    ) AS friendship_status
  FROM users u
  WHERE u.id != me
  ORDER BY collection_pct DESC, swap_count DESC;
$$;
