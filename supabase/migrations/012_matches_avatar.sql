-- get_matches now also returns each match's avatar_url, so the Playground
-- cards and the home "best swaps" list can show profile photos.
-- DROP first (return row type changes — 42P13 otherwise).
DROP FUNCTION IF EXISTS get_matches(uuid);
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
  match_score          bigint,
  avatar_url           text
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH my_dupes AS (
    SELECT sticker_id FROM user_stickers WHERE user_id = me AND quantity > 1
  ),
  my_wants AS (
    SELECT s.id AS sticker_id
    FROM stickers s
    LEFT JOIN user_stickers us ON us.sticker_id = s.id AND us.user_id = me
    WHERE us.sticker_id IS NULL OR us.quantity = 0
  ),
  my_priority_wants AS (
    SELECT sticker_id FROM user_stickers WHERE user_id = me AND priority IS NOT NULL
  ),
  agg AS (
    SELECT
      u.id, u.pseudo, u.city, u.country, u.swap_preference, u.avatar_url,
      COUNT(DISTINCT gives.sticker_id) AS i_give_count,
      COUNT(DISTINCT gets.sticker_id)  AS i_get_count,
      COUNT(DISTINCT prio.sticker_id)  AS priority_match_count
    FROM users u
    JOIN my_dupes gives ON NOT EXISTS (
      SELECT 1 FROM user_stickers x
      WHERE x.user_id = u.id AND x.sticker_id = gives.sticker_id AND x.quantity >= 1
    )
    JOIN my_wants gets ON EXISTS (
      SELECT 1 FROM user_stickers y
      WHERE y.user_id = u.id AND y.sticker_id = gets.sticker_id AND y.quantity > 1
    )
    LEFT JOIN my_priority_wants prio ON prio.sticker_id = gets.sticker_id
    WHERE u.id != me
    GROUP BY u.id, u.pseudo, u.city, u.country, u.swap_preference, u.avatar_url
    HAVING COUNT(DISTINCT gives.sticker_id) > 0
       AND COUNT(DISTINCT gets.sticker_id) > 0
  )
  SELECT
    id, pseudo, city, country, swap_preference,
    i_give_count, i_get_count, priority_match_count,
    (LEAST(i_give_count, i_get_count) * 3
      + (i_give_count + i_get_count)
      + priority_match_count * 2) AS match_score,
    avatar_url
  FROM agg
  ORDER BY match_score DESC, priority_match_count DESC
  LIMIT 20;
$$;
