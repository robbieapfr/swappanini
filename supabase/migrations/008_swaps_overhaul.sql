-- ============================================================
-- Exchange system overhaul
--  1. Track how many cards each completed swap moved (metric).
--  2. Let the initiator author the whole proposal (both directions)
--     while it's still pending.
--  3. Apply the actual collection transfer when a swap completes.
--  4. Rank matches by the realistic (balanced) swap size.
-- ============================================================

-- 1. Metric: total cards moved by a completed swap ----------------
ALTER TABLE swaps ADD COLUMN IF NOT EXISTS cards_exchanged INT NOT NULL DEFAULT 0;

-- 2. The initiator defines the full proposal (give + receive items)
--    while the swap is pending, so allow inserting items for either
--    side as long as you initiated that pending swap.
DROP POLICY IF EXISTS "swap_items_insert" ON swap_items;
CREATE POLICY "swap_items_insert"
  ON swap_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM swaps s
    WHERE s.id = swap_id
      AND s.initiator_id = auth.uid()
      AND s.status = 'pending'
  ));

-- 3. Apply the collection transfer atomically on completion.
--    SECURITY DEFINER because it must write BOTH users' rows.
--    Idempotent: a no-op if the swap is already completed.
CREATE OR REPLACE FUNCTION apply_swap_completion(p_swap_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_swap   swaps%ROWTYPE;
  v_item   RECORD;
  v_other  uuid;
  v_total  int;
BEGIN
  SELECT * INTO v_swap FROM swaps WHERE id = p_swap_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'swap % not found', p_swap_id; END IF;
  IF v_swap.status = 'completed' THEN RETURN; END IF;

  FOR v_item IN SELECT * FROM swap_items WHERE swap_id = p_swap_id LOOP
    v_other := CASE
      WHEN v_item.from_user_id = v_swap.initiator_id THEN v_swap.receiver_id
      ELSE v_swap.initiator_id
    END;

    -- Giver loses the traded copies (never below 0).
    UPDATE user_stickers
      SET quantity = GREATEST(quantity - v_item.quantity, 0)
      WHERE user_id = v_item.from_user_id AND sticker_id = v_item.sticker_id;

    -- Receiver gains them (create the row if they were missing it).
    INSERT INTO user_stickers (user_id, sticker_id, quantity)
      VALUES (v_other, v_item.sticker_id, v_item.quantity)
      ON CONFLICT (user_id, sticker_id)
      DO UPDATE SET quantity = user_stickers.quantity + EXCLUDED.quantity;
  END LOOP;

  SELECT COALESCE(SUM(quantity), 0) INTO v_total
    FROM swap_items WHERE swap_id = p_swap_id;

  UPDATE swaps
    SET status = 'completed', cards_exchanged = v_total, updated_at = NOW()
    WHERE id = p_swap_id;
END;
$$;

-- Total cards a user has ever exchanged (the metric, per user).
CREATE OR REPLACE FUNCTION get_cards_exchanged(p_user uuid)
RETURNS int
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(cards_exchanged), 0)::int
  FROM swaps
  WHERE status = 'completed'
    AND (initiator_id = p_user OR receiver_id = p_user);
$$;

-- 4. Rank matches by realistic swap size: balanced tradeable pairs
--    (LEAST of give/get) weigh most, so big mutual swaps surface first.
--    DROP first because the return row type changes (CREATE OR REPLACE
--    cannot alter an existing function's OUT parameters).
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
  match_score          bigint
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
      u.id, u.pseudo, u.city, u.country, u.swap_preference,
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
    GROUP BY u.id, u.pseudo, u.city, u.country, u.swap_preference
    HAVING COUNT(DISTINCT gives.sticker_id) > 0
       AND COUNT(DISTINCT gets.sticker_id) > 0
  )
  SELECT
    id, pseudo, city, country, swap_preference,
    i_give_count, i_get_count, priority_match_count,
    (LEAST(i_give_count, i_get_count) * 3
      + (i_give_count + i_get_count)
      + priority_match_count * 2) AS match_score
  FROM agg
  ORDER BY match_score DESC, priority_match_count DESC
  LIMIT 20;
$$;
