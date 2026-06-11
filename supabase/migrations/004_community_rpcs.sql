-- Top 10 stickers most prioritized across all users
CREATE OR REPLACE FUNCTION get_top_wanted(limit_n INT DEFAULT 10)
RETURNS TABLE(
  sticker_id INT,
  priority_count BIGINT,
  code TEXT, country TEXT, number INT, name TEXT, type TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    s.id AS sticker_id,
    COUNT(us.user_id) AS priority_count,
    s.code, s.country, s.number, s.name, s.type
  FROM user_stickers us
  JOIN stickers s ON s.id = us.sticker_id
  WHERE us.priority > 0
  GROUP BY s.id
  ORDER BY priority_count DESC
  LIMIT limit_n;
$$;

-- Top 10 rarest stickers (fewest owners, among those owned by at least 1 user)
CREATE OR REPLACE FUNCTION get_top_rare(limit_n INT DEFAULT 10)
RETURNS TABLE(
  sticker_id INT,
  owner_count BIGINT,
  code TEXT, country TEXT, number INT, name TEXT, type TEXT
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    s.id AS sticker_id,
    COUNT(us.user_id) AS owner_count,
    s.code, s.country, s.number, s.name, s.type
  FROM stickers s
  INNER JOIN user_stickers us ON us.sticker_id = s.id AND us.quantity >= 1
  GROUP BY s.id
  ORDER BY owner_count ASC
  LIMIT limit_n;
$$;
