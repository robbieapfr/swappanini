-- Leaderboard now includes the current user (so they can see their own rank),
-- exposes an absolute `rank`, an `is_me` flag, and computes the completion %
-- against the real catalogue size (matches the album/home figures).
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
  friendship_status text,
  rank              int,
  is_me             boolean
) LANGUAGE sql STABLE AS $$
  WITH ranked AS (
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
          ) / NULLIF((SELECT COUNT(*) FROM stickers), 0) * 100,
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
  )
  SELECT
    ranked.*,
    ROW_NUMBER() OVER (ORDER BY collection_pct DESC, swap_count DESC)::int AS rank,
    (ranked.id = me) AS is_me
  FROM ranked
  ORDER BY rank;
$$;
